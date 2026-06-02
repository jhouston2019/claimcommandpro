/**
 * ai-policy-review.js — Property policy analysis (Claim Command Center Phase 02)
 * Modeled on analyze-medical-bill.js: file in → structured JSON out, guest-safe, no payment gate.
 */

const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { runOpenAI } = require('./lib/ai-utils');
const {
  deleteOpenAIFile,
  uploadPdfToOpenAI,
  decodeBase64Payload,
  extractFirstPages
} = require('./lib/policy-pdf-utils');

const LARGE_PDF_DECLARATION_PAGES = 4;

const MAX_TEXT = 48000;
const MIN_POLICY_TEXT = 50;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOKENS = 4096;
/** Large base64 payloads (Goodson-type PDFs) — skip pdf-parse, upload to OpenAI once. */
const LARGE_BASE64_CHARS = 1_000_000;

const LARGE_PDF_SYSTEM_PROMPT =
  'Return valid JSON: { policy_type, carrier, settlement_type, deductible, dwelling_coverage, contents_coverage, ale_coverage, coverages[], endorsements[], exclusions[], coverage_gaps[], summary_for_user, confidence }';

const LARGE_PDF_USER_PROMPT =
  'Extract all insurance policy coverages, limits, deductibles, endorsements, and exclusions. Return only the JSON schema provided in the system prompt. Focus on: dwelling limit, personal property limit, loss of use limit, deductible, settlement type, endorsements.';

const SYSTEM_PROMPT = `You are an expert property insurance policy analyst. Extract every coverage, limit, endorsement, exclusion, and gap from the policy. Return only valid JSON matching this schema exactly:
{
  "success": true,
  "confidence": "high|medium|low",
  "policy_type": "string",
  "carrier": "string",
  "policy_number": "string|null",
  "settlement_type": "RCV|ACV",
  "deductible": "number|null",
  "dwelling_coverage": "number|null",
  "contents_coverage": "number|null",
  "ale_coverage": "number|null",
  "coverages": [{"label": "string", "limit": "number|null", "applied_by_carrier": "yes|no|partial|unknown", "description": "string"}],
  "endorsements": [{"name": "string", "limit": "number|null", "applies_to_claim": "boolean", "description": "string"}],
  "exclusions": [{"name": "string", "description": "string", "affects_claim": "boolean"}],
  "coverage_gaps": [{"coverage": "string", "reason_not_applied": "string", "potential_value": "number|null", "action_required": "string"}],
  "gaps_found": "number",
  "recommended_actions": ["string"],
  "summary_for_user": "string"
}

Rules:
- Never fabricate dollar limits; use null if not stated in the document.
- gaps_found must equal coverage_gaps.length.
- applied_by_carrier reflects carrier behavior on the active claim when claim context is provided.
- If the document is incomplete, set confidence to low or medium and say so in summary_for_user.`;

const RETRY_SUFFIX =
  '\n\nIMPORTANT: Return ONLY a raw JSON object matching the schema. No markdown. No code fences. Populate coverages from the document.';

function corsHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Preview',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...extra
  };
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function detectMime(buf) {
  if (!buf || buf.length < 4) return 'application/octet-stream';
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  return 'application/octet-stream';
}

function resolveMime(buf, declared) {
  const d = detectMime(buf);
  if (d === 'application/pdf' || d === 'image/jpeg' || d === 'image/png') return d;
  if (['application/pdf', 'image/jpeg', 'image/png'].includes(declared)) return declared;
  return d;
}

/** $ + coverage keywords + min 500 chars (filters custom-font pdf-parse garbage). */
function textHasPolicySignals(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 500) return false;
  const hasDollar = /\$/.test(t);
  const hasKw = /\b(dwelling|liability|deductible|coverage)\b/i.test(t);
  return hasDollar && hasKw;
}

function claimContext(body) {
  return {
    insurer: body.insurer || 'Unknown',
    property_type: body.property_type || 'Unknown',
    date_of_loss: body.date_of_loss || 'Unknown',
    claim_type: body.claim_type || body.claimType || 'Unknown',
    jurisdiction: body.jurisdiction || body.state || 'Unknown'
  };
}

