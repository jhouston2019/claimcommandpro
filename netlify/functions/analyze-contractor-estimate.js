/**
 * Claim Command Center v3 — contractor estimate from fileUrl (Anthropic).
 * POST JSON: { fileUrl?, claimData? }
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
    if (!body.fileUrl || typeof body.fileUrl !== 'string' || !body.fileUrl.startsWith('http')) {
      return cccJsonResponse(400, { error: 'fileUrl must be an http(s) URL' });
    }

    const docText = await extractTextFromUrl(body.fileUrl);
    const userText = `From this contractor/restoration estimate text, extract totals and line item count. Text:

---
${docText.slice(0, 100000)}
---

Return JSON only:
{
  "totalEstimate": <number, grand total USD>,
  "lineItemCount": <integer, approximate count of line items>,
  "lineItems": <optional array of { description, amount } for up to 25 significant lines>
}`;

    const out = await anthropicJsonObject({
      system: 'You extract structured numbers from construction estimates.',
      userText,
      maxTokens: 4096,
    });

    const result = {
      totalEstimate: Number(out.totalEstimate) || 0,
      lineItemCount: Math.max(0, Math.round(Number(out.lineItemCount) || 0)),
      lineItems: Array.isArray(out.lineItems) ? out.lineItems : undefined,
    };

    return cccJsonResponse(200, result);
  } catch (err) {
    console.error('analyze-contractor-estimate', err);
    return cccJsonResponse(500, { error: err.message || 'Estimate analysis failed' });
  }
};
