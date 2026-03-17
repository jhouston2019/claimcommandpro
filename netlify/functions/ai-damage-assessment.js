/**
 * AI Damage Assessment Function
 * 
 * NOW POWERED BY DAMAGE PATTERN RECOGNITION ENGINE
 * Combines rule-based pattern matching with AI analysis for expert-level damage assessment
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
  analyzeDamagePattern,
  identifyHiddenDamageRisks,
  generateScopeOfWork,
  assessCausationStrength
} = require('./lib/damage-pattern-db');

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
    
    await LOG_EVENT('ai_request', 'ai-damage-assessment', { payload: body });
    
    const { 
      damage_description = '', 
      damage_types = [], 
      damage_items = [], 
      claimInfo = {},
      property_details = {},
      evidence_items = []
    } = body;

    const startTime = Date.now();

    // DAMAGE PATTERN ENGINE: Analyze damage pattern
    const patternAnalysis = analyzeDamagePattern({
      description: damage_description,
      damage_types: damage_types
    });

    // DAMAGE PATTERN ENGINE: Identify hidden damage risks
    const primaryDamageType = damage_types[0] || 'water';
    const hiddenRisks = identifyHiddenDamageRisks(damage_description, primaryDamageType);

    // DAMAGE PATTERN ENGINE: Generate scope of work
    const scopeOfWork = generateScopeOfWork(patternAnalysis, {
      square_feet: property_details.square_feet || 2000,
      age: property_details.age || 20,
      jurisdiction: property_details.jurisdiction || claimInfo.jurisdiction || ''
    });

    // DAMAGE PATTERN ENGINE: Assess causation strength
    const causationAssessment = assessCausationStrength({
      evidence_items: evidence_items
    }, primaryDamageType);

    const totalCost = damage_items.reduce((sum, item) => sum + (item.total || 0), 0);

    const systemMessage = {
      role: 'system',
      content: `${getClaimGradeSystemMessage('report').content}

DAMAGE ASSESSMENT EXPERTISE:
You are an expert damage assessor with specialized knowledge of:
- Construction and restoration practices
- Damage pattern recognition
- Hidden damage identification
- Scope of work development
- Causation analysis
- Code compliance requirements

INTELLIGENCE DATA PROVIDED:
1. Damage Pattern Analysis: ${patternAnalysis.pattern_identified ? patternAnalysis.primary_pattern : 'Pattern not identified'}
2. Hidden Damage Risks: ${hiddenRisks.length} risks identified
3. Scope of Work: ${scopeOfWork.scope_available ? 'Generated' : 'Requires inspection'}
4. Causation Strength: ${causationAssessment.causation_strength}

CRITICAL INSTRUCTIONS:
1. Use the provided pattern analysis as your foundation
2. Emphasize hidden damage risks that require investigation
3. Provide specific scope of work with trade breakdowns
4. Assess causation strength and coverage implications
5. Identify code compliance requirements
6. Format as professional HTML with clear sections and cost breakdowns`
    };

    let userPrompt = `Provide expert damage assessment for this claim:

DAMAGE DESCRIPTION:
${sanitizeInput(damage_description)}

DAMAGE TYPES:
${damage_types.join(', ') || 'Not specified'}

DAMAGE ITEMS:
${JSON.stringify(damage_items, null, 2)}

TOTAL COST: $${totalCost.toLocaleString()}

PROPERTY DETAILS:
${JSON.stringify(property_details, null, 2)}

PATTERN ANALYSIS (Rule-Based):
${JSON.stringify(patternAnalysis, null, 2)}

HIDDEN DAMAGE RISKS (Expert Database):
${JSON.stringify(hiddenRisks, null, 2)}

SCOPE OF WORK (Generated):
${JSON.stringify(scopeOfWork, null, 2)}

CAUSATION ASSESSMENT (Rule-Based):
${JSON.stringify(causationAssessment, null, 2)}

Provide comprehensive damage assessment including:

1. DAMAGE SUMMARY
   - Primary damage pattern identified
   - Severity and extent
   - Affected areas and systems

2. COST BREAKDOWN
   - Demolition and removal
   - Structural repairs
   - Mechanical systems
   - Finishes and cosmetic
   - Hidden damage contingency

3. HIDDEN DAMAGE RISKS
   - Specific risks identified
   - Inspection methods required
   - Estimated additional costs

4. SCOPE OF WORK
   - Trade-by-trade breakdown
   - Timeline estimate
   - Code compliance requirements

5. CAUSATION ANALYSIS
   - Causation strength assessment
   - Supporting evidence present
   - Missing evidence needed
   - Coverage implications

6. RECOMMENDATIONS
   - Immediate actions
   - Additional inspections needed
   - Documentation priorities
   - Mitigation requirements

Format as professional HTML with clear headings, bullet points, and cost tables.`;

    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'report');

    const rawResponse = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2500
    });

    const processedResponse = postProcessResponse(rawResponse, 'report');
    const validation = validateProfessionalOutput(processedResponse, 'report');

    if (!validation.pass) {
      console.warn('[ai-damage-assessment] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-damage-assessment', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const result = {
      html: processedResponse,
      assessment: processedResponse,
      total_cost: totalCost,
      item_count: damage_items.length,
      pattern_identified: patternAnalysis.pattern_identified,
      primary_pattern: patternAnalysis.primary_pattern,
      hidden_risks_count: hiddenRisks.length,
      causation_strength: causationAssessment.causation_strength,
      scope_available: scopeOfWork.scope_available,
      intelligence_summary: {
        pattern: patternAnalysis.primary_pattern || 'Unknown',
        confidence: patternAnalysis.confidence || 'low',
        hidden_risks: hiddenRisks.length,
        causation: causationAssessment.causation_strength,
        scope_generated: scopeOfWork.scope_available
      }
    };

    await LOG_USAGE({
      function: 'ai-damage-assessment',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    await LOG_COST({
      function: 'ai-damage-assessment',
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
          intelligence_sources: ['damage-pattern-db']
        }, 
        error: null 
      })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-damage-assessment',
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
