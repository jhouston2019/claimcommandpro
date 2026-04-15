/**
 * Claim Command Center v3 — carrier estimate from fileUrl (Anthropic).
 * POST JSON: { fileUrl?, manualTotal?, claimData? }
 */

const {
  cccJsonResponse,
  handleCccOptions,
  extractTextFromUrl,
  anthropicJsonObject,
} = require('./lib/ccc-anthropic-helpers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCccOptions();
  }
  if (event.httpMethod !== 'POST') {
    return cccJsonResponse(405, { error: 'Method not allowed' });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (_) {
    return cccJsonResponse(400, { error: 'Invalid JSON body' });
  }

  try {
    const manual =
      body.manualTotal != null && body.manualTotal !== ''
        ? Number(body.manualTotal)
        : null;

    let docText = '';
    if (body.fileUrl && typeof body.fileUrl === 'string' && body.fileUrl.startsWith('http')) {
      docText = await extractTextFromUrl(body.fileUrl);
    }

    if (!docText && manual != null && !Number.isNaN(manual)) {
      return cccJsonResponse(200, {
        carrierTotal: manual,
        lineItemCount: 0,
      });
    }

    if (!docText) {
      return cccJsonResponse(400, { error: 'Provide fileUrl or manualTotal' });
    }

    const hint =
      manual != null && !Number.isNaN(manual)
        ? `User-entered carrier total hint (verify against document): ${manual}.`
        : '';

    const userText = `From this insurance carrier estimate / adjuster scope document, extract the carrier's total and approximate line item count. ${hint}

Document:
---
${docText.slice(0, 100000)}
---

Return JSON only:
{
  "carrierTotal": <number, USD total offered by carrier>,
  "lineItemCount": <integer>,
  "lineItems": <optional array of { description, amount } up to 25 lines>
}`;

    const out = await anthropicJsonObject({
      system: 'You extract totals from insurance carrier estimates.',
      userText,
      maxTokens: 4096,
    });

    let carrierTotal = Number(out.carrierTotal);
    if (Number.isNaN(carrierTotal) && manual != null) {
      carrierTotal = manual;
    }
    if (Number.isNaN(carrierTotal)) {
      carrierTotal = 0;
    }

    const result = {
      carrierTotal,
      lineItemCount: Math.max(0, Math.round(Number(out.lineItemCount) || 0)),
      lineItems: Array.isArray(out.lineItems) ? out.lineItems : undefined,
    };

    return cccJsonResponse(200, result);
  } catch (err) {
    console.error('analyze-carrier-estimate', err);
    return cccJsonResponse(500, { error: err.message || 'Carrier estimate analysis failed' });
  }
};
