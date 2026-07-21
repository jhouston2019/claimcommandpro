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
    const mode = body.mode === 'analysis' ? 'analysis' : 'letter';

    const claimJson = JSON.stringify(claimData).slice(0, 60000);

    const strategyCode = body.negotiationStrategy
      || claimData?.structure?.negotiationStrategy?.recommendedStrategy
      || claimData?.meta?.negotiationStrategy?.recommendedStrategy
      || null;

    const strategyRationale = claimData?.structure?.negotiationStrategy?.rationale
      || claimData?.meta?.negotiationStrategy?.rationale
      || null;

    const strategyFragment = strategyCode
      ? `\nSelected negotiation strategy: ${strategyCode}${strategyRationale ? '\nStrategy rationale: ' + strategyRationale : ''}\nTailor the letter tone and demands to match this strategy.`
      : '';

    const enforcementReport = body.enforcementReport
      || claimData?.meta?.enforcementReport
      || null;

    const enforcementFragment = enforcementReport
      ? `\nEnforcement analysis:\n${JSON.stringify(enforcementReport).slice(0, 8000)}\nUse the code upgrade detections, carrier pattern findings, and gap amounts from this enforcement report to support specific demands in the letter.`
      : '';

    let system;
    let userText;
    if (mode === 'analysis') {
      system =
        'You analyze property insurance claim correspondence situations. Output structured plain-text analysis only — never draft a full letter.';
      userText = `Analyze the claim situation for preparing this correspondence:

Letter type / purpose: ${letterType}

Claim data (JSON): ${claimJson}

${context ? `Additional context from the policyholder:\n${context}\n` : ''}
${userId ? `(Internal reference user id: ${userId} — do not include this id in the output.)\n` : ''}

Requirements:
- Reference specific numbers, coverage, estimates, and documentation from the claim data when available.
- Do not provide legal advice; frame as informational claim-handling guidance.
- Output plain text only (no JSON, no markdown code fences) with these sections:

PURPOSE:
(one or two sentences)

KEY POINTS:
- (4–6 bullet points tailored to this claim and letter type)

LEGAL CONTEXT:
(2–3 sentences on response timelines, certified mail, and rights preservation — general, not state-specific legal advice)

DOCUMENTATION NOTES:
(what attachments or prior correspondence to reference)`;
    } else {
      userText = `Write a formal insurance claim letter.

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
      system =
        'You draft policyholder correspondence for property insurance claims. Output only the letter text.';
    }

    userText += strategyFragment;
    userText += enforcementFragment;

    const letter = await anthropicMessagesText({
      system,
      userText,
      maxTokens: mode === 'analysis' ? 4096 : 8192,
    });

    const trimmed = (letter || '').trim();
    if (!trimmed) {
      return cccJsonResponse(500, { error: mode === 'analysis' ? 'Empty analysis from model' : 'Empty letter from model' });
    }

    if (mode === 'analysis') {
      return cccJsonResponse(200, { analysis: trimmed });
    }

    return cccJsonResponse(200, { letter: trimmed });
  } catch (err) {
    console.error('letter', err);
    return cccJsonResponse(500, { error: err.message || 'Letter generation failed' });
  }
};
