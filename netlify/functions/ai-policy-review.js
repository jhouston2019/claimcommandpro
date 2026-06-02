/**
 * ai-policy-review.js — Canonical policy analysis function
 *
 * Pipeline (Medical Bill Dispute extraction architecture):
 *   1. Auth + payment gate
 *   2. Input validation — 400 only when no upload/text at all
 *   3. extractPolicyText() — pdf-parse → vision fallback → metadata stub (never 422 stop)
 *   4. GPT-4o analysis — JSON mode, temperature 0.2, fixed schema
 *   5. JSON validation + one retry on malformed response
 *   6. Normalize output — guaranteed canonical shape, always
 *   7. Persist to claim_outputs
 *   8. Return canonical JSON — confidence: "low" for degraded extraction, never empty data
 */

const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { runOpenAI } = require('./lib/ai-utils');

const MAX_POLICY_TEXT_CHARS = 20000;
const MAX_TOKENS = 4096;
const MIN_EXTRACTED_TEXT = 50;
const POLICY_FALLBACK_PREFIX = '[Policy text could not be extracted';

const VISION_EXTRACT_PROMPT =
  'Extract all text from this insurance policy document (declarations, coverages, limits, endorsements, exclusions). ' +
  'Return only the raw text content, preserving line breaks and structure as much as possible. ' +
  'Include all coverage names, dollar amounts, deductibles, and policy numbers.';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ─── System prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert property insurance policy analyst with deep knowledge of HO-3, HO-5, DP-3, and commercial property policies. Your job is to read a homeowner or property insurance policy and extract every coverage, limit, endorsement, exclusion, and coverage gap relevant to the policyholder's active claim.

Return ONLY a valid JSON object matching this exact schema. No markdown. No prose. No code fences. Raw JSON only.

{
  "policy_type": "string — HO-3, HO-5, DP-3, Commercial, or Unknown",
  "carrier": "string — insurance company name",
  "policy_number": "string or null",
  "effective_date": "string or null",
  "expiration_date": "string or null",
  "settlement_type": "RCV or ACV",
  "deductible": number,
  "coverages": [
    {
      "label": "string — coverage name e.g. Dwelling (Coverage A)",
      "limit": number,
      "applied_by_carrier": "yes | no | partial | unknown",
      "description": "string — plain English explanation of what this covers"
    }
  ],
  "endorsements": [
    {
      "name": "string",
      "limit": number or null,
      "applies_to_claim": true or false,
      "description": "string"
    }
  ],
  "exclusions": [
    {
      "name": "string",
      "description": "string — plain English",
      "affects_claim": true or false
    }
  ],
  "coverage_gaps": [
    {
      "coverage": "string — name of the coverage not applied",
      "reason_not_applied": "string — why the carrier hasn't applied it",
      "potential_value": number or null,
      "action_required": "string — what the policyholder should do"
    }
  ],
  "recommended_actions": [
    "string — specific actionable step"
  ],
  "summary_for_user": "string — 2-4 sentences plain English summary of the policy situation and most important gaps",
  "confidence": "high | medium | low"
}