function buildUserPrompt(policyText, ctx, { retry, degraded } = {}) {
  const note = degraded
    ? '\nNOTE: Text extraction was partial. Use the attached policy or text carefully; do not invent limits.'
    : '';
  const retryNote = retry ? RETRY_SUFFIX : '';
  return `POLICY TEXT:
${policyText || '[Policy document attached as PDF]'}

CLAIM CONTEXT:
- Insurer: ${ctx.insurer}
- Property: ${ctx.property_type}
- Date of loss: ${ctx.date_of_loss}
- Cause / claim type: ${ctx.claim_type}
- Jurisdiction: ${ctx.jurisdiction}${note}${retryNote}

Analyze this policy for the claim above and return the JSON object.`;
}

async function loadFileFromBody(supabase, body) {
  const mimeDeclared = body.file_mime_type || body.fileType || 'application/pdf';

  if (body.file_base64 && String(body.file_base64).length > 0) {
    const clean = String(body.file_base64).replace(/^data:.+;base64,/, '');
    const buffer = Buffer.from(clean, 'base64');
    if (buffer.length > MAX_FILE_BYTES) throw new Error('File too large (max 15MB)');
    if (buffer.length === 0) return null;
    return {
      buffer,
      base64: clean,
      mime: resolveMime(buffer, mimeDeclared)
    };
  }

  if (body.storage_path && supabase) {
    const { data, error } = await supabase.storage.from('claim-documents').download(body.storage_path);
    if (error || !data) {
      console.warn('[ai-policy-review] storage download failed:', error?.message);
      return null;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    if (buffer.length > MAX_FILE_BYTES) throw new Error('File too large (max 15MB)');
    return {
      buffer,
      base64: buffer.toString('base64'),
      mime: resolveMime(buffer, mimeDeclared)
    };
  }

  return null;
}

async function tryPdfParse(buffer, maxPages = 15) {
  try {
    const data = await pdfParse(buffer, { max: maxPages });
    return String(data?.text || '').trim();
  } catch (e) {
    console.warn('[ai-policy-review] pdf-parse failed:', e.message);
    return '';
  }
}

/**
 * Resolve text for GPT and whether to use OpenAI file API on the PDF.
 */
async function resolveExtraction(file, policyTextInput) {
  let policyText = String(policyTextInput || '').trim();
  let extractionDegraded = false;
  let usePdfDirect = false;
  let pdfDataUrl = null;

  if (!file) {
    extractionDegraded = policyText.length > 0 && !textHasPolicySignals(policyText);
    return { policyText, extractionDegraded, usePdfDirect: false, pdfDataUrl: null };
  }

  if (file.mime === 'application/pdf') {
    const quick = await tryPdfParse(file.buffer, 8);
    if (textHasPolicySignals(quick)) {
      const full = quick.length >= 500 ? quick : await tryPdfParse(file.buffer, 30);
      policyText = textHasPolicySignals(full) ? full : quick;
      extractionDegraded = false;
    } else if (textHasPolicySignals(policyText)) {
      extractionDegraded = false;
    } else {
      usePdfDirect = true;
      extractionDegraded = true;
      pdfDataUrl = `data:application/pdf;base64,${file.base64}`;
      console.log('[ai-policy-review] using PDF file API (text extract unusable)');
      if (!policyText) policyText = quick.slice(0, 1500) || '[Policy PDF attached]';
    }
  } else {
    extractionDegraded = true;
    policyText = policyText || '[Image policy document — analyze from file]';
  }

  if (policyText.length > MAX_TEXT) {
    policyText = policyText.slice(0, MAX_TEXT) + '\n[TRUNCATED]';
  }

  return { policyText, extractionDegraded, usePdfDirect, pdfDataUrl };
}

function parseJsonFromLlm(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('empty AI response');
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

function validateCanonical(p) {
  if (!p || typeof p !== 'object') return false;
  if (!Array.isArray(p.coverages)) return false;
  if (typeof p.summary_for_user !== 'string' || p.summary_for_user.length < 10) return false;
  const blob = JSON.stringify(p);
  if (blob.includes('"string —') || blob.includes('"number —')) return false;
  return true;
}

function hasSubstance(p) {
  if ((p.coverages || []).length > 0) return true;
  if ((p.endorsements || []).length > 0) return true;
  if (typeof p.deductible === 'number' && p.deductible > 0) return true;
  if (typeof p.dwelling_coverage === 'number') return true;
  const sum = (p.summary_for_user || '').toLowerCase();
  if (/could not be completed|please re-upload|no specific details|document provided\. please/.test(sum)) {
    return false;
  }
  return sum.length > 80;
}

function normalizeCanonical(parsed, ctx, extractionDegraded) {
  const coverages = (parsed.coverages || []).map((c) => ({
    label: String(c.label || 'Coverage'),
    limit: typeof c.limit === 'number' ? c.limit : null,
    applied_by_carrier: ['yes', 'no', 'partial', 'unknown'].includes(c.applied_by_carrier)
      ? c.applied_by_carrier
      : 'unknown',
    description: String(c.description || '')
  }));

  const findLimit = (keys) =>
    coverages.find((c) => keys.some((k) => c.label.toLowerCase().includes(k)))?.limit ?? null;

  const coverage_gaps = (parsed.coverage_gaps || []).map((g) => ({
    coverage: String(g.coverage || ''),
    reason_not_applied: String(g.reason_not_applied || ''),
    potential_value: typeof g.potential_value === 'number' ? g.potential_value : null,
    action_required: String(g.action_required || '')
  }));

  let confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium';
  if (extractionDegraded) confidence = confidence === 'high' ? 'medium' : 'low';

  const dwelling =
    typeof parsed.dwelling_coverage === 'number'
      ? parsed.dwelling_coverage
      : findLimit(['dwelling', 'coverage a']);
  const contents =
    typeof parsed.contents_coverage === 'number'
      ? parsed.contents_coverage
      : findLimit(['contents', 'coverage c', 'personal property']);
  const ale =
    typeof parsed.ale_coverage === 'number'
      ? parsed.ale_coverage
      : findLimit(['ale', 'loss of use', 'coverage d', 'additional living']);

  return {
    success: true,
    confidence,
    extraction_degraded: extractionDegraded === true,
    policy_type: String(parsed.policy_type || 'Unknown'),
    carrier: String(parsed.carrier || ctx.insurer || ''),
    policy_number: parsed.policy_number != null ? String(parsed.policy_number) : null,
    settlement_type: ['RCV', 'ACV'].includes(parsed.settlement_type) ? parsed.settlement_type : 'RCV',
    deductible: typeof parsed.deductible === 'number' ? parsed.deductible : null,
    dwelling_coverage: dwelling,
    contents_coverage: contents,
    ale_coverage: ale,
    coverages,
    endorsements: (parsed.endorsements || []).map((e) => ({
      name: String(e.name || ''),
      limit: typeof e.limit === 'number' ? e.limit : null,
      applies_to_claim: e.applies_to_claim === true,
      description: String(e.description || '')
    })),
    exclusions: (parsed.exclusions || []).map((e) => ({
      name: String(e.name || ''),
      description: String(e.description || ''),
      affects_claim: e.affects_claim === true
    })),
    coverage_gaps,
    gaps_found: coverage_gaps.length,
    recommended_actions: (parsed.recommended_actions || []).map(String),
    summary_for_user: String(parsed.summary_for_user || '')
  };
}

function bestEffortFromParsed(parsed, ctx, extractionDegraded, reason) {
  const base = normalizeCanonical(
    {
      success: true,
      confidence: 'low',
      policy_type: parsed?.policy_type || 'Unknown',
      carrier: parsed?.carrier || ctx.insurer,
      policy_number: parsed?.policy_number ?? null,
      settlement_type: parsed?.settlement_type || 'RCV',
      deductible: parsed?.deductible ?? null,
      dwelling_coverage: parsed?.dwelling_coverage ?? null,
      contents_coverage: parsed?.contents_coverage ?? null,
      ale_coverage: parsed?.ale_coverage ?? null,
      coverages: parsed?.coverages || [],
      endorsements: parsed?.endorsements || [],
      exclusions: parsed?.exclusions || [],
      coverage_gaps: parsed?.coverage_gaps || [],
      recommended_actions: parsed?.recommended_actions || [
        'Re-upload a complete policy PDF including the declarations page.'
      ],
      summary_for_user:
        parsed?.summary_for_user ||
        `Policy analysis was partial (${reason}). Re-upload your full policy PDF for a complete review.`
    },
    ctx,
    true
  );
  base.extraction_degraded = true;
  base.confidence = 'low';
  return base;
}

function emptyShellResponse(ctx, reason) {
  return {
    success: true,
    error: reason,
    confidence: 'low',
    extraction_degraded: true,
    policy_type: 'Unknown',
    carrier: ctx.insurer || '',
    policy_number: null,
    settlement_type: 'RCV',
    deductible: null,
    dwelling_coverage: null,
    contents_coverage: null,
    ale_coverage: null,
    coverages: [],
    endorsements: [],
    exclusions: [],
    coverage_gaps: [],
    gaps_found: 0,
    recommended_actions: [
      'Upload your complete policy PDF (declarations and endorsements).',
      'Or paste key policy sections into the text area.'
    ],
    summary_for_user: reason
  };
}

function isEmptyShell(out) {
  return (
    !out.coverages?.length &&
    !out.endorsements?.length &&
    out.deductible == null &&
    out.dwelling_coverage == null &&
    out.contents_coverage == null
  );
}

async function analyzePolicy(openai, { policyText, usePdfDirect, pdfDataUrl, ctx, extractionDegraded, retry }) {
  const userContent = buildUserPrompt(policyText, ctx, { retry, degraded: extractionDegraded });

  if (usePdfDirect && pdfDataUrl) {
    return runOpenAI(SYSTEM_PROMPT, userContent, {
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
      pdfFileDataUrl: pdfDataUrl
    });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent }
    ]
  });

  return completion.choices?.[0]?.message?.content || '';
}

