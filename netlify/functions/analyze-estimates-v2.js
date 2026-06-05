/**
 * Netlify Function: analyze-estimates-v2
 * Compares carrier estimate against contractor total; returns line items and gap categories.
 */

const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { runOpenAI, sanitizeInput } = require('./lib/ai-utils');

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

function manualOnlyResult(carrierTotal) {
  const total = Number(carrierTotal) || 0;
  return {
    carrier_total: total,
    line_items: [],
    gap_categories: [],
    gap_summary: 'Manual total entered — upload estimate PDF for line-item analysis',
    summary: 'Carrier total: ' + fmtMoney(total)
  };
}

async function extractTextFromPdfUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download carrier estimate PDF');
  const buffer = Buffer.from(await res.arrayBuffer());
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

function normalizeLineItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const carrier = item.carrier_amount != null ? Number(item.carrier_amount)
      : item.carrier != null ? Number(item.carrier) : 0;
    const contractor = item.contractor_amount != null ? Number(item.contractor_amount)
      : item.contractor != null ? Number(item.contractor) : null;
    const co = contractor != null ? contractor : 0;
    const variance = item.variance != null ? Number(item.variance) : co - carrier;
    let status = item.status || '';
    if (!status) {
      if (carrier === 0 && co > 0) status = 'Missing from Carrier';
      else if (co > carrier && carrier > 0) status = 'Undervalued';
      else if (Math.abs(co - carrier) <= 100) status = 'Match';
      else status = 'Disputed';
    }
    return {
      description: item.description || item.name || item.line_item || '—',
      carrier_amount: carrier,
      contractor_amount: contractor,
      variance,
      status
    };
  });
}

function normalizeGapCategories(cats, totalGap) {
  if (!Array.isArray(cats)) return [];
  return cats.map((c) => ({
    category: c.category || c.name || 'Other',
    amount: Number(c.amount) || 0,
    description: c.description || ''
  })).filter((c) => c.amount > 0 || c.category);
}

