/**
 * ai-policy-review.js — Policy analysis for Claim Command Center (Phase 02)
 *
 * Golden path (matches Medical Bill Dispute analyze-medical-bill.js):
 *   POST → load file (storage_path | file_base64) or policy_text
 *   → extractPolicyText (pdf-parse ×2 → vision → context stub; never 422)
 *   → if PDF text weak: analyze via OpenAI Files API on same PDF
 *   → else: GPT-4o JSON on extracted text
 *   → validate, normalize, persist claim_outputs, return canonical JSON
 */

const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { runOpenAI } = require('./lib/ai-utils');

const MAX_TEXT = 20000;
const MAX_TOKENS = 4096;
const MIN_TEXT = 50;
const STUB_PREFIX = '[Policy text could not be extracted';

const VISION_PROMPT =
  'Extract all text from this insurance policy document (declarations, coverages, limits, endorsements, exclusions). ' +
  'Return only raw text, preserving line breaks. Include coverage names, dollar amounts, deductibles, and policy numbers.';

const SYSTEM_PROMPT = `You are an expert property insurance policy analyst (HO-3, HO-5, DP-3, commercial property). Extract coverages, limits, endorsements, exclusions, and coverage gaps relevant to the active claim.

Return ONLY valid JSON matching this schema. No markdown. No code fences.

{
  "policy_type": "HO-3 | HO-5 | DP-3 | Commercial | Unknown",
  "carrier": "string",
  "policy_number": "string or null",
  "effective_date": "string or null",
  "expiration_date": "string or null",
  "settlement_type": "RCV or ACV",
  "deductible": number,
  "coverages": [{"label": "string", "limit": number, "applied_by_carrier": "yes|no|partial|unknown", "description": "string"}],
  "endorsements": [{"name": "string", "limit": number or null, "applies_to_claim": boolean, "description": "string"}],
  "exclusions": [{"name": "string", "description": "string", "affects_claim": boolean}],
  "coverage_gaps": [{"coverage": "string", "reason_not_applied": "string", "potential_value": number or null, "action_required": "string"}],
  "recommended_actions": ["string"],
  "summary_for_user": "string",
  "confidence": "high | medium | low"
}

Rules:
- Never fabricate limits; use null if not in the document.
- coverage_gaps: coverages in the policy not applied by the carrier on this claim.
- applied_by_carrier reflects carrier behavior on the claim, not policy allowance.
- Incomplete text → confidence low/medium and say so in summary_for_user.`;

// ─── CORS / Supabase ─────────────────────────────────────────────────────────

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...cors, 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body)
  };
}

// ─── Auth (optional JWT — missing token = preview, no hard fail) ───────────

async function verifyAccess(event, supabase) {
  const raw = event.headers?.authorization || event.headers?.Authorization || '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { preview: true };
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { preview: true };
    return { preview: false, userId: user.id };
  } catch {
    return { preview: true };
  }
}

// ─── File load (storage or base64) ───────────────────────────────────────────

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

async function loadPolicyFile(supabase, body) {
  const { storage_path, file_base64, file_mime_type } = body;

  if (storage_path) {
    const { data, error } = await supabase.storage.from('claim-documents').download(storage_path);
    if (error || !data) {
      console.warn('[ai-policy-review] storage download failed:', error?.message);
      return null;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    return {
      buffer,
      mime: resolveMime(buffer, 'application/pdf'),
      base64: buffer.toString('base64')
    };
  }

  if (file_base64 && String(file_base64).length > 0) {
    const clean = String(file_base64).replace(/^data:.+;base64,/, '');
    const buffer = Buffer.from(clean, 'base64');
    if (buffer.length > 15 * 1024 * 1024) {
      throw new Error('File too large (max 15MB)');
    }
    return {
      buffer,
      mime: resolveMime(buffer, file_mime_type || 'application/pdf'),
      base64: clean
    };
  }

  return null;
}

// ─── Text extraction (Medical Bill extractBillText → extractPolicyText) ─────

function contextStub(ctx) {
  return (
    `${STUB_PREFIX}. Analyze using claim context only: Insurer=${ctx.insurer || 'Unknown'}, ` +
    `Property=${ctx.property_type || 'Unknown'}, DOL=${ctx.date_of_loss || 'Unknown'}, ` +
    `Cause=${ctx.claim_type || 'Unknown'}, State=${ctx.jurisdiction || 'Unknown'}]`
  );
}

function textLooksUsable(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < MIN_TEXT || t.startsWith(STUB_PREFIX)) return false;
  const hasMoney = /\$\s?\d[\d,]*(\.\d{2})?/.test(t) || /\b\d{1,3}(?:,\d{3})*\.\d{2}\b/.test(t);
  const hasKw = /\b(coverage|dwelling|deductible|endorsement|exclusion|declarations|policy|limit|RCV|ACV|HO-?3|HO-?5|personal\s+property|loss\s+of\s+use)\b/i.test(t);
  if (t.length >= 500 && (hasKw || hasMoney)) return true;
  if (t.length >= 200 && hasKw && hasMoney) return true;
  if (hasKw || hasMoney) return t.length >= 120;
  return t.length >= 400;
}