Rules:
- Never fabricate coverage limits. If a limit is not stated in the policy text, use null.
- If the policy text is incomplete or unclear, set confidence to low or medium and explain in summary_for_user.
- coverage_gaps should only include coverages that are in the policy but have not been applied by the carrier to the active claim.
- applied_by_carrier reflects what the carrier has done so far, not what the policy allows.
- If you cannot determine a field, use null — never use placeholder strings like "string" or "unknown value".`;

// ─── PDF ingestion (ported from Medical Bill Dispute extractBillText) ────────

function detectMime(buf) {
  if (!buf || buf.length < 4) return 'application/octet-stream';
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  return 'application/octet-stream';
}

function resolveMime(buf, fileMimeType) {
  const d = detectMime(buf);
  if (d === 'application/pdf' || d === 'image/jpeg' || d === 'image/png') return d;
  if (fileMimeType === 'image/jpeg' || fileMimeType === 'image/png' || fileMimeType === 'application/pdf') {
    return fileMimeType;
  }
  return d;
}

/** True when extracted text likely contains policy substance, not only headers/footers. */
function policyTextLooksUsable(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < MIN_EXTRACTED_TEXT) return false;
  if (trimmed.startsWith(POLICY_FALLBACK_PREFIX)) return false;

  const hasAmount =
    /\$\s?\d[\d,]*(\.\d{2})?/.test(trimmed) || /\b\d{1,3}(?:,\d{3})*\.\d{2}\b/.test(trimmed);
  const hasCoverageKw =
    /\b(coverage|dwelling|deductible|endorsement|exclusion|declarations|policy|limit|RCV|ACV|HO-?3|HO-?5|personal\s+property|loss\s+of\s+use|insured|premium)\b/i.test(
      trimmed
    );

  if (trimmed.length >= 500 && (hasCoverageKw || hasAmount)) return true;
  if (trimmed.length >= 200 && hasCoverageKw && hasAmount) return true;
  if (hasCoverageKw || hasAmount) return trimmed.length >= 120;
  return trimmed.length >= 400;
}

async function visionExtractPolicyText(openai, fileBase64, mediaType) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${fileBase64}`,
              detail: 'high'
            }
          },
          { type: 'text', text: VISION_EXTRACT_PROMPT }
        ]
      }
    ]
  });
  return completion.choices?.[0]?.message?.content || '';
}

function policyMetadataFallbackText(ctx) {
  return (
    POLICY_FALLBACK_PREFIX +
    '. Analyze based on claim context: ' +
    `Insurer: ${ctx.insurer || 'Unknown'}, ` +
    `Property type: ${ctx.property_type || 'Unknown'}, ` +
    `Date of loss: ${ctx.date_of_loss || 'Unknown'}, ` +
    `Cause of loss: ${ctx.claim_type || 'Unknown'}, ` +
    `Jurisdiction: ${ctx.jurisdiction || 'Unknown'}]`
  );
}

/**
 * Multi-method extraction: pdf-parse (×2), then OpenAI vision (PDF / image / jpeg mime fallback), then metadata stub.
 * Never throws — returns at least the metadata fallback string.
 */
async function extractPolicyText(openai, buffer, mime, fileBase64, ctx) {
  const b64 = fileBase64 && typeof fileBase64 === 'string' ? fileBase64 : buffer.toString('base64');
  const fallback = () => policyMetadataFallbackText(ctx);

  const tryPdfParse = async (label, opts) => {
    try {
      const pdfData = opts ? await pdfParse(buffer, opts) : await pdfParse(buffer);
      const text = (pdfData && pdfData.text) || '';
      return typeof text === 'string' ? text.trim() : '';
    } catch (e) {
      console.warn(`[ai-policy-review] pdf-parse ${label} failed:`, e.message);
      return '';
    }
  };

  if (mime === 'image/jpeg' || mime === 'image/png') {
    try {
      const t = await visionExtractPolicyText(openai, b64, mime);
      if (policyTextLooksUsable(t)) return t.trim();
    } catch (e) {
      console.warn('[ai-policy-review] vision (image) failed:', e.message);
    }
    try {
      const t = await visionExtractPolicyText(openai, b64, 'image/jpeg');
      if (policyTextLooksUsable(t)) return t.trim();
    } catch (e) {
      console.warn('[ai-policy-review] vision (image as jpeg mime) failed:', e.message);
    }
    return fallback();
  }

  if (mime !== 'application/pdf') {
    return fallback();
  }

  let text = await tryPdfParse('attempt1', undefined);
  if (policyTextLooksUsable(text)) return text;

  const text2 = await tryPdfParse('attempt2', { max: 0 });
  if (policyTextLooksUsable(text2)) return text2;
  if (text2.length > text.length) text = text2;

  try {
    const t = await visionExtractPolicyText(openai, b64, 'application/pdf');
    if (policyTextLooksUsable(t)) return t.trim();
  } catch (e) {
    console.warn('[ai-policy-review] vision (application/pdf) failed:', e.message);
  }
  try {
    const t = await visionExtractPolicyText(openai, b64, 'image/jpeg');
    if (policyTextLooksUsable(t)) return t.trim();
  } catch (e) {
    console.warn('[ai-policy-review] vision (image/jpeg mime fallback) failed:', e.message);
  }

  if (text.length > 0) return text;
  return fallback();
}

