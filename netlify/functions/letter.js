/**
 * Claim Command Center v3 — correspondence letter (Anthropic).
 * POST JSON: { letterType, claimData, userId?, context? }
 */

const {
  cccJsonResponse,
  handleCccOptions,
  anthropicMessagesText,
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
    const letterType = body.letterType || body.type || 'Correspondence';
    const claimData = body.claimData || {};
    const context = typeof body.context === 'string' ? body.context.trim() : '';
    const userId = body.userId || null;

    const claimJson = JSON.stringify(claimData).slice(0, 60000);
    const userText = `Write a formal insurance claim letter.

Letter type / purpose: ${letterType}

Claim data (JSON): ${claimJson}

${context ? `Additional context from the policyholder:\n${context}\n` : ''}
${userId ? `(Internal reference user id: ${userId} — do not include this id in the letter.)\n` : ''}

Requirements:
- Use clear professional tone suitable for certified mail / email to the insurer.
- Include placeholders in brackets where specific facts are unknown: [Property Address], [Phone], [Email], [Carrier mailing address].
- Reference claim number and date of loss when present in claim data.
- Do not provide legal advice; frame as the insured's documented position.
- Output the full letter body as plain text only (no JSON, no markdown code fences).`;

    const letter = await anthropicMessagesText({
      system:
        'You draft policyholder correspondence for property insurance claims. Output only the letter text.',
      userText,
      maxTokens: 8192,
    });

    const trimmed = (letter || '').trim();
    if (!trimmed) {
      return cccJsonResponse(500, { error: 'Empty letter from model' });
    }

    return cccJsonResponse(200, { letter: trimmed });
  } catch (err) {
    console.error('letter', err);
    return cccJsonResponse(500, { error: err.message || 'Letter generation failed' });
  }
};
