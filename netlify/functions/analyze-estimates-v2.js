/**
 * Netlify Function: analyze-estimates-v2
 * ERP-parity LINE_COMPARE: deterministic parser → matcher → reconciler → exposure
 * with optional AI narrative enrichment when OPENAI_API_KEY is configured.
 */

const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { runOpenAI, sanitizeInput } = require('./lib/ai-utils');
const { stripJsonFence } = require('./lib/ccc-anthropic-helpers');
const {
  compareEstimates,
  shouldUseDeterministicResult,
  mergeWithAI
} = require('./lib/estimate-comparison-engine');

const RECON_MODEL = 'claude-sonnet-4-20250514';
const RECON_MAX_TOKENS = 4096;
/** Match text-extract / upload quality gate — short snippets are not substantive estimates. */
const MIN_CONTRACTOR_TEXT_CHARS = 100;

function resolveCompareMode(contractorText) {
  const t = String(contractorText || '').trim();
  if (t.length < MIN_CONTRACTOR_TEXT_CHARS) return 'RECON_VS_CARRIER';
  return 'LINE_COMPARE';
}

function buildReconRows(carrierText) {
  const dollarPattern = /(.+?)\s+\$?([\d,]+\.?\d*)/g;
  const lineItems = [];
  let match;
  while ((match = dollarPattern.exec(carrierText)) !== null) {
    const carrierAmount = parseFloat(match[2].replace(/,/g, ''));
    if (isNaN(carrierAmount) || carrierAmount <= 0) continue;
    lineItems.push({
      trade: 'General',
      carrierItem: match[1].trim(),
      carrierAmount,
      contractorItem: match[1].trim(),
      contractorAmount: carrierAmount,
      delta: 0,
      flagged: false,
      reason: 'Fallback: fair-market reconstruction unavailable',
      depreciationNote: ''
    });
  }
  const total = lineItems.reduce((sum, r) => sum + r.carrierAmount, 0);
  return {
    mode: 'RECON_VS_CARRIER',
    lineItems,
    totalCarrier: Math.round(total * 100) / 100,
    totalContractor: Math.round(total * 100) / 100,
    totalDelta: 0
  };
}

function normalizeReconLineItem(row) {
  let carrierAmount = Number(row?.carrierAmount);
  let contractorAmount = Number(row?.contractorAmount);
  if (!Number.isFinite(carrierAmount)) carrierAmount = 0;
  if (!Number.isFinite(contractorAmount)) contractorAmount = 0;
  carrierAmount = Math.round(carrierAmount * 100) / 100;
  contractorAmount = Math.round(contractorAmount * 100) / 100;
  const delta = Math.round((contractorAmount - carrierAmount) * 100) / 100;
  return {
    trade: String(row?.trade ?? 'General'),
    carrierItem: String(row?.carrierItem ?? ''),
    carrierAmount,
    contractorItem: String(row?.contractorItem ?? ''),
    contractorAmount,
    delta,
    flagged: Boolean(row?.flagged),
    reason: String(row?.reason ?? ''),
    depreciationNote: String(row?.depreciationNote ?? '')
  };
}

function finalizeReconComparison(parsed) {
  const rawItems = Array.isArray(parsed?.lineItems) ? parsed.lineItems : [];
  const lineItems = rawItems.map(normalizeReconLineItem);
  let totalCarrier = 0;
  let totalContractor = 0;
  let totalDelta = 0;
  for (const r of lineItems) {
    totalCarrier += r.carrierAmount;
    totalContractor += r.contractorAmount;
    totalDelta += r.delta;
  }
  return {
    mode: 'RECON_VS_CARRIER',
    lineItems,
    totalCarrier: Math.round(totalCarrier * 100) / 100,
    totalContractor: Math.round(totalContractor * 100) / 100,
    totalDelta: Math.round(totalDelta * 100) / 100
  };
}

function reconLineItemsToApiRows(lineItems) {
  return (lineItems || []).map((row) => ({
    description: row.carrierItem || row.contractorItem || '—',
    carrier_amount: row.carrierAmount,
    contractor_amount: row.contractorAmount,
    variance: row.delta,
    status: row.flagged ? 'Flagged' : (Math.abs(row.delta) > 0.01 ? 'Undervalued' : 'Match'),
    trade: row.trade,
    reason: row.reason,
    depreciation_note: row.depreciationNote,
    flagged: row.flagged
  }));
}