async function analyzeWithOpenAI(carrierText, contractorEstimate, claimType) {
  const systemPrompt = `You are an insurance claim estimate analyst. Compare a carrier (insurer) estimate against the policyholder's documented contractor total.

Return ONLY valid JSON with this exact structure:
{
  "carrier_total": number,
  "line_items": [
    {
      "description": "string — line item description",
      "carrier_amount": number,
      "contractor_amount": number or null,
      "variance": number,
      "status": "Match" | "Undervalued" | "Missing from Carrier" | "Disputed"
    }
  ],
  "gap_categories": [
    {
      "category": "string — e.g. Missing scope items, Underpriced labor, Unapplied coverages, Improper depreciation",
      "amount": number
    }
  ],
  "gap_summary": "string — one paragraph explaining the key gaps found",
  "summary": "string — overall comparison summary for the user"
}

Rules:
- Compare the carrier estimate text against the contractor total provided
- Extract EVERY line item from the carrier estimate text
- For each line item, assess whether the carrier amount is fair market value
- For missing items (in contractor scope but not carrier estimate), set carrier_amount to 0 and status to "Missing from Carrier"
- variance = contractor_amount minus carrier_amount (use null contractor_amount as 0 for variance when unknown)
- gap_categories must sum to approximately the total gap amount (contractor total minus carrier_total)
- Always return line_items as an array even if only one item
- If carrier estimate text is empty and only a carrier total is provided, return line_items: [] and gap_categories: [] with gap_summary explaining that detailed line items require the carrier estimate PDF`;

  const userPrompt = `Claim type: ${claimType || 'property-claim'}
Contractor documented total: $${Number(contractorEstimate || 0).toLocaleString()}

Carrier estimate text:
${sanitizeInput(carrierText).slice(0, 40000)}`;

  const raw = await runOpenAI(systemPrompt, userPrompt, {
    model: 'gpt-4o',
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error('AI returned invalid JSON');
  }

  parsed.line_items = parsed.line_items || [];
  parsed.gap_categories = parsed.gap_categories || [];
  parsed.carrier_total = Number(parsed.carrier_total) || 0;

  const lineItems = normalizeLineItems(parsed.line_items);
  const gapCategories = normalizeGapCategories(parsed.gap_categories);
  const computedGap = Math.max(0, Number(contractorEstimate || 0) - parsed.carrier_total);

  return {
    carrier_total: parsed.carrier_total,
    line_items: lineItems,
    gap_categories: gapCategories,
    gap_summary: parsed.gap_summary || `Identified gap of ${fmtMoney(computedGap)} between carrier and contractor totals.`,
    summary: parsed.summary || `Carrier estimate analyzed — total ${fmtMoney(parsed.carrier_total)}.`
  };
}

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
    carrier_estimate_pdf_url,
    contractor_estimate_pdf_url,
    contractor_estimate,
    carrier_total,
    claim_type,
    carrier_document_id,
    contractor_document_id
  } = body;

  const manualTotal = Number(carrier_total) || 0;
  let estimateText = (carrier_estimate_text || '').trim();

  try {
    if (!estimateText && carrier_estimate_pdf_url) {
      estimateText = await extractTextFromPdfUrl(carrier_estimate_pdf_url);
    }

    const hasText = estimateText.length >= 50;
    const hasManual = manualTotal > 0;

    if (!hasText && !hasManual && !carrier_estimate_pdf_url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: { message: 'Provide carrier_estimate_text, carrier_estimate_pdf_url, or carrier_total' }
        })
      };
    }

    let result;

    if (!hasText && hasManual) {
      result = manualOnlyResult(manualTotal);
    } else if (!process.env.OPENAI_API_KEY) {
      const inferredTotal = manualTotal > 0 ? manualTotal : 0;
      result = {
        carrier_total: inferredTotal,
        line_items: [],
        gap_categories: [],
        gap_summary: 'AI analysis unavailable — configure OPENAI_API_KEY for line-item extraction.',
        summary: inferredTotal > 0 ? 'Carrier total: ' + fmtMoney(inferredTotal) : 'Upload carrier estimate text for analysis.'
      };
    } else {
      result = await analyzeWithOpenAI(estimateText, contractor_estimate, claim_type);
      if (manualTotal > 0 && (!result.carrier_total || result.carrier_total === 0)) {
        result.carrier_total = manualTotal;
      }
    }

    const gapAmount = Math.max(0, (Number(contractor_estimate) || 0) - (result.carrier_total || 0));

    if (claim_id && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        if (result.line_items.length > 0) {
          for (const item of result.line_items) {
            const diff = Math.max(0, (item.contractor_amount || 0) - (item.carrier_amount || 0));
            if (diff <= 0 && item.carrier_amount > 0) continue;
            await supabase.from('claim_estimate_discrepancies').insert({
              claim_id,
              carrier_document_id: carrier_document_id || null,
              contractor_document_id: contractor_document_id || null,
              line_item: item.description,
              carrier_amount: item.carrier_amount,
              contractor_amount: item.contractor_amount,
              difference_amount: diff,
              delta_type: item.carrier_amount === 0 ? 'missing' : 'undervalued',
              description: item.status,
              created_at: new Date().toISOString()
            }).then(() => {}).catch((err) => console.warn('Discrepancy insert:', err.message));
          }
        }

        await supabase.from('claim_financial_summary').upsert({
          claim_id,
          insurer_estimate: result.carrier_total || 0,
          claimant_estimate: Number(contractor_estimate) || 0,
          gap_amount: gapAmount,
          underpayment_estimate: gapAmount,
          updated_at: new Date().toISOString()
        }).then(() => {}).catch((err) => console.warn('Financial summary upsert:', err.message));
      } catch (dbErr) {
        console.warn('Supabase persistence failed:', dbErr.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
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
