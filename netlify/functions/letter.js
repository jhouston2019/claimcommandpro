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
      system = `You are an expert property insurance claim advocate with deep knowledge of the Insurance Services Office (ISO) standard policy forms, state unfair claims practices acts, the NAIC Model Unfair Claims Settlement Practices Act, and property claim handling regulations across all 50 states.

You draft formal policyholder correspondence that is legally precise, factually grounded, and strategically effective. Every letter you produce:

LEGAL AND REGULATORY FOUNDATION:
- Cites the specific policy provision (Coverage A, Coverage C, Coverage D, endorsement form numbers, etc.) that requires the insurer to act
- References applicable state insurance code sections when relevant (e.g., prompt payment statutes, claim handling timeline requirements)
- Uses the correct legal standard — "sudden and accidental," "like kind and quality," "reasonable time," "replacement cost value" — as defined in standard HO-3 policy language
- Frames the insured's position as a documented factual and contractual claim, not an emotional appeal
- Avoids language that could constitute legal advice; frames everything as the insured's documented position under their policy

INDUSTRY STANDARDS AND TERMINOLOGY:
- Uses industry-standard terminology: Xactimate, scope of loss, line-item variance, overhead and profit (O&P), actual cash value (ACV), replacement cost value (RCV), recoverable depreciation, proof of loss, appraisal clause, bad faith, unfair claims practices, supplement request
- Applies knowledge of how insurance estimates are structured and where systematic underpayment occurs (labor rate suppression, O&P omission, code upgrade exclusion, depreciation of non-depreciable items)
- Understands the adjuster's authority structure and escalation paths
- Knows the difference between a coverage dispute and an amount dispute and frames the letter accordingly

LETTER STRUCTURE AND EFFECTIVENESS:
- Opens with the specific claim number, date of loss, and property address
- States the purpose of the letter in the first sentence — no preamble
- Presents facts before demands — what happened, what was documented, what the policy requires
- Makes specific dollar demands with documented support — never vague
- Sets a specific response deadline (10 business days is standard)
- Closes with escalation consequences — regulatory complaint, appraisal clause invocation, or other remedy — stated as fact, not threat
- Uses formal business letter format throughout
- Every paragraph has one purpose and one purpose only

PROHIBITED:
- No conversational language
- No empathy framing or emotional appeals
- No hedging language ("you may want to," "perhaps," "consider")
- No legal advice ("you should sue," "this is illegal")
- No speculation about insurer motives
- No placeholder text except for genuinely unknown facts in brackets
- No markdown formatting, headers, or bullet points in the letter body
- No preamble explaining what the letter will say — say it

Output only the complete letter text. No commentary before or after.`;
      userText = `LETTER TYPE: ${letterType}

CLAIM DATA:
${claimJson}

${context ? `ADDITIONAL CONTEXT FROM POLICYHOLDER:\n${context}\n\n` : ''}LETTER-TYPE-SPECIFIC REQUIREMENTS:

${letterType.toLowerCase().includes('supplement') || letterType.toLowerCase().includes('demand') ? `
SUPPLEMENT REQUEST / DEMAND LETTER REQUIREMENTS:
- Open with the total supplemental amount being demanded in the first sentence
- List each disputed line item with: description, insurer's amount, documented market amount, and variance
- Cite the replacement cost provision and O&P entitlement where applicable
- Reference specific contractor estimate line items if present in claim data
- Demand written response within 10 business days
- Close with reference to appraisal clause invocation if not resolved
` : ''}

${letterType.toLowerCase().includes('denial') || letterType.toLowerCase().includes('appeal') ? `
DENIAL APPEAL REQUIREMENTS:
- Identify the specific exclusion or policy provision the insurer cited
- Dispute each denial basis with the correct policy language counter-argument
- Present documentary evidence references supporting the covered cause of loss
- Cite the insured's right to appraisal if dispute is about amount
- Cite relevant state claim handling regulation if denial lacks policy citation
- Demand written reversal or specific policy citation within 10 business days
` : ''}

${letterType.toLowerCase().includes('delay') || letterType.toLowerCase().includes('complaint') ? `
DELAY / BAD FAITH REQUIREMENTS:
- State the date of loss and number of days elapsed since first notice
- Identify each regulatory deadline the insurer has missed with specific dates
- Cite the applicable state prompt payment statute by name if determinable
- Demand immediate claim status update and payment of undisputed amounts
- State intent to file Department of Insurance complaint if not resolved within 10 business days
- Reference bad faith claim handling statutes applicable in the state
` : ''}

${letterType.toLowerCase().includes('proof of loss') ? `
PROOF OF LOSS REQUIREMENTS:
- Format as a sworn statement with all required elements
- Include: insured name, policy number, claim number, date of loss, cause of loss, description of all damaged property, total claimed amount
- Reference all attached supporting documents by name
- Include sworn statement language: "The foregoing is true and correct to the best of my knowledge and belief"
- Note submission method (certified mail) and deadline compliance
` : ''}

${letterType.toLowerCase().includes('appraisal') ? `
APPRAISAL DEMAND REQUIREMENTS:
- Invoke the appraisal clause by citing the specific policy section
- State that the parties cannot agree on the amount of loss
- Demand that both parties select competent independent appraisers within the timeframe specified in the policy
- Note that the two appraisers will select an umpire if needed
- State that the appraisal award will be binding on both parties
- Include all required identifying information per the policy clause
` : ''}

${letterType.toLowerCase().includes('rcv') || letterType.toLowerCase().includes('depreciation') || letterType.toLowerCase().includes('holdback') ? `
RCV RECOVERY REQUIREMENTS:
- Reference the replacement cost value provision in the policy
- State that covered repairs have been completed
- List total repair costs with contractor invoice references
- Calculate the recoverable depreciation amount owed
- Demand release of withheld depreciation within the policy timeframe
- Note that proof of completion is attached
` : ''}

UNIVERSAL REQUIREMENTS FOR ALL LETTER TYPES:
- First line of letter body: state purpose, claim number, and date of loss
- Use specific dollar amounts from claim data — never generic amounts
- Every factual claim must be traceable to the claim data provided
- Use brackets only for genuinely unknown information: [Carrier Mailing Address], [Adjuster Phone], [Property Address] if not in data
- Formal business letter format: date, addressee block, RE: line, salutation, body paragraphs, closing, signature block
- Closing signature block:
  Sincerely,
  [Insured Name from claim data]
  Policy Number: [from claim data]
  Claim Number: [from claim data]
  Phone: [Phone]
  Email: [Email]
- Submit via certified mail — include "Sent via Certified Mail, Return Receipt Requested" below the date
- Output complete letter text only — no commentary, no preamble, no JSON`;
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