function buildReconPrompt(carrierText, claimType, category) {
  return `You are a licensed public adjuster with expertise in Xactimate pricing, regional construction cost data, and trade-level labor and material rates.

You are reviewing a carrier estimate. For each line item in the carrier estimate, reconstruct the fair-market contractorAmount based on current Xactimate pricing and regional labor/material rates.

CRITICAL RULES:
- Never copy carrierAmount as contractorAmount. Each reconstructed amount must reflect independent fair-market pricing.
- Flag a line if: (a) carrierAmount is $0 but the carrier text describes work being performed, (b) the absolute delta exceeds 25% of carrierAmount, or (c) the line description is incomplete (e.g. "install drywall" missing texture, prime, corner bead).
- Do not add rows for trades the carrier omitted entirely — only reconstruct lines that appear in the carrier estimate.
- claimType is provided as a label for context only. Do not use it as a source of dollar amounts.

Return ONLY valid JSON matching this exact shape — no preamble, no markdown fences:
{
  "mode": "RECON_VS_CARRIER",
  "lineItems": [
    {
      "trade": "string",
      "carrierItem": "string",
      "carrierAmount": number,
      "contractorItem": "string",
      "contractorAmount": number,
      "delta": number,
      "flagged": boolean,
      "reason": "string",
      "depreciationNote": "string"
    }
  ],
  "totalCarrier": number,
  "totalContractor": number,
  "totalDelta": number
}

Carrier estimate:
${carrierText}

Claim type: ${claimType || 'general'}
Category: ${category || 'BUILDING'}`;
}

async function runReconAnthropic(carrierText, claimType, category) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: RECON_MODEL,
      max_tokens: RECON_MAX_TOKENS,
      temperature: 0.15,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: buildReconPrompt(carrierText, claimType, category) }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic error ${response.status}: ${errBody.slice(0, 500)}`);
  }

  const data = await response.json();
  const raw = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const cleaned = stripJsonFence(raw);
  const parsed = JSON.parse(cleaned);
  const comparison = finalizeReconComparison(parsed);
  if (!comparison.lineItems.length) {
    throw new Error('RECON AI returned no line items');
  }
  return comparison;
}

async function runReconVsCarrier(carrierText, claimType, category) {
  try {
    const comparison = await runReconAnthropic(carrierText, claimType, category);
    return { comparison, recon_path: 'ai' };
  } catch (err) {
    console.warn('RECON AI path failed, using fallback:', err.message);
    const comparison = buildReconRows(carrierText);
    return { comparison, recon_path: 'fallback' };
  }
}

function buildReconApiResult(comparison, reconPath, extras = {}) {
  const line_items = reconLineItemsToApiRows(comparison.lineItems);
  const gapAmount = Math.max(0, comparison.totalDelta);
  const flagged = line_items.filter((r) => r.flagged);
  const gap_categories = flagged.length
    ? [{
        category: 'Fair Market Variance',
        amount: gapAmount,
        description: `${flagged.length} line(s) flagged vs fair-market reconstruction`
      }]
    : [];

  return {
    success: true,
    compare_mode: 'RECON_VS_CARRIER',
    recon_path: reconPath,
    comparison,
    analysis_method: reconPath === 'ai' ? 'recon_ai' : 'recon_fallback',
    contractor_parse_method: null,
    contractor_extraction_method: null,
    carrier_extraction_method: extras.carrier_extraction_method || null,
    carrier_parse_success_rate: null,
    contractor_parse_success_rate: null,
    carrier_total: comparison.totalCarrier,
    contractor_total: comparison.totalContractor,
    gap_amount: gapAmount,
    line_items,
    gap_categories,
    gap_summary: reconPath === 'ai'
      ? `Reconstructed fair-market scope vs carrier: ${fmtMoney(comparison.totalContractor)} reconstructed vs ${fmtMoney(comparison.totalCarrier)} carrier — variance ${fmtMoney(gapAmount)}.`
      : 'Fallback reconstruction unavailable — amounts mirror carrier pricing. Obtain an independent contractor estimate.',
    summary: reconPath === 'ai'
      ? `RECON_VS_CARRIER: ${line_items.length} carrier lines reconstructed at fair market.`
      : 'RECON_VS_CARRIER fallback — no independent fair-market pricing applied.',
    total_projected_recovery: gapAmount,
    rcv_delta_total: gapAmount,
    recoverable_depreciation: null,
    op_exposure: null,
    intelligence: null,
    reconciliation_stats: null,
    parse_metadata: null
  };
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Preview',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function fmtMoney(n) {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function manualOnlyResult(carrierTotal, contractorTotal) {
  const carrier = Number(carrierTotal) || 0;
  const contractor = Number(contractorTotal) || 0;
  return {
    analysis_method: 'manual',
    carrier_total: carrier,
    contractor_total: contractor,
    gap_amount: Math.max(0, contractor - carrier),
    line_items: [],
    gap_categories: [],
    gap_summary: 'Manual carrier total entered — upload carrier estimate PDF for line-item comparison.',
    summary: `Carrier total: ${fmtMoney(carrier)} · Contractor total: ${fmtMoney(contractor)}`
  };
}

async function extractTextFromPdfUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download estimate PDF');
  const buffer = Buffer.from(await res.arrayBuffer());
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

async function enrichWithAI(deterministicResult, carrierText, contractorText, contractorTotal, claimType) {
  if (!process.env.OPENAI_API_KEY) return null;

  const systemPrompt = `You are an insurance claim estimate analyst. Review a deterministic line-by-line comparison and write a clear gap narrative.