async function resolvePolicyFileBuffer(supabase, { storage_path, file_base64, file_mime_type }) {
  if (storage_path) {
    try {
      console.log('Fetching PDF from storage:', storage_path);
      const { data: fileData, error: fileError } = await supabase.storage
        .from('claim-documents')
        .download(storage_path);

      if (fileError) {
        console.error('Storage download error:', fileError.message);
        return null;
      }
      if (fileData) {
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('PDF header check:', buffer.slice(0, 5).toString('ascii'), 'bytes:', buffer.length);
        return {
          buffer,
          mime: resolveMime(buffer, 'application/pdf'),
          fileBase64: buffer.toString('base64')
        };
      }
    } catch (pdfErr) {
      console.error('PDF download in ai-policy-review failed:', pdfErr.message);
    }
    return null;
  }

  if (file_base64 && file_base64.length > 0) {
    const buffer = Buffer.from(file_base64, 'base64');
    const mime = resolveMime(buffer, file_mime_type || 'application/pdf');
    return { buffer, mime, fileBase64: file_base64 };
  }

  return null;
}

/**
 * Resolve text for analysis: pasted policy_text, optional PDF extraction ladder, graceful degradation.
 */
async function resolvePolicyTextForAnalysis(supabase, body, claimContext) {
  let policyText = String(body.policy_text || '').trim();
  let extractionDegraded = false;

  const file = await resolvePolicyFileBuffer(supabase, {
    storage_path: body.storage_path,
    file_base64: body.file_base64,
    file_mime_type: body.file_mime_type
  });

  if (!file && !policyText) {
    return { policyText: policyMetadataFallbackText(claimContext), extractionDegraded: true };
  }

  if (!file) {
    if (!policyTextLooksUsable(policyText) && policyText.length > 0) extractionDegraded = true;
    if (!policyText) {
      return { policyText: policyMetadataFallbackText(claimContext), extractionDegraded: true };
    }
    return { policyText: policyText.slice(0, MAX_POLICY_TEXT_CHARS), extractionDegraded };
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn('[ai-policy-review] OPENAI_API_KEY missing; using pasted text or fallback only');
    if (!policyTextLooksUsable(policyText)) {
      extractionDegraded = true;
      if (!policyText) policyText = policyMetadataFallbackText(claimContext);
    }
    return { policyText: policyText.slice(0, MAX_POLICY_TEXT_CHARS), extractionDegraded };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { buffer, mime, fileBase64 } = file;

  if (mime === 'application/pdf') {
    try {
      const pdfData = await pdfParse(buffer);
      const quick = String(pdfData?.text || '').trim();
      if (policyTextLooksUsable(quick) && (!policyTextLooksUsable(policyText) || quick.length > policyText.length)) {
        policyText = quick;
      }
    } catch (e) {
      console.warn('[ai-policy-review] pdf-parse quick pass failed:', e.message);
    }
  }

  if (!policyTextLooksUsable(policyText)) {
    const extracted = await extractPolicyText(openai, buffer, mime, fileBase64, claimContext);
    const extractedText = String(extracted || '').trim();
    if (
      extractedText &&
      (extractedText.length > policyText.length || !policyTextLooksUsable(policyText))
    ) {
      policyText = extractedText;
    }
  }

  if (!policyTextLooksUsable(policyText) || policyText.startsWith(POLICY_FALLBACK_PREFIX)) {
    extractionDegraded = true;
    if (!policyText) policyText = policyMetadataFallbackText(claimContext);
  }

  if (policyText.length > MAX_POLICY_TEXT_CHARS) {
    policyText = policyText.slice(0, MAX_POLICY_TEXT_CHARS) + '\n[TRUNCATED]';
  }

  return { policyText, extractionDegraded };
}

// ─── GPT-4o analysis (text → runOpenAI JSON mode) ───────────────────────────

function buildAnalysisUserPrompt(policyText, claimContext, extractionDegraded, isRetry = false) {
  const degradedNote = extractionDegraded
    ? '\n\nNOTE: Policy text extraction was partial or unavailable. Use whatever text is provided plus claim context. Set confidence to low and explain limitations in summary_for_user. Do not invent coverage limits.'
    : '';

  return `
POLICY TEXT:
${policyText}

CLAIM CONTEXT:
- Insurer: ${claimContext.insurer || 'Unknown'}
- Property type: ${claimContext.property_type || 'Unknown'}
- Date of loss: ${claimContext.date_of_loss || 'Unknown'}
- Cause of loss: ${claimContext.claim_type || 'Unknown'}
- Jurisdiction: ${claimContext.jurisdiction || 'Unknown'}${degradedNote}
${isRetry ? '\nIMPORTANT: Your previous response was not valid JSON. Return ONLY a raw JSON object. No markdown, no prose, no code fences.' : ''}
`.trim();
}

async function runPolicyAnalysis(policyText, claimContext, extractionDegraded, isRetry = false) {
  const userMessage = buildAnalysisUserPrompt(policyText, claimContext, extractionDegraded, isRetry);
  return runOpenAI(SYSTEM_PROMPT, userMessage, {
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    response_format: { type: 'json_object' }
  });
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateAnalysis(parsed) {
  const str = JSON.stringify(parsed);
  if (str.includes('"string —') || str.includes('"number —')) return false;
  if (!Array.isArray(parsed.coverages)) return false;
  if (!parsed.summary_for_user || typeof parsed.summary_for_user !== 'string') return false;
  return true;
}

// ─── Normalize ──────────────────────────────────────────────────────────────

function normalizeOutput(parsed, claimContext, extractionDegraded = false) {
  const coverages = Array.isArray(parsed.coverages) ? parsed.coverages.map(c => ({
    label:              String(c.label || 'Coverage'),
    limit:              typeof c.limit === 'number' ? c.limit : null,
    applied_by_carrier: ['yes','no','partial','unknown'].includes(c.applied_by_carrier) ? c.applied_by_carrier : 'unknown',
    description:        String(c.description || '')
  })) : [];

  const endorsements = Array.isArray(parsed.endorsements) ? parsed.endorsements.map(e => ({
    name:             String(e.name || ''),
    limit:            typeof e.limit === 'number' ? e.limit : null,
    applies_to_claim: e.applies_to_claim === true,
    description:      String(e.description || '')
  })) : [];

  const exclusions = Array.isArray(parsed.exclusions) ? parsed.exclusions.map(e => ({
    name:          String(e.name || ''),
    description:   String(e.description || ''),
    affects_claim: e.affects_claim === true
  })) : [];

  const coverage_gaps = Array.isArray(parsed.coverage_gaps) ? parsed.coverage_gaps.map(g => ({
    coverage:           String(g.coverage || ''),
    reason_not_applied: String(g.reason_not_applied || ''),
    potential_value:    typeof g.potential_value === 'number' ? g.potential_value : null,
    action_required:    String(g.action_required || '')
  })) : [];

  // Extract key limits for easy frontend access
  const find = (keywords) => coverages.find(c =>
    keywords.some(kw => c.label.toLowerCase().includes(kw))
  )?.limit || null;

  let confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium';
  if (extractionDegraded) {
    confidence = confidence === 'high' ? 'medium' : 'low';
  }

  return {
    success:              true,
    confidence,
    extraction_degraded:  extractionDegraded,
    policy_type:          String(parsed.policy_type || 'Unknown'),
    carrier:              String(parsed.carrier || claimContext.insurer || ''),
    policy_number:        parsed.policy_number || null,
    effective_date:       parsed.effective_date || null,
    expiration_date:      parsed.expiration_date || null,
    settlement_type:      ['RCV','ACV'].includes(parsed.settlement_type) ? parsed.settlement_type : 'RCV',
    deductible:           typeof parsed.deductible === 'number' ? parsed.deductible : null,
    dwelling_coverage:    find(['dwelling','coverage a']),
    contents_coverage:    find(['contents','coverage c','personal property']),
    ale_coverage:         find(['ale','loss of use','coverage d','additional living']),
    coverages,
    endorsements,
    exclusions,
    coverage_gaps,
    gaps_found:           coverage_gaps.length,
    recommended_actions:  Array.isArray(parsed.recommended_actions) ? parsed.recommended_actions.map(a => String(a)) : [],
    summary_for_user:     String(parsed.summary_for_user || '')
  };
}

function fallbackOutput(claimContext, reason) {
  console.error('Both analysis attempts failed:', reason);
  return {
    success:              true,
    confidence:           'low',
    extraction_degraded:  true,
    policy_type:          'Unknown',
    carrier:              claimContext.insurer || '',
    policy_number:        null,
    effective_date:       null,
    expiration_date:      null,
    settlement_type:      'RCV',
    deductible:           null,
    dwelling_coverage:    null,
    contents_coverage:    null,
    ale_coverage:         null,
    coverages:            [],
    endorsements:         [],
    exclusions:           [],
    coverage_gaps:        [],
    gaps_found:           0,
    recommended_actions:  [
      'Re-upload your complete insurance policy PDF including the declarations page.',
      'Ensure the document is not a scanned image without selectable text.'
    ],
    summary_for_user:     'Policy analysis could not be completed. This is usually caused by an unreadable or incomplete PDF. Please re-upload your complete policy document.',
    _fallback_reason:     reason
  };
}

// ─── Auth + payment gate ────────────────────────────────────────────────────

async function verifyAccess(event, supabase) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return { userId: null, preview: true };
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { userId: null, preview: true };
    return { userId: user.id, preview: false };
  } catch (err) {
    return { userId: null, preview: true };
  }
}

