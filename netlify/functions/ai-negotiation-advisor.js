/**
 * AI Negotiation Advisor Function
 * 
 * NOW POWERED BY NEGOTIATION STRATEGY ENGINE + LEGAL PRECEDENT ENGINE + CARRIER TACTIC ENGINE
 * Combines rule-based negotiation frameworks with AI strategic analysis for expert-level guidance
 */

const { runOpenAI, sanitizeInput } = require('./lib/ai-utils');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');
const {
  analyzeNegotiationPosition,
  calculateOptimalDemand,
  generateTacticalResponse,
  NEGOTIATION_FRAMEWORKS,
  LEVERAGE_POINTS
} = require('./lib/negotiation-strategy-db');
const {
  getLegalStandards,
  analyzeBadFaithPotential
} = require('./lib/legal-precedent-db');
const {
  detectCarrierTactics,
  getCarrierIntelligence
} = require('./lib/carrier-tactic-db');

exports.handler = async (event) => {
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
    
    await LOG_EVENT('ai_request', 'ai-negotiation-advisor', { payload: body });
    
    const { 
      offer_amount = 0,
      valuation = 0,
      gap = 0,
      gap_percent = 0,
      disputed_categories = '',
      jurisdiction = '',
      days_since_claim = 0,
      policy_limits = '',
      context = '', 
      claimInfo = {},
      carrier_name = '',
      claim_history = {},
      documentation_score = 70,
      independent_estimates = 1,
      expert_reports = 0,
      attorney_involved = false
    } = body;

    const startTime = Date.now();

    // NEGOTIATION STRATEGY ENGINE: Analyze position strength
    const positionAnalysis = analyzeNegotiationPosition({
      coverage_clear: !body.coverage_disputed,
      documentation_score: documentation_score,
      independent_estimates: independent_estimates,
      expert_reports: expert_reports,
      attorney_involved: attorney_involved,
      pre_existing_conditions: body.pre_existing_conditions || false,
      causation_disputed: body.causation_disputed || false,
      appraisal_available: true
    }, {
      bad_faith_conduct: days_since_claim > 90 || gap_percent > 50,
      statutory_violations: days_since_claim > 90 ? 1 : 0,
      violations_list: days_since_claim > 90 ? ['Excessive delay in claim handling'] : [],
      delaying: days_since_claim > 60,
      amount_disputed: true,
      coverage_disputed: body.coverage_disputed || false
    }, jurisdiction);

    // NEGOTIATION STRATEGY ENGINE: Calculate optimal demand
    const demandCalculation = calculateOptimalDemand(valuation, positionAnalysis);

    // LEGAL PRECEDENT ENGINE: Analyze bad faith potential
    const badFaithAnalysis = analyzeBadFaithPotential({
      days_since_acknowledgment: body.days_since_acknowledgment || 10,
      days_since_claim: days_since_claim,
      lowball_offer: gap_percent > 40,
      offer_percentage: (offer_amount / valuation) * 100,
      offer_amount: offer_amount,
      valuation: valuation,
      inadequate_investigation: body.inadequate_investigation || false,
      investigation_deficiencies: body.investigation_deficiencies || [],
      denial_without_explanation: body.denial_without_explanation || false
    }, jurisdiction);

    // CARRIER TACTIC ENGINE: Detect tactics
    const carrierTactics = detectCarrierTactics({
      events: claim_history.events || [],
      days_since_claim: days_since_claim,
      offer_percentage: (offer_amount / valuation) * 100
    }, carrier_name);

    // CARRIER INTELLIGENCE: Get carrier profile
    const carrierIntel = getCarrierIntelligence(carrier_name);

    // Build enhanced prompt with all intelligence data
    const systemMessage = {
      role: 'system',
      content: `${getClaimGradeSystemMessage('strategy').content}

NEGOTIATION EXPERTISE:
You are a master insurance claim negotiator with expert knowledge of:
- Proven negotiation frameworks and tactics
- Legal leverage points (bad faith, statutory violations)
- Carrier-specific negotiation patterns
- Settlement psychology and positioning

INTELLIGENCE DATA PROVIDED:
1. Position Strength Analysis: ${positionAnalysis.position_category} (Score: ${positionAnalysis.position_strength}/100)
2. Bad Faith Potential: ${badFaithAnalysis.bad_faith_potential}
3. Carrier Tactics Detected: ${carrierTactics.detected_tactics.length} tactics identified
4. Legal Standards: ${jurisdiction} jurisdiction

CRITICAL INSTRUCTIONS:
1. Use the provided intelligence data as your foundation
2. Provide specific, actionable negotiation tactics
3. Reference legal leverage points and statutory violations
4. Tailor strategy to carrier-specific patterns
5. Calculate specific dollar amounts for demands and counter-offers
6. Provide exact language for negotiation communications
7. Format as professional HTML with clear sections`
    };

    let userPrompt = `Provide expert negotiation strategy for this settlement situation:

FINANCIAL DATA:
- Carrier Offer: $${offer_amount.toLocaleString()}
- Your Valuation: $${valuation.toLocaleString()}
- Gap: $${gap.toLocaleString()} (${gap_percent.toFixed(1)}%)
- Policy Limits: ${policy_limits || 'Not specified'}

CLAIM CONTEXT:
- Jurisdiction: ${jurisdiction || 'Not specified'}
- Days Since Claim: ${days_since_claim || 'Not specified'}
- Disputed Categories: ${sanitizeInput(disputed_categories)}
- Carrier: ${carrier_name || 'Not specified'}
- Context: ${sanitizeInput(context)}

POSITION ANALYSIS (Rule-Based):
${JSON.stringify(positionAnalysis, null, 2)}

OPTIMAL DEMAND CALCULATION (Rule-Based):
${JSON.stringify(demandCalculation, null, 2)}

BAD FAITH ANALYSIS (Legal Database):
${JSON.stringify(badFaithAnalysis, null, 2)}

CARRIER TACTICS DETECTED (Carrier Intelligence):
${JSON.stringify(carrierTactics, null, 2)}

CARRIER PROFILE:
${JSON.stringify(carrierIntel, null, 2)}

Provide comprehensive negotiation strategy including:

1. POSITION ASSESSMENT
   - Strengths and weaknesses
   - Leverage points
   - Settlement probability

2. RECOMMENDED STRATEGY
   - Specific negotiation framework to use
   - Tactical approach
   - Communication strategy

3. COUNTER-OFFER RECOMMENDATION
   - Specific dollar amount with justification
   - Supporting arguments
   - Concession limits

4. LEGAL LEVERAGE
   - Bad faith implications
   - Statutory violations
   - Potential damages beyond policy limits

5. CARRIER-SPECIFIC TACTICS
   - Expected carrier response
   - Counter-tactics
   - Escalation options

6. NEXT STEPS
   - Immediate actions (prioritized)
   - Timeline
   - Documentation needed

Format as professional HTML with clear headings and bullet points. Be specific with dollar amounts and deadlines.`;

    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'strategy');

    const rawResponse = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2500
    });

    const processedResponse = postProcessResponse(rawResponse, 'strategy');
    const validation = validateProfessionalOutput(processedResponse, 'strategy');

    if (!validation.pass) {
      console.warn('[ai-negotiation-advisor] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-negotiation-advisor', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      html: processedResponse,
      analysis: processedResponse,
      gap: gap,
      gap_percent: gap_percent,
      recommended_counter: demandCalculation.recommended_demand,
      minimum_acceptable: demandCalculation.minimum_acceptable,
      position_strength: positionAnalysis.position_strength,
      bad_faith_potential: badFaithAnalysis.bad_faith_potential,
      detected_tactics: carrierTactics.detected_tactics.map(t => t.tactic),
      leverage_points: positionAnalysis.leverage_points.map(lp => lp.leverage_level),
      intelligence_summary: {
        position: positionAnalysis.position_category,
        legal_leverage: badFaithAnalysis.triggers.length,
        carrier_tactics: carrierTactics.detected_tactics.length,
        recommended_frameworks: positionAnalysis.recommended_frameworks.map(f => f.description)
      }
    };

    await LOG_USAGE({
      function: 'ai-negotiation-advisor',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    await LOG_COST({
      function: 'ai-negotiation-advisor',
      estimated_cost_usd: 0.003
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
          intelligence_sources: ['negotiation-strategy-db', 'legal-precedent-db', 'carrier-tactic-db']
        }, 
        error: null 
      })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-negotiation-advisor',
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