/**
 * Analyze using a pre-staged OpenAI file_id (from policy-file-stage — no base64 on this request).
 */
async function analyzeFromOpenAiFileId(openai, fileId, ctx, label) {
  let lastParsed = null;

  for (const retry of [false, true]) {
    try {
      const userContent = retry ? LARGE_PDF_USER_PROMPT + RETRY_SUFFIX : LARGE_PDF_USER_PROMPT;
      const response = await openai.responses.create({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: LARGE_PDF_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: userContent },
              { type: 'input_file', file_id: fileId }
            ]
          }
        ],
        text: { format: { type: 'json_object' } },
        max_output_tokens: MAX_TOKENS
      });

      const rawText = response.output_text;
      if (!rawText) throw new Error('Empty response from PDF file analysis');

      const parsed = parseJsonFromLlm(rawText);
      lastParsed = parsed;
      if (validateCanonical(parsed) && hasSubstance(parsed)) {
        console.log('[ai-policy-review]', label, 'OK', retry ? '(retry)' : '');
        return {
          result: normalizeCanonical(parsed, ctx, false),
          lastParsed: parsed
        };
      }
    } catch (e) {
      console.warn('[ai-policy-review]', label, 'failed:', e.message, retry ? '(retry)' : '');
    }
  }

  if (lastParsed && validateCanonical(lastParsed)) {
    return {
      result: bestEffortFromParsed(lastParsed, ctx, true, 'partial PDF analysis'),
      lastParsed
    };
  }

  return null;
}