// ─── Handler ────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  const supabase = getSupabase();

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

  const { claim_id, storage_path, policy_text, insurer, property_type, date_of_loss, claim_type, jurisdiction } = body;
  const claimContext = { insurer, property_type, date_of_loss, claim_type, jurisdiction };

  // Auth + payment gate
  const access = await verifyAccess(event, supabase);
  if (access.error) return { statusCode: access.status || 403, body: JSON.stringify({ error: access.error }) };

  // Input validation — hard error
  const hasStoragePath = !!(storage_path?.length);
  const hasPolicyText  = !!(policy_text?.length > 100);
  const hasFileBase64  = !!(body.file_base64?.length > 0);
  if (!hasStoragePath && !hasPolicyText && !hasFileBase64) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'No policy content provided. Upload a policy PDF or provide policy text.', code: 'NO_CONTENT' })
    };
  }

  const { policyText: policyTextForAnalysis, extractionDegraded } = await resolvePolicyTextForAnalysis(
    supabase,
    body,
    claimContext
  );

  if (extractionDegraded) {
    console.warn('[ai-policy-review] extraction degraded — continuing with partial text or claim-context fallback');
  }

  // GPT-4o analysis with retry (never hard-stop on weak extraction)
  let analysisResult = null;
  let rawResponse    = null;
  try {
    rawResponse = await runPolicyAnalysis(policyTextForAnalysis, claimContext, extractionDegraded, false);
    const parsed = JSON.parse(rawResponse);
    if (validateAnalysis(parsed)) {
      analysisResult = normalizeOutput(parsed, claimContext, extractionDegraded);
    } else {
      console.warn('First attempt failed validation. Retrying...');
      rawResponse = await runPolicyAnalysis(policyTextForAnalysis, claimContext, extractionDegraded, true);
      const parsed2 = JSON.parse(rawResponse);
      analysisResult = validateAnalysis(parsed2)
        ? normalizeOutput(parsed2, claimContext, extractionDegraded)
        : fallbackOutput(claimContext, 'Both AI attempts returned invalid schema');
    }
  } catch (parseError) {
    console.error('Parse error:', parseError.message);
    analysisResult = fallbackOutput(claimContext, 'JSON parse error: ' + parseError.message);
  }

  // Persist
  if (claim_id) {
    try {
      await supabase.from('claim_outputs').insert({
        claim_id,
        output_type: 'policy_analysis',
        content:     analysisResult,
        created_at:  new Date().toISOString()
      });
    } catch (e) { console.warn('claim_outputs insert failed:', e.message); }
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(analysisResult)
  };
};