Return ONLY valid JSON:
{
  "gap_summary": "string — one paragraph explaining key gaps",
  "summary": "string — overall comparison summary",
  "gap_categories": [
    { "category": "string", "amount": number, "description": "string" }
  ]
}

Rules:
- Use the deterministic comparison data provided; do not invent line items
- gap_categories should align with the documented gap amount
- Neutral, informational tone only — no legal advice or negotiation language`;

  const userPrompt = `Claim type: ${claimType || 'property-claim'}
Contractor total: $${Number(contractorTotal || 0).toLocaleString()}
Carrier total: $${Number(deterministicResult.carrier_total || 0).toLocaleString()}
Gap: $${Number(deterministicResult.gap_amount || 0).toLocaleString()}
Line items compared: ${deterministicResult.line_items.length}
Deterministic gap categories: ${JSON.stringify(deterministicResult.gap_categories.slice(0, 8))}

Carrier estimate excerpt:
${sanitizeInput(carrierText).slice(0, 8000)}

Contractor estimate excerpt:
${sanitizeInput(contractorText).slice(0, 4000)}`;

  try {
    const raw = await runOpenAI(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });
    return JSON.parse(raw);
  } catch (err) {
    console.warn('AI enrichment skipped:', err.message);
    return null;
  }
}

async function analyzeWithOpenAIFallback(carrierText, contractorText, contractorTotal, claimType) {
  const systemPrompt = `You are an insurance claim estimate analyst. Compare carrier vs contractor estimates line-by-line.

Return ONLY valid JSON:
{
  "carrier_total": number,
  "line_items": [
    {
      "description": "string",
      "carrier_amount": number,
      "contractor_amount": number,
      "variance": number,
      "status": "Match" | "Undervalued" | "Missing from Carrier" | "Disputed"
    }
  ],
  "gap_categories": [{ "category": "string", "amount": number, "description": "string" }],
  "gap_summary": "string",
  "summary": "string"
}`;

  const userPrompt = `Claim type: ${claimType || 'property-claim'}
Contractor documented total: $${Number(contractorTotal || 0).toLocaleString()}

Contractor estimate:
${sanitizeInput(contractorText).slice(0, 20000)}