async function visionExtract(openai, base64, mime) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}`, detail: 'high' } },
        { type: 'text', text: VISION_PROMPT }
      ]
    }]
  });
  return (res.choices?.[0]?.message?.content || '').trim();
}

async function extractPolicyText(openai, buffer, mime, base64, ctx) {
  const b64 = base64 || buffer.toString('base64');
  const fallback = () => contextStub(ctx);

  const parsePdf = async (label, opts) => {
    try {
      const data = opts ? await pdfParse(buffer, opts) : await pdfParse(buffer);
      return String(data?.text || '').trim();
    } catch (e) {
      console.warn(`[ai-policy-review] pdf-parse ${label}:`, e.message);
      return '';
    }
  };

  if (mime === 'image/jpeg' || mime === 'image/png') {
    for (const m of [mime, 'image/jpeg']) {
      try {
        const t = await visionExtract(openai, b64, m);
        if (textLooksUsable(t)) return t;
      } catch (e) {
        console.warn('[ai-policy-review] vision image:', e.message);
      }
    }
    return fallback();
  }

  if (mime !== 'application/pdf') return fallback();

  let text = await parsePdf('1');
  if (textLooksUsable(text)) return text;

  const text2 = await parsePdf('2', { max: 0 });
  if (textLooksUsable(text2)) return text2;
  if (text2.length > text.length) text = text2;

  for (const m of ['application/pdf', 'image/jpeg']) {
    try {
      const t = await visionExtract(openai, b64, m);
      if (textLooksUsable(t)) return t;
    } catch (e) {
      console.warn(`[ai-policy-review] vision ${m}:`, e.message);
    }
  }

  return text.length > 0 ? text : fallback();
}

async function resolvePolicyText(supabase, body, ctx) {
  let text = String(body.policy_text || '').trim();
  let degraded = false;

  const file = await loadPolicyFile(supabase, body);
  if (!file && !text) {
    return { text: contextStub(ctx), degraded: true, pdfDataUrl: null };
  }

  if (!file) {
    degraded = !textLooksUsable(text);
    return { text: text.slice(0, MAX_TEXT) || contextStub(ctx), degraded, pdfDataUrl: null };
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (file.mime === 'application/pdf') {
    try {
      const quick = String((await pdfParse(file.buffer))?.text || '').trim();
      if (textLooksUsable(quick) && (!textLooksUsable(text) || quick.length > text.length)) {
        text = quick;
      }
    } catch (e) {
      console.warn('[ai-policy-review] quick pdf-parse:', e.message);
    }
  }

  if (!textLooksUsable(text)) {
    const extracted = await extractPolicyText(openai, file.buffer, file.mime, file.base64, ctx);
    if (extracted.length > text.length || !textLooksUsable(text)) text = extracted;
  }

  degraded = !textLooksUsable(text) || text.startsWith(STUB_PREFIX);
  if (!text) text = contextStub(ctx);
  if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + '\n[TRUNCATED]';

  const pdfDataUrl =
    file.mime === 'application/pdf' && file.base64
      ? `data:application/pdf;base64,${file.base64}`
      : null;

  return { text, degraded, pdfDataUrl };
}

// ─── Analysis ──────────────────────────────────────────────────────────────

function claimContext(body) {
  return {
    insurer: body.insurer,
    property_type: body.property_type,
    date_of_loss: body.date_of_loss,
    claim_type: body.claim_type,
    jurisdiction: body.jurisdiction
  };
}

function userPrompt(policyText, ctx, { degraded, retry }) {
  const note = degraded
    ? '\nNOTE: Extraction was partial. Use available text and context; set confidence low; do not invent limits.'
    : '';
  const retryNote = retry
    ? '\nIMPORTANT: Return ONLY a raw JSON object. No markdown.'
    : '';
  return `POLICY TEXT:
${policyText}

