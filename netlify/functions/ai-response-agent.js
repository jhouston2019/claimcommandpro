/**
 * AI Response Agent Function
 * Generates professional response letters to insurer communications
 * 
 * NOW ENHANCED WITH LEGAL PRECEDENT ENGINE + CARRIER TACTIC ENGINE
 * Combines legal knowledge and carrier intelligence with AI letter generation
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');
const {
  getLegalStandards,
  analyzeBadFaithPotential
} = require('./lib/legal-precedent-db');
const {
  detectCarrierTactics,
  getCarrierIntelligence,
  CARRIER_TACTICS
} = require('./lib/carrier-tactic-db');


exports.handler = async (event) => {
  // ✅ PHASE 5B: PROMPT HARDENING COMPLETE
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, data: null, error: { code: 'CN-4000', message: 'Method not allowed' } })
    };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Authorization required' } })
      };
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-2000', message: 'Invalid token' } })
      };
    }

    // Check payment status
    const { data: payment } = await supabase
      .from('payments')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (!payment) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-3000', message: 'Payment required' } })
      };
    }

    // Unified body parsing
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, data: null, error: { code: 'CN-1000', message: 'Invalid JSON body' } })
      };
    }
    
    // Log event
    await LOG_EVENT('ai_request', 'ai-response-agent', { payload: body });
    
    // Validate required fields
    validateRequired(body, ['denial_letter_text']);

    const {
      claim_type = 'general',
      insurer_name = '',
      denial_letter_text,
      tone = 'professional',
      claimInfo = {},
      jurisdiction = claimInfo.jurisdiction || '',
      days_since_claim = 0,
      claim_history = {}
    } = body;

    // Sanitize inputs
    const sanitizedText = sanitizeInput(denial_letter_text);
    const sanitizedInsurer = sanitizeInput(insurer_name);

    const startTime = Date.now();

    // LEGAL PRECEDENT ENGINE: Get jurisdiction standards
    const legalStandards = jurisdiction ? getLegalStandards(jurisdiction) : null;

    // LEGAL PRECEDENT ENGINE: Analyze bad faith potential
    let badFaithAnalysis = null;
    if (legalStandards && days_since_claim > 0) {
      badFaithAnalysis = analyzeBadFaithPotential({
        days_since_acknowledgment: body.days_since_acknowledgment || 15,
        days_since_claim: days_since_claim,
        lowball_offer: body.lowball_offer || false,
        offer_percentage: body.offer_percentage || 100,
        offer_amount: body.offer_amount || 0,
        valuation: body.valuation || 0,
        inadequate_investigation: body.inadequate_investigation || false,
        investigation_deficiencies: body.investigation_deficiencies || [],
        denial_without_explanation: sanitizedText.length < 200
      }, jurisdiction);
    }

    // CARRIER TACTIC ENGINE: Detect tactics in correspondence
    const carrierTactics = detectCarrierTactics({
      events: claim_history.events || [],
      days_since_claim: days_since_claim,
      offer_percentage: body.offer_percentage || 100
    }, insurer_name);

    // CARRIER INTELLIGENCE: Get carrier profile
    const carrierIntel = getCarrierIntelligence(insurer_name);

    // PHASE 5B: Enhanced system message with legal and carrier intelligence
    const systemMessage = {
      role: 'system',
      content: `${getClaimGradeSystemMessage('letter').content}

RESPONSE LETTER EXPERTISE:
You are a senior property insurance claim correspondent with expert knowledge of the following — apply this knowledge in every letter:

REGULATORY FRAMEWORK:
- NAIC Model Unfair Claims Settlement Practices Act: defines prohibited insurer conduct including misrepresentation, unreasonable delay, and failure to investigate
- State prompt payment statutes: acknowledgment within 10-15 days, investigation within 10 days, determination within 30-45 days in most states — cite violations when present
- Policyholder bill of rights: right to written explanation of denial, right to appeal, right to regulatory complaint

CARRIER TACTIC COUNTERMEASURES:
- Delay by documentation request: cite that documents were already provided on [date] and demand response on substantive position
- Low estimate: cite specific line items with market rate documentation
- Exclusion misapplication: quote the exclusion exactly and explain why it does not apply to the cause of loss
- Recorded statement demand: acknowledge right to request but assert right to prepare with counsel present
- Reservation of rights: respond in writing confirming receipt and demand coverage position within regulatory timeframe

LETTER CONSTRUCTION STANDARDS:
- Open with purpose, claim number, and date of loss in first sentence
- Present facts before demands — what happened, what was submitted, what the policy requires
- Every demand tied to specific policy language or regulatory requirement
- Response deadline: 10 business days (state in every letter)
- Escalation path stated as fact, not threat: regulatory complaint, appraisal clause, legal counsel referral
- Formal business letter format throughout
- No emotional language, no hedging, no legal advice

PROHIBITED IN ALL LETTERS:
- "You may want to consider..." — state requirements directly
- "I feel that..." — state documented positions
- "As soon as possible" — state specific deadlines
- Legal conclusions ("this is illegal") — cite regulatory standards instead
- Apologies or gratitude to the insurer
- Speculation about insurer motives

OUTPUT FORMAT: Return valid JSON only:
{
  "subject": "RE: [Claim Number] — [Letter Purpose] — Response Required by [Date]",
  "body": "Complete formal letter text as plain string with \\n line breaks",
  "next_steps": ["Specific action", "Specific action"]
}
body must be the complete letter — not a summary. next_steps must be specific actions with timeframes.

INTELLIGENCE DATA PROVIDED:
${legalStandards ? `Legal Standards: ${jurisdiction} - Deadlines: ${JSON.stringify(legalStandards.claim_handling_deadlines)}` : 'No jurisdiction data'}
${badFaithAnalysis ? `Bad Faith Potential: ${badFaithAnalysis.bad_faith_potential} - Triggers: ${badFaithAnalysis.triggers.length}` : 'No bad faith analysis'}
${carrierTactics.detected_tactics.length > 0 ? `Carrier Tactics Detected: ${carrierTactics.detected_tactics.map(t => t.tactic).join(', ')}` : 'No tactics detected'}
${carrierIntel.profile ? `Carrier Profile: ${carrierIntel.profile.claim_philosophy}` : 'No carrier profile'}`
    };

    const toneInstructions = {
      professional: 'Use a professional, cooperative tone. Focus on facts and policy compliance.',
      firm: 'Use a firm but respectful tone. Assert policyholder rights clearly.',
      escalation: 'Use a more assertive tone appropriate for escalating disputes. Reference regulatory oversight if applicable.',
      'attorney-style': 'Use a formal, legalistic tone appropriate for attorney correspondence. Cite legal precedents when relevant.'
    };

    // Build enhanced user prompt with intelligence data
    let userPrompt = `Draft a ${tone} response letter to this insurer correspondence:

INSURER: ${sanitizedInsurer}
CLAIM TYPE: ${claim_type}
JURISDICTION: ${jurisdiction || 'Not specified'}
TONE: ${toneInstructions[tone] || toneInstructions.professional}

INSURER CORRESPONDENCE:
${sanitizedText}

LEGAL INTELLIGENCE:
${legalStandards ? JSON.stringify({
  claim_handling_deadlines: legalStandards.claim_handling_deadlines,
  key_statutes: legalStandards.key_statutes.map(s => `${s.code}: ${s.description}`),
  bad_faith_triggers: legalStandards.bad_faith_triggers
}, null, 2) : 'No jurisdiction-specific standards available'}

BAD FAITH ANALYSIS:
${badFaithAnalysis ? JSON.stringify({
  potential: badFaithAnalysis.bad_faith_potential,
  triggers: badFaithAnalysis.triggers,
  recommended_actions: badFaithAnalysis.recommended_actions
}, null, 2) : 'No bad faith concerns identified'}

CARRIER TACTICS DETECTED:
${carrierTactics.detected_tactics.length > 0 ? JSON.stringify(carrierTactics.detected_tactics.map(t => ({
  tactic: t.tactic,
  severity: t.severity,
  countermeasure: t.countermeasure
})), null, 2) : 'No specific tactics detected'}

CARRIER PROFILE:
${carrierIntel.profile ? JSON.stringify({
  philosophy: carrierIntel.profile.claim_philosophy,
  common_tactics: carrierIntel.profile.common_tactics,
  negotiation_leverage: carrierIntel.profile.negotiation_leverage
}, null, 2) : 'No carrier-specific intelligence available'}

Draft a response letter that:
1. Addresses all points in insurer correspondence
2. References applicable legal standards and deadlines
3. Counters any detected carrier tactics
4. Asserts policyholder rights appropriately for the tone
5. Sets clear deadlines for carrier response
6. Includes proper business letter formatting

Provide:
1. Professional subject line
2. Complete letter body with proper salutation, body paragraphs, and closing
3. Three specific next steps with timelines

Format your response as JSON:
{
  "subject": "Subject line here",
  "body": "Complete letter body here",
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}`;

    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'letter');

    // Call OpenAI
    const rawResponse = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch (e) {
      // If not JSON, extract structured data
      result = {
        subject: extractSubject(rawResponse),
        body: rawResponse,
        next_steps: extractNextSteps(rawResponse)
      };
    }

    // PHASE 5B: Post-process and validate letter body
    result.body = postProcessResponse(result.body, 'letter');
    const validation = validateProfessionalOutput(result.body, 'letter');

    // Enrich result with intelligence metadata
    result.intelligence_applied = {
      legal_standards_referenced: legalStandards ? true : false,
      bad_faith_triggers_identified: badFaithAnalysis?.triggers.length || 0,
      carrier_tactics_countered: carrierTactics.detected_tactics.length,
      jurisdiction: jurisdiction || 'Not specified'
    };

    if (!validation.pass) {
      console.warn('[ai-response-agent] Quality issues detected:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-response-agent', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-response-agent',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-response-agent',
      estimated_cost_usd: 0.002
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: result, 
        metadata: {
          quality_score: validation.score,
          validation_passed: validation.pass,
          engine_powered: true,
          intelligence_sources: ['legal-precedent-db', 'carrier-tactic-db']
        },
        error: null 
      })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-response-agent',
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'CN-5000', message: error.message }
      })
    };
  }
};

/**
 * Extract subject from text
 */
function extractSubject(text) {
  const match = text.match(/subject[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : 'Response to Insurer Correspondence';
}

/**
 * Extract next steps from text
 */
function extractNextSteps(text) {
  const steps = [];
  const lines = text.split('\n');
  let inSteps = false;
  
  for (const line of lines) {
    if (line.match(/next steps?|recommended actions?/i)) {
      inSteps = true;
      continue;
    }
    if (inSteps && line.match(/^\d+[\.\)]\s*(.+)$/)) {
      steps.push(line.replace(/^\d+[\.\)]\s*/, '').trim());
    }
    if (steps.length >= 3) break;
  }
  
  return steps.length > 0 ? steps : [
    'Review the response with your insurance professional',
    'Submit the response via certified mail',
    'Follow up within 10 business days'
  ];
}