async function tryStagedFileIdPath(openai, body, ctx) {
  const fileId = body.openai_file_id;
  if (!fileId || typeof fileId !== 'string') return null;

  console.log('[ai-policy-review] staged file_id path:', fileId);
  try {
    const out = await analyzeFromOpenAiFileId(openai, fileId, ctx, 'staged file_id');
    return out;
  } finally {
    await deleteOpenAIFile(openai, fileId);
  }
}

/**
 * Fallback: large file_base64 on analyze POST — upload + analyze (prefer policy-file-stage from client).
 */
async function tryLargePdfFastPath(openai, body, ctx) {
  const raw = body.file_base64;
  if (!raw || String(raw).length <= LARGE_BASE64_CHARS) return null;

  let buffer;
  try {
    ({ buffer } = decodeBase64Payload(raw));
  } catch (e) {
    console.warn('[ai-policy-review] large path:', e.message);
    return null;
  }

  if (resolveMime(buffer, body.file_mime_type || 'application/pdf') !== 'application/pdf') return null;

  let decPagesBuffer;
  try {
    const { buffer: subset, pagesUsed } = await extractFirstPages(buffer, LARGE_PDF_DECLARATION_PAGES);
    decPagesBuffer = subset;
    console.log(
      '[ai-policy-review] extracted',
      pagesUsed,
      'declaration pages, bytes:',
      decPagesBuffer.length
    );
  } catch (e) {
    console.warn('[ai-policy-review] pdf-lib page extract failed:', e.message);
    return null;
  }

  let uploadedId = null;
  try {
    uploadedId = await uploadPdfToOpenAI(openai, decPagesBuffer);
    return await analyzeFromOpenAiFileId(openai, uploadedId, ctx, 'large base64');
  } catch (e) {
    console.warn('[ai-policy-review] large PDF fast path:', e.message);
    return null;
  } finally {
    await deleteOpenAIFile(openai, uploadedId);
  }
}