CLAIM CONTEXT:
- Insurer: ${ctx.insurer || 'Unknown'}
- Property: ${ctx.property_type || 'Unknown'}
- Date of loss: ${ctx.date_of_loss || 'Unknown'}
- Cause: ${ctx.claim_type || 'Unknown'}
- Jurisdiction: ${ctx.jurisdiction || 'Unknown'}${note}${retryNote}`;
}

async function analyzeWithText(policyText, ctx, degraded, retry) {
  return runOpenAI(SYSTEM_PROMPT, userPrompt(policyText, ctx, { degraded, retry }), {
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    response_format: { type: 'json_object' }
  });
}

async function analyzeWithPdf(pdfDataUrl, ctx, retry) {
  const msg =
    'The insurance policy PDF is attached. Read it and extract all coverages, limits, endorsements, and exclusions.' +
    (retry ? ' Return ONLY raw JSON.' : '');
  return runOpenAI(SYSTEM_PROMPT, userPrompt(msg, ctx, { degraded: false, retry }), {
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    pdfFileDataUrl: pdfDataUrl
  });
}

// ─── Output shape (CCC contract) ───────────────────────────────────────────

function validateParsed(p) {
  if (!p || typeof p !== 'object') return false;
  const s = JSON.stringify(p);
  if (s.includes('"string —') || s.includes('"number —')) return false;
  if (!Array.isArray(p.coverages)) return false;
  return typeof p.summary_for_user === 'string' && p.summary_for_user.length > 0;
}

function normalize(parsed, ctx, extractionDegraded) {
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

  let confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium';
  if (extractionDegraded) confidence = confidence === 'high' ? 'medium' : 'low';

  const coverage_gaps = (parsed.coverage_gaps || []).map((g) => ({
    coverage: String(g.coverage || ''),
    reason_not_applied: String(g.reason_not_applied || ''),
    potential_value: typeof g.potential_value === 'number' ? g.potential_value : null,
    action_required: String(g.action_required || '')
  }));

  return {
    success: true,
    confidence,
    extraction_degraded: extractionDegraded,
    policy_type: String(parsed.policy_type || 'Unknown'),
    carrier: String(parsed.carrier || ctx.insurer || ''),
    policy_number: parsed.policy_number ?? null,
    effective_date: parsed.effective_date ?? null,
    expiration_date: parsed.expiration_date ?? null,
    settlement_type: ['RCV', 'ACV'].includes(parsed.settlement_type) ? parsed.settlement_type : 'RCV',
    deductible: typeof parsed.deductible === 'number' ? parsed.deductible : null,
    dwelling_coverage: findLimit(['dwelling', 'coverage a']),
    contents_coverage: findLimit(['contents', 'coverage c', 'personal property']),
    ale_coverage: findLimit(['ale', 'loss of use', 'coverage d', 'additional living']),
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

function safeFallback(ctx, reason) {
  console.error('[ai-policy-review] fallback:', reason);
  return {
    success: true,
    confidence: 'low',
    extraction_degraded: true,
    policy_type: 'Unknown',
    carrier: ctx.insurer || '',
    policy_number: null,
    effective_date: null,
    expiration_date: null,
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
      'Re-upload your complete policy PDF including the declarations page.',
      'Use a text-based PDF or a clear scan if possible.'
    ],
    summary_for_user:
      'Policy analysis could not be completed from the document provided. Please re-upload your full policy PDF and try again.'
  };
}

async function runAnalysis({ text, degraded, pdfDataUrl }, ctx) {
  const usePdf = degraded && pdfDataUrl;
  const run = (retry) => (usePdf ? analyzeWithPdf(pdfDataUrl, ctx, retry) : analyzeWithText(text, ctx, degraded, retry));

  let raw = await run(false);
  let parsed = JSON.parse(raw);
  if (validateParsed(parsed)) {
    return normalize(parsed, ctx, usePdf ? false : degraded);
  }

  console.warn('[ai-policy-review] retrying after invalid JSON');
  raw = await run(true);
  parsed = JSON.parse(raw);
  if (validateParsed(parsed)) {
    return normalize(parsed, ctx, usePdf ? false : degraded);
  }

  return safeFallback(ctx, 'invalid schema after retry');
}

// ─── Handler ───────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const supabase = getSupabase();
  await verifyAccess(event, supabase);

  const hasFile = !!(body.storage_path || body.file_base64);
  const hasText = (body.policy_text || '').trim().length >= MIN_TEXT;
  if (!hasFile && !hasText) {
    return jsonResponse(400, {
      error: 'Upload a policy PDF, provide file_base64, or paste policy text.',
      code: 'NO_CONTENT'
    });
  }

  const ctx = claimContext(body);

  try {
    const extracted = await resolvePolicyText(supabase, body, ctx);
    if (extracted.degraded && extracted.pdfDataUrl) {
      console.log('[ai-policy-review] weak text → analyzing PDF via Files API');
    } else if (extracted.degraded) {
      console.warn('[ai-policy-review] degraded text only — continuing');
    }

    const result = await runAnalysis(extracted, ctx);

    if (body.claim_id) {
      try {
        await supabase.from('claim_outputs').insert({
          claim_id: body.claim_id,
          output_type: 'policy_analysis',
          content: result,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[ai-policy-review] claim_outputs insert:', e.message);
      }
    }

    return jsonResponse(200, result);
  } catch (err) {
    console.error('[ai-policy-review]', err);
    if (err.message === 'OPENAI_API_KEY not configured') {
      return jsonResponse(500, { error: err.message });
    }
    if (err.message?.includes('too large')) {
      return jsonResponse(400, { error: err.message });
    }
    return jsonResponse(200, safeFallback(ctx, err.message));
  }
};
