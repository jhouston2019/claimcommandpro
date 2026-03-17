/**
 * AI Situational Advisory Function
 * Provides advisory responses for claim situations
 * 
 * NOW POWERED BY DAMAGE PATTERN ENGINE + LEGAL PRECEDENT ENGINE + EVIDENCE STANDARDS ENGINE
 * Combines rule-based pattern recognition with AI strategic guidance for expert-level advisory
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
  analyzeDamagePattern,
  identifyHiddenDamageRisks,
  assessCausationStrength
} = require('./lib/damage-pattern-db');
const {
  getLegalStandards
} = require('./lib/legal-precedent-db');
const {
  generateEvidenceChecklist
} = require('./lib/evidence-standards-db');


exports.handler = async (event) => {
  // ✅ PHASE 5B: FULLY HARDENED

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    
    // PHASE 5B: Post-process and validate
    const processedResponse = postProcessResponse(rawResponse, 'analysis');
    const validation = validateProfessionalOutput(processedResponse, 'analysis');

    if (!validation.pass) {
      console.warn('[ai-situational-advisory] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-situational-advisory', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

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
    await LOG_EVENT('ai_request', 'ai-situational-advisory', { payload: body });
    
    validateRequired(body, ['situation_description']);

    const { 
      situation_description, 
      claim_type = 'general', 
      claimInfo = {},
      analysis_mode = 'situational-advisory',
      damage_types = [],
      jurisdiction = claimInfo.jurisdiction || ''
    } = body;
    const sanitizedSituation = sanitizeInput(situation_description);

    const startTime = Date.now();

    // DAMAGE PATTERN ENGINE: Analyze if damage-related
    let patternAnalysis = null;
    if (damage_types.length > 0 || analysis_mode === 'damage-labeling') {
      patternAnalysis = analyzeDamagePattern({
        description: situation_description,
        damage_types: damage_types
      });
    }

    // LEGAL PRECEDENT ENGINE: Get jurisdiction standards
    const legalStandards = jurisdiction ? getLegalStandards(jurisdiction) : null;

    // EVIDENCE STANDARDS ENGINE: Generate checklist if needed
    let evidenceChecklist = null;
    if (analysis_mode === 'room-by-room-guide' || claim_type !== 'general') {
      evidenceChecklist = generateEvidenceChecklist(claim_type, jurisdiction);
    }

    const systemMessage = {
      role: 'system',
      content: `${getClaimGradeSystemMessage('analysis').content}

SITUATIONAL ADVISORY EXPERTISE:
You are an expert insurance claim advisor with comprehensive knowledge of:
- Damage assessment and pattern recognition
- Legal standards and jurisdiction-specific requirements
- Evidence documentation standards
- Strategic claim handling
- Coverage analysis

INTELLIGENCE DATA PROVIDED:
${patternAnalysis ? `Damage Pattern: ${patternAnalysis.primary_pattern || 'Not identified'}` : 'No damage pattern analysis'}
${legalStandards ? `Legal Standards: ${jurisdiction} jurisdiction loaded` : 'No jurisdiction-specific standards'}
${evidenceChecklist ? `Evidence Checklist: Generated for ${claim_type}` : 'No evidence checklist'}

CRITICAL INSTRUCTIONS:
1. Use provided intelligence data as foundation for your analysis
2. Provide specific, actionable guidance
3. Reference relevant patterns, legal standards, or evidence requirements
4. Be precise with recommendations and next steps
5. Format responses appropriately for the analysis mode`
    };

    let userPrompt;
    
    switch (analysis_mode) {
      case 'damage-labeling':
        userPrompt = `Generate professional labels and descriptions for damage documentation. Return ONLY valid JSON:

{
  "labels": [
    {
      "label": "Specific damage description",
      "severity": "HIGH|MEDIUM|LOW",
      "documentation_priority": "Required|Recommended|Optional",
      "suggested_description": "Detailed description for insurance documentation"
    }
  ],
  "summary": "Labeling suggestions generated"
}

Room/Location: ${body.roomLocation || 'Not specified'}
Damage Type: ${claim_type}
Context: ${sanitizedSituation}

Generate 3-5 professional labels for this damage photo including:
1. Clear, specific damage description
2. Severity rating
3. Documentation priority
4. Detailed description for insurance purposes

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'expert-opinion':
        userPrompt = `Provide expert analysis for this complex insurance claim issue. Return ONLY valid JSON:

{
  "opinion": "Detailed expert analysis text",
  "precedents": ["Relevant case or precedent 1", "Relevant case or precedent 2"],
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2"],
  "confidence_level": "HIGH|MEDIUM|LOW",
  "summary": "Expert opinion provided"
}

Issue Type: ${body.issueType || 'General'}
Claim Type: ${claim_type}
Issue Description: ${sanitizedSituation}
Context: ${body.context || 'None'}

Provide expert-level analysis including:
1. Detailed opinion on the issue
2. Relevant precedents or case law
3. Strategic recommendations
4. Confidence level in the analysis

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'room-by-room-guide':
        userPrompt = `Generate a room-by-room documentation guide. Return ONLY valid JSON:

{
  "prompts": [
    {
      "category": "Category name (e.g., Electronics)",
      "items_to_document": ["Item 1", "Item 2", "Item 3"],
      "photos_needed": ["Photo type 1", "Photo type 2"],
      "documentation_tips": ["Tip 1", "Tip 2"]
    }
  ],
  "checklist_items": 15,
  "summary": "Room documentation guide generated"
}

Room Type: ${body.roomType || 'General'}
Room Size: ${body.roomSize || 'Not specified'} sq ft
Damage Type: ${claim_type}
Description: ${sanitizedSituation}

Generate a comprehensive documentation guide for this room including:
1. Categories of items typically found in this room
2. Specific items to document
3. Types of photos needed
4. Documentation tips (serial numbers, receipts, etc.)

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'situational-advisory':
      default:
        const intelligenceContext = [];
        
        if (patternAnalysis?.pattern_identified) {
          intelligenceContext.push(`DAMAGE PATTERN ANALYSIS:\n${JSON.stringify(patternAnalysis, null, 2)}`);
        }
        
        if (legalStandards) {
          intelligenceContext.push(`LEGAL STANDARDS (${jurisdiction}):\n${JSON.stringify({
            deadlines: legalStandards.claim_handling_deadlines,
            bad_faith_triggers: legalStandards.bad_faith_triggers,
            key_statutes: legalStandards.key_statutes.map(s => s.code)
          }, null, 2)}`);
        }
        
        if (evidenceChecklist?.available) {
          intelligenceContext.push(`EVIDENCE REQUIREMENTS:\n${JSON.stringify({
            critical_items: evidenceChecklist.critical_items.length,
            documentation_deadline: evidenceChecklist.documentation_deadline
          }, null, 2)}`);
        }

        userPrompt = `Provide expert advisory response for this claim situation:

CLAIM TYPE: ${claim_type}
SITUATION: ${sanitizedSituation}
JURISDICTION: ${jurisdiction || 'Not specified'}

${intelligenceContext.join('\n\n')}

Provide:
1. Expert advisory response addressing the situation
2. Three specific, actionable recommendations
3. Three concrete next steps with timelines

Return JSON:
{
  "response": "Advisory response text",
  "recommendations": ["Rec 1", "Rec 2", "Rec 3"],
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}`;
        break;
    }

    // PHASE 5B: Enhance prompt with claim context
    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'analysis');

    const processedResponse = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1500
    });

    let result;
    try {
      // Clean and parse JSON response
      const cleanedResponse = processedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error('JSON parse error:', e);
      result = {
        response: processedResponse,
        recommendations: extractList(processedResponse, 'recommendation'),
        next_steps: extractList(processedResponse, 'next step')
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Enrich result with intelligence data
    const enrichedResult = {
      ...result,
      intelligence_data: {
        pattern_analysis: patternAnalysis,
        legal_standards: legalStandards ? {
          jurisdiction: jurisdiction,
          deadlines: legalStandards.claim_handling_deadlines,
          bad_faith_triggers: legalStandards.bad_faith_triggers
        } : null,
        evidence_checklist: evidenceChecklist
      }
    };

    // Log usage
    await LOG_USAGE({
      function: 'ai-situational-advisory',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-situational-advisory',
      estimated_cost_usd: 0.002
    });

    // Validate output
    const validation = validateProfessionalOutput(JSON.stringify(result), 'analysis');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: enrichedResult, 
        metadata: { 
          quality_score: validation.score, 
          validation_passed: validation.pass,
          engine_powered: true,
          intelligence_sources: ['damage-pattern-db', 'legal-precedent-db', 'evidence-standards-db'].filter(s => 
            (s === 'damage-pattern-db' && patternAnalysis) ||
            (s === 'legal-precedent-db' && legalStandards) ||
            (s === 'evidence-standards-db' && evidenceChecklist)
          )
        }, 
        error: null 
      })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-situational-advisory',
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

function extractList(text, keyword) {
  const items = [];
  const lines = text.split('\n');
  let inSection = false;
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword)) inSection = true;
    if (inSection && line.match(/^\d+[\.\)]\s*(.+)$/)) {
      items.push(line.replace(/^\d+[\.\)]\s*/, '').trim());
    }
  }
  return items.slice(0, 3);
}