Carrier estimate:
${sanitizeInput(carrierText).slice(0, 20000)}`;

  const raw = await runOpenAI(systemPrompt, userPrompt, {
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  });

  const parsed = JSON.parse(raw);
  const carrierTotal = Number(parsed.carrier_total) || 0;
  const lineItems = (parsed.line_items || []).map((item) => {
    const carrier = Number(item.carrier_amount ?? item.carrier ?? 0);
    const contractor = Number(item.contractor_amount ?? item.contractor ?? 0);
    const variance = item.variance != null ? Number(item.variance) : contractor - carrier;
    return {
      description: item.description || '—',
      carrier_amount: carrier,
      contractor_amount: contractor,
      variance,
      status: item.status || 'Disputed'
    };
  });

  return {
    analysis_method: 'ai',
    carrier_total: carrierTotal,
    contractor_total: Number(contractorTotal) || 0,
    gap_amount: Math.max(0, (Number(contractorTotal) || 0) - carrierTotal),
    line_items: lineItems,
    gap_categories: parsed.gap_categories || [],
    gap_summary: parsed.gap_summary || '',
    summary: parsed.summary || ''
  };
}

function toApiResponse(engineResult, extras = {}) {
  return {
    compare_mode: 'LINE_COMPARE',
    analysis_method: engineResult.analysis_method,
    contractor_parse_method: extras.contractor_parse_method || null,
    contractor_extraction_method: extras.contractor_extraction_method || null,
    carrier_extraction_method: extras.carrier_extraction_method || null,
    carrier_parse_success_rate: engineResult.parse_metadata?.carrier?.parse_success_rate ?? null,
    contractor_parse_success_rate: engineResult.parse_metadata?.contractor?.parse_success_rate ?? null,
    carrier_total: engineResult.carrier_total,
    contractor_total: engineResult.contractor_total,
    gap_amount: engineResult.gap_amount,
    line_items: engineResult.line_items,
    gap_categories: engineResult.gap_categories,
    gap_summary: engineResult.gap_summary,
    summary: engineResult.summary,
    total_projected_recovery: engineResult.total_projected_recovery,
    rcv_delta_total: engineResult.rcv_delta_total,
    recoverable_depreciation: engineResult.recoverable_depreciation,
    op_exposure: engineResult.op_exposure,
    intelligence: engineResult.intelligence,
    reconciliation_stats: engineResult.reconciliation?.stats,
    parse_metadata: engineResult.parse_metadata
  };
}

async function persistResults(supabase, claimId, result, body) {
  const gapAmount = result.gap_amount || 0;
  const isRecon = result.compare_mode === 'RECON_VS_CARRIER';

  if (result.line_items.length > 0) {
    for (const item of result.line_items) {
      const diff = Math.max(0, (item.contractor_amount || 0) - (item.carrier_amount || 0));
      if (!isRecon && diff <= 0 && item.carrier_amount > 0) continue;
      if (isRecon && diff <= 0 && !item.flagged) continue;
      await supabase.from('claim_estimate_discrepancies').insert({
        claim_id: claimId,
        carrier_document_id: body.carrier_document_id || null,
        contractor_document_id: body.contractor_document_id || null,
        line_item: item.description,
        carrier_amount: item.carrier_amount,
        contractor_amount: item.contractor_amount,
        difference_amount: isRecon ? (item.variance || diff) : diff,
        delta_type: isRecon
          ? (item.carrier_amount === 0 ? 'missing' : 'fair_market_variance')
          : (item.carrier_amount === 0 ? 'missing' : 'undervalued'),
        description: item.reason || item.status,
        compare_mode: result.compare_mode || 'LINE_COMPARE',
        created_at: new Date().toISOString()
      }).then(() => {}).catch((err) => console.warn('Discrepancy insert:', err.message));
    }
  }

  await supabase.from('claim_financial_summary').upsert({
    claim_id: claimId,
    insurer_estimate: result.carrier_total || 0,
    claimant_estimate: result.contractor_total || body.contractor_estimate || 0,
    gap_amount: gapAmount,
    underpayment_estimate: gapAmount,
    compare_mode: result.compare_mode || 'LINE_COMPARE',
    updated_at: new Date().toISOString()
  }).then(() => {}).catch((err) => console.warn('Financial summary upsert:', err.message));

  await supabase.from('claim_outputs').insert({
    claim_id: claimId,
    output_type: 'carrier_estimate_analysis',
    content: {
      ...result,
      compare_mode: result.compare_mode || 'LINE_COMPARE',
      recon_path: result.recon_path || null
    },
    created_at: new Date().toISOString()
  }).then(() => {}).catch((err) => console.warn('claim_outputs insert:', err.message));
}

exports.resolveCompareMode = resolveCompareMode;
exports.buildReconRows = buildReconRows;
exports.buildReconApiResult = buildReconApiResult;

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: { message: 'Method not allowed' } }) };
  }

  const isAdminPreview =
    (event.headers['x-admin-preview'] || event.headers['X-Admin-Preview'] || '') === 'true';

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!isAdminPreview && (!authHeader || !authHeader.startsWith('Bearer '))) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: { message: 'Unauthorized' } }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: { message: 'Invalid JSON body' } }) };
  }

  const {
    claim_id,
    carrier_estimate_text,
    contractor_estimate_text,
    carrier_estimate_pdf_url,
    contractor_estimate_pdf_url,
    contractor_line_items,
    contractor_parse_method,
    contractor_extraction_method,
    carrier_extraction_method,
    contractor_estimate,
    carrier_total,
    claim_type,
    category
  } = body;

  const contractorTotal = Number(contractor_estimate) || 0;
  const manualCarrierTotal = Number(carrier_total) || 0;

  try {
    let carrierText = (carrier_estimate_text || '').trim();
    const contractorInputProvided =
      contractor_estimate_text !== null && contractor_estimate_text !== undefined;
    let contractorText = contractorInputProvided
      ? String(contractor_estimate_text || '').trim()
      : '';

    if (!carrierText && carrier_estimate_pdf_url) {
      carrierText = await extractTextFromPdfUrl(carrier_estimate_pdf_url);
    }
    if (contractorInputProvided && !contractorText && contractor_estimate_pdf_url) {
      contractorText = await extractTextFromPdfUrl(contractor_estimate_pdf_url);
    }

    const compare_mode = resolveCompareMode(contractorText);

    const hasCarrierText = carrierText.length >= 50;
    const hasContractorText = contractorText.length >= MIN_CONTRACTOR_TEXT_CHARS;
    const hasContractorItems = Array.isArray(contractor_line_items) && contractor_line_items.length > 0;

    if (!hasCarrierText && manualCarrierTotal <= 0 && !carrier_estimate_pdf_url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: { message: 'Provide carrier_estimate_text, carrier_estimate_pdf_url, or carrier_total' }
        })
      };
    }

    let apiResult;

    if (!hasCarrierText && manualCarrierTotal > 0) {
      apiResult = {
        ...toApiResponse(manualOnlyResult(manualCarrierTotal, contractorTotal), {
          contractor_parse_method,
          contractor_extraction_method,
          carrier_extraction_method
        })
      };
    } else if (compare_mode === 'RECON_VS_CARRIER' && hasCarrierText) {
      const { comparison, recon_path } = await runReconVsCarrier(
        carrierText,
        claim_type || 'general',
        category || 'BUILDING'
      );
      apiResult = buildReconApiResult(comparison, recon_path, {
        carrier_extraction_method
      });
      if (manualCarrierTotal > 0 && (!apiResult.carrier_total || apiResult.carrier_total === 0)) {
        apiResult.carrier_total = manualCarrierTotal;
        apiResult.gap_amount = Math.max(0, (apiResult.contractor_total || 0) - manualCarrierTotal);
      }
    } else {
      let result;

      const deterministic = compareEstimates({
        contractorText: hasContractorText ? contractorText : '',
        carrierText: hasCarrierText ? carrierText : '',
        contractorLineItems: hasContractorItems ? contractor_line_items : null,
        contractorTotalOverride: contractorTotal,
        carrierTotalOverride: manualCarrierTotal,
        claimType: claim_type
      });

      if (shouldUseDeterministicResult(deterministic) || !process.env.OPENAI_API_KEY) {
        const aiNarrative = await enrichWithAI(
          deterministic,
          carrierText,
          contractorText,
          contractorTotal,
          claim_type
        );
        result = mergeWithAI(deterministic, aiNarrative);
      } else {
        const aiFull = await analyzeWithOpenAIFallback(
          carrierText,
          contractorText,
          contractorTotal,
          claim_type
        );
        result = mergeWithAI(deterministic, aiFull);
        if (!aiFull.line_items?.length) {
          result = deterministic;
          result.analysis_method = 'deterministic';
        }
      }

      if (manualCarrierTotal > 0 && (!result.carrier_total || result.carrier_total === 0)) {
        result.carrier_total = manualCarrierTotal;
        result.gap_amount = Math.max(0, (result.contractor_total || contractorTotal) - manualCarrierTotal);
      }

      apiResult = toApiResponse(result, {
        contractor_parse_method,
        contractor_extraction_method,
        carrier_extraction_method
      });
    }

    if (claim_id && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        await persistResults(supabase, claim_id, apiResult, body);
      } catch (dbErr) {
        console.warn('Supabase persistence failed:', dbErr.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, ...apiResult })
    };
  } catch (error) {
    console.error('Estimate analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: { message: error.message || 'Estimate analysis failed' }
      })
    };
  }
};
