/**
 * ai-policy-review.js — Canonical policy analysis function
 *
 * Pipeline:
 *   1. Auth + payment gate
 *   2. Input validation — hard 400/422 error if nothing to analyze
 *   3. Text extraction — Supabase storage → pdf-parse → GPT-4o vision fallback
 *   4. GPT-4o analysis — JSON mode, temperature 0.2, fixed schema
 *   5. JSON validation + one retry on malformed response
 *   6. Normalize output — guaranteed canonical shape, always
 *   7. Persist to claim_outputs
 *   8. Return canonical JSON — confidence: "low" for degraded states, never empty data
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const MAX_POLICY_TEXT_CHARS = 120000;
const MAX_TOKENS = 4096;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

// ─── Text extraction ────────────────────────────────────────────────────────

async function extractTextFromStorage(supabase, storagePath) {
  if (!storagePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from('claim-documents')
      .download(storagePath);
    if (error || !data) {
      console.warn('Storage download failed:', error?.message);
      return null;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const isPDF = storagePath.toLowerCase().endsWith('.pdf') ||
                  buffer.slice(0, 4).toString() === '%PDF';
    if (isPDF) {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const result = await pdfParse(buffer);
        const text = result.text?.trim();
        if (text && text.length >= 100) return text.slice(0, MAX_POLICY_TEXT_CHARS);
      } catch (e) {
        console.warn('pdf-parse failed:', e.message);
      }
    }
    // Vision fallback for images or failed PDFs
    try {
      const openai = getOpenAI();
      const base64 = buffer.toString('base64');
      const mimeType = data.type || (isPDF ? 'application/pdf' : 'image/jpeg');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: 'This is an insurance policy document. Extract all text exactly as written. Return only the raw text, no commentary.' }
          ]
        }]
      });
      const text = response.choices[0]?.message?.content?.trim();
      if (text && text.length >= 100) return text.slice(0, MAX_POLICY_TEXT_CHARS);
    } catch (e) {
      console.warn('Vision OCR failed:', e.message);
    }
    return null;
  } catch (err) {
    console.warn('extractTextFromStorage error:', err.message);
    return null;
  }
}

// ─── GPT-4o analysis ────────────────────────────────────────────────────────

async function runAnalysis(openai, policyText, claimContext, isRetry = false) {
  const userMessage = `
POLICY TEXT:
${policyText}

CLAIM CONTEXT:
- Insurer: ${claimContext.insurer || 'Unknown'}
- Property type: ${claimContext.property_type || 'Unknown'}
- Date of loss: ${claimContext.date_of_loss || 'Unknown'}
- Cause of loss: ${claimContext.claim_type || 'Unknown'}
- Jurisdiction: ${claimContext.jurisdiction || 'Unknown'}
${isRetry ? '\nIMPORTANT: Your previous response was not valid JSON. Return ONLY a raw JSON object. No markdown, no prose, no code fences.' : ''}
`.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ]
  });
  return response.choices[0]?.message?.content;
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

function normalizeOutput(parsed, claimContext) {
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

  return {
    success:              true,
    confidence:           ['high','medium','low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
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

    const claimId = JSON.parse(event.body || '{}').claim_id;
    if (claimId) {
      const { data: claim } = await supabase
        .from('claims')
        .select('id, status, paid')
        .eq('id', claimId)
        .eq('user_id', user.id)
        .single();

      if (!claim) return { error: 'Claim not found or access denied', status: 403 };
      if (!claim.paid && claim.status !== 'active') {
        return { error: 'Payment required to run policy analysis.', status: 402 };
      }
    }

    return { userId: user.id, preview: false };
  } catch (err) {
    console.warn('Auth error:', err.message);
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
  const openai   = getOpenAI();

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
  if (!hasStoragePath && !hasPolicyText) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'No policy content provided. Upload a policy PDF or provide policy text.', code: 'NO_CONTENT' })
    };
  }

  // Text extraction
  let extractedText = null;
  if (hasStoragePath) {
    extractedText = await extractTextFromStorage(supabase, storage_path);
  }
  if (!extractedText && hasPolicyText) {
    extractedText = policy_text.slice(0, MAX_POLICY_TEXT_CHARS);
  }
  if (!extractedText || extractedText.length < 50) {
    return {
      statusCode: 422,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Could not extract readable text from the policy document. Please ensure the PDF is not image-only, or try uploading a different file.', code: 'EXTRACTION_FAILED' })
    };
  }

  // GPT-4o analysis with retry
  let analysisResult = null;
  let rawResponse    = null;
  try {
    rawResponse = await runAnalysis(openai, extractedText, claimContext, false);
    const parsed = JSON.parse(rawResponse);
    if (validateAnalysis(parsed)) {
      analysisResult = normalizeOutput(parsed, claimContext);
    } else {
      console.warn('First attempt failed validation. Retrying...');
      rawResponse = await runAnalysis(openai, extractedText, claimContext, true);
      const parsed2 = JSON.parse(rawResponse);
      analysisResult = validateAnalysis(parsed2)
        ? normalizeOutput(parsed2, claimContext)
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