async function finalizePolicyResult(result, body, supabase, ctx, lastParsed) {
  let out = result;
  if (!out || isEmptyShell(out)) {
    out = bestEffortFromParsed(
      lastParsed || {},
      ctx,
      true,
      'analysis could not produce complete coverage data'
    );
    if (isEmptyShell(out)) {
      out = emptyShellResponse(
        ctx,
        'Policy analysis could not be completed from the document provided. Please re-upload your full policy PDF and try again.'
      );
    }
  }

  if (body.claim_id && supabase) {
    try {
      await supabase.from('claim_outputs').insert({
        claim_id: body.claim_id,
        output_type: 'policy_analysis',
        content: out,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[ai-policy-review] claim_outputs insert:', e.message);
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(out)
  };
}

async function runPolicyAnalysis(openai, extraction, ctx) {
  const { policyText, extractionDegraded, usePdfDirect, pdfDataUrl } = extraction;
  let lastParsed = null;

  for (const retry of [false, true]) {
    try {
      const raw = await analyzePolicy(openai, {
        policyText,
        usePdfDirect,
        pdfDataUrl,
        ctx,
        extractionDegraded,
        retry
      });
      const parsed = parseJsonFromLlm(raw);
      lastParsed = parsed;
      if (validateCanonical(parsed) && hasSubstance(parsed)) {
        console.log('[ai-policy-review] OK', retry ? '(retry)' : '', usePdfDirect ? 'pdf-file' : 'text');
        const out = normalizeCanonical(parsed, ctx, usePdfDirect ? false : extractionDegraded);
        return { result: out, lastParsed: parsed };
      }
    } catch (e) {
      console.warn('[ai-policy-review] analyze attempt failed:', e.message, usePdfDirect ? '(pdf)' : '(text)');
    }
  }

  if (lastParsed && validateCanonical(lastParsed)) {
    return { result: bestEffortFromParsed(lastParsed, ctx, extractionDegraded, 'incomplete model output'), lastParsed };
  }

  return { result: null, lastParsed };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: false,
        error: 'Invalid JSON body',
        confidence: 'low',
        extraction_degraded: true
      })
    };
  }

  const ctx = claimContext(body);
  const supabase = getSupabaseAdmin();

  const hasFile = !!(body.openai_file_id || body.file_base64 || body.storage_path);
  const hasText = (body.policy_text || '').trim().length >= MIN_POLICY_TEXT;

  if (!hasFile && !hasText) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(
        emptyShellResponse(
          ctx,
          'Upload a policy PDF, provide file_base64, or paste at least 50 characters of policy text.'
        )
      )
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(
        emptyShellResponse(ctx, 'Policy analysis is temporarily unavailable (API not configured).')
      )
    };
  }

  try {
    console.log('[ai-policy-review] input:', {
      openai_file_id: body.openai_file_id || null,
      storage_path: body.storage_path || null,
      file_base64_chars: body.file_base64 ? String(body.file_base64).length : 0,
      policy_text_chars: (body.policy_text || '').length
    });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 110000,
      maxRetries: 1
    });

    // ChatGPT-style path: file already on OpenAI — analyze with file_id only (small JSON body).
    if (body.openai_file_id) {
      const staged = await tryStagedFileIdPath(openai, body, ctx);
      if (staged?.result) {
        return finalizePolicyResult(staged.result, body, supabase, ctx, staged.lastParsed);
      }
    }

    const file = await loadFileFromBody(supabase, body);
    const extraction = await resolveExtraction(file, body.policy_text);

    if (!file && !extraction.policyText && !body.openai_file_id) {
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify(emptyShellResponse(ctx, 'No policy content could be loaded.'))
      };
    }

    const fastPath = await tryLargePdfFastPath(openai, body, ctx);
    if (fastPath?.result) {
      return finalizePolicyResult(fastPath.result, body, supabase, ctx, fastPath.lastParsed);
    }

    const { result: analyzed, lastParsed } = await runPolicyAnalysis(openai, extraction, ctx);
    return finalizePolicyResult(analyzed, body, supabase, ctx, lastParsed);
  } catch (err) {
    console.error('[ai-policy-review] error:', err);
    const msg = err.message?.includes('too large')
      ? err.message
      : 'Policy analysis failed. Please try again with a smaller PDF or paste key sections.';
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(emptyShellResponse(ctx, msg))
    };
  }
};
