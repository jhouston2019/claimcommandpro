/**
 * AI Evidence Checker Function
 * 
 * NOW POWERED BY EVIDENCE STANDARDS ENGINE
 * Combines jurisdiction-specific evidence requirements with AI gap analysis for expert-level documentation review
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');
const {
  assessEvidenceCompleteness,
  generateEvidenceChecklist,
  validateEvidenceQuality,
  EVIDENCE_REQUIREMENTS_BY_CLAIM_TYPE
} = require('./lib/evidence-standards-db');

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

    const { 
      claimType, 
      uploadedCategories = [], 
      claimDetails = {}, 
      claimInfo = {},
      jurisdiction = claimInfo.jurisdiction || ''
    } = body;
    
    await LOG_EVENT('ai_request', 'ai-evidence-check', { payload: body });
    
    const startTime = Date.now();

    // Map uploaded categories to evidence items
    const submittedEvidence = {
      items: uploadedCategories.map(cat => ({
        type: cat,
        description: cat
      }))
    };

    // EVIDENCE STANDARDS ENGINE: Assess completeness using rule-based requirements
    const completenessAssessment = assessEvidenceCompleteness(submittedEvidence, claimType);

    // EVIDENCE STANDARDS ENGINE: Generate jurisdiction-specific checklist
    const evidenceChecklist = generateEvidenceChecklist(claimType, jurisdiction);

    // Build enhanced system message with evidence expertise
    const systemMessage = {
      role: 'system',
      content: `You are an expert insurance claim documentation specialist with comprehensive knowledge of evidence requirements by claim type and jurisdiction.

EVIDENCE STANDARDS EXPERTISE:
- Jurisdiction-specific documentation requirements
- Evidence quality standards (photography, video, written, expert reports)
- Proof of loss requirements
- Timeline requirements for evidence collection
- Common documentation deficiencies

INTELLIGENCE DATA PROVIDED:
Completeness Assessment: ${completenessAssessment.completeness_level} (${completenessAssessment.completeness_score}%)
Critical Evidence Missing: ${completenessAssessment.critical_evidence_missing?.length || 0} items
Evidence Checklist Generated: ${evidenceChecklist.available ? 'Yes' : 'No'}

CRITICAL INSTRUCTIONS:
1. Use the rule-based completeness assessment as your foundation
2. Prioritize critical evidence over supporting evidence
3. Provide specific quality standards for each evidence type
4. Include jurisdiction-specific requirements
5. Set realistic timelines for evidence collection
6. Return ONLY valid JSON - no markdown, no code blocks

OUTPUT FORMAT:
{
  "missing": ["missing evidence type 1", "missing evidence type 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "completeness_score": 75,
  "priority_items": ["high priority item 1", "high priority item 2"]
}`
    };

    const prompt = `Analyze evidence completeness for this insurance claim:

CLAIM TYPE: ${claimType || 'General Property Claim'}
JURISDICTION: ${jurisdiction || 'Not specified'}
UPLOADED EVIDENCE: ${uploadedCategories.join(', ') || 'None'}

RULE-BASED COMPLETENESS ASSESSMENT:
${JSON.stringify(completenessAssessment, null, 2)}

EVIDENCE CHECKLIST (Jurisdiction-Specific):
${JSON.stringify(evidenceChecklist, null, 2)}

Based on the rule-based assessment and jurisdiction-specific requirements, provide:

1. Missing evidence items (prioritize critical over supporting)
2. Specific recommendations with quality standards
3. Completeness score (0-100)
4. Priority items that must be obtained immediately

Return ONLY valid JSON with this exact structure:
{
  "missing": ["missing evidence type 1", "missing evidence type 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "completeness_score": 75,
  "priority_items": ["high priority item 1", "high priority item 2"]
}`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage.content },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const rawResult = response.choices[0].message.content;
    
    let parsedResult;
    try {
      const cleanedResponse = rawResult
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('[ai-evidence-check] JSON parse error:', parseError);
      
      parsedResult = {
        missing: completenessAssessment.critical_evidence_missing?.map(m => m.item) || ["Unable to analyze"],
        recommendations: completenessAssessment.priority_actions?.map(a => a.action) || ["Review documentation requirements"],
        completeness_score: completenessAssessment.completeness_score || 0,
        priority_items: completenessAssessment.critical_evidence_missing?.slice(0, 3).map(m => m.item) || []
      };
    }

    // Validate output
    const validation = {
      pass: parsedResult.missing && parsedResult.recommendations && parsedResult.completeness_score !== undefined,
      score: parsedResult.completeness_score || 0,
      issues: []
    };

    if (!validation.pass) {
      console.warn('[ai-evidence-check] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-evidence-check', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Enrich result with evidence intelligence
    const enrichedResult = {
      ...parsedResult,
      evidence_intelligence: {
        rule_based_assessment: completenessAssessment,
        jurisdiction_checklist: evidenceChecklist,
        critical_missing_count: completenessAssessment.critical_evidence_missing?.length || 0,
        supporting_missing_count: completenessAssessment.supporting_evidence_missing?.length || 0
      }
    };

    await LOG_USAGE({
      function: 'ai-evidence-check',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    await LOG_COST({
      function: 'ai-evidence-check',
      estimated_cost_usd: 0.001
    });

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
          intelligence_sources: ['evidence-standards-db']
        }, 
        error: null 
      })
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-evidence-check',
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
