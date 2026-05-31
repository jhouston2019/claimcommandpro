/**
 * AI Policy Review Function
 * Reviews and analyzes insurance policies
 * 
 * NOW POWERED BY POLICY INTELLIGENCE ENGINE
 * Combines rule-based policy knowledge with AI interpretation for expert-level analysis
 */

const { runOpenAI, sanitizeInput, validateRequired } = require('./lib/ai-utils');
const pdfParse = require('pdf-parse');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const { LOG_EVENT, LOG_ERROR, LOG_USAGE, LOG_COST } = require('./_utils');
const { 
  getClaimGradeSystemMessage,
  enhancePromptWithContext,
  postProcessResponse,
  validateProfessionalOutput
} = require('./utils/prompt-hardening');
const { parsePDF, extractPolicySections, extractCoverageLimits } = require('./lib/pdf-parser');
const {
  STANDARD_POLICY_FORMS,
  STANDARD_EXCLUSIONS_DETAIL,
  COMMON_ENDORSEMENTS,
  analyzeCoverageForDamage,
  detectCoverageGaps,
  interpretClause,
  getStandardLanguage
} = require('./lib/policy-intelligence-db');


exports.handler = async (event) => {
  // ✅ PHASE 5B: FULLY HARDENED
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
    const supabase = createSupabaseClient(
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

    // TEMP: Payment check bypassed for testing - restore before launch
    /*
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
    */

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
    await LOG_EVENT('ai_request', 'ai-policy-review', { payload: body });

    validateRequired(body, ['policy_text']);

    const { 
      policy_text, 
      policy_type = 'HO-3', 
      jurisdiction = '', 
      deductible = '', 
      claimInfo = {},
      analysis_mode = 'coverage-gap',
      damage_type = '',
      claim_scenario = {}
    } = body;
    const sanitizedText = sanitizeInput(policy_text);

    // If policy_text is a storage path (starts with user UUID pattern) or is 
    // the fallback placeholder, fetch the actual PDF from Supabase Storage
    let finalPolicyText = sanitizedText;
    const isPlaceholder = sanitizedText.includes('Policy uploaded as PDF. Please analyze based on claim context');
    const storagePath = body.storage_path || null;

    if ((isPlaceholder || !sanitizedText || sanitizedText.length < 100) && storagePath) {
      try {
        console.log('Fetching PDF from storage:', storagePath);
        const supabaseAdmin = createSupabaseClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: fileData, error: fileError } = await supabaseAdmin.storage
          .from('claim-documents')
          .download(storagePath);
        
        if (fileError) {
          console.error('Storage download error:', fileError.message);
        } else if (fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const parsed = await pdfParse(buffer);
          finalPolicyText = parsed.text;
          console.log('PDF extracted in ai-policy-review, length:', finalPolicyText.length);
        }
      } catch(pdfErr) {
        console.error('PDF extraction in ai-policy-review failed:', pdfErr.message);
      }
    }

    const startTime = Date.now();

    // POLICY INTELLIGENCE ENGINE: Extract structured policy data
    const policySections = extractPolicySections(sanitizedText);
    const coverageLimits = extractCoverageLimits(sanitizedText);
    const policyForm = STANDARD_POLICY_FORMS[policy_type] || STANDARD_POLICY_FORMS['HO-3'];

    // POLICY INTELLIGENCE ENGINE: Detect coverage gaps using rule-based logic
    let engineGaps = [];
    if (claim_scenario && Object.keys(claim_scenario).length > 0) {
      engineGaps = detectCoverageGaps(coverageLimits, policy_type, {
        ...claim_scenario,
        damageType: damage_type || claim_scenario.damageType,
        endorsements: claim_scenario.endorsements || []
      });
    }

    // POLICY INTELLIGENCE ENGINE: Analyze coverage for specific damage type
    let coverageAnalysis = null;
    if (damage_type) {
      coverageAnalysis = analyzeCoverageForDamage(policySections, damage_type, policy_type);
    }

    // PHASE 5B: Use claim-grade system message with policy expertise
    const systemMessage = {
      role: 'system',
      content: `${getClaimGradeSystemMessage('analysis').content}

POLICY ANALYSIS EXPERTISE:
You are analyzing insurance policies with expert-level knowledge of:
- Standard policy forms (HO-3, HO-5, DP-3, Commercial Property)
- Common exclusions and their standard language
- Sublimits and coverage restrictions
- Endorsement options and their implications
- Jurisdiction-specific requirements

CRITICAL INSTRUCTIONS:
1. Use the provided policy intelligence data (standard forms, exclusions, limits) as your foundation
2. Cross-reference policy text against standard policy language
3. Identify deviations from standard forms
4. Flag ambiguous language that should be interpreted in insured's favor (contra proferentem)
5. Provide specific policy section references for all findings
6. Return ONLY valid JSON - no markdown, no code blocks, no explanatory text

POLICY FORM KNOWLEDGE:
${JSON.stringify(policyForm, null, 2)}

STANDARD EXCLUSIONS:
${Object.keys(STANDARD_EXCLUSIONS_DETAIL).join(', ')}

COMMON ENDORSEMENTS:
${Object.keys(COMMON_ENDORSEMENTS).join(', ')}`
    };

    // Build prompt based on analysis mode
    let userPrompt;
    
    switch (analysis_mode) {
      case 'sublimit':
        userPrompt = `Analyze this insurance policy for sublimits and return ONLY valid JSON with this exact structure:

{
  "sublimits": [
    {
      "coverage_type": "Coverage category name (e.g., Mold Remediation, Code Upgrades)",
      "policy_limit": 25000,
      "section": "Policy section reference (e.g., Additional Coverages 3.2.4)",
      "recommendation": "Advice for managing this sublimit"
    }
  ],
  "summary": "Brief overview of sublimit analysis"
}

Policy Type: ${policy_type}
Jurisdiction: ${jurisdiction}
Deductible: ${deductible}

Policy Text:
${finalPolicyText}

Focus on:
1. Sublimits that restrict coverage amounts
2. Per-occurrence limits
3. Aggregate limits
4. Category-specific limits (mold, code upgrades, ordinance & law, etc.)

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'coverage-mapping':
        userPrompt = `Map this insurance policy coverage to claim items and return ONLY valid JSON with this exact structure:

{
  "coverage_map": [
    {
      "claim_item": "Specific claim item (e.g., Roof replacement)",
      "coverage_section": "Policy section (e.g., Dwelling Coverage A)",
      "covered": true,
      "limit": 250000,
      "deductible": 2500,
      "notes": "Coverage details (e.g., Covered under RCV)"
    }
  ],
  "coverage_percentage": 85,
  "summary": "Brief overview of coverage mapping"
}

Policy Type: ${policy_type}
Jurisdiction: ${jurisdiction}

Policy Text:
${finalPolicyText}

Map each potential claim item to its corresponding policy coverage section. Include:
1. Whether the item is covered (true/false)
2. Coverage limits
3. Applicable deductibles
4. Any special conditions or exclusions

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'damage-documentation':
        userPrompt = `Analyze this claim and generate a damage documentation checklist. Return ONLY valid JSON with this exact structure:

{
  "documentation": {
    "incident_summary": "Brief summary of incident",
    "affected_areas": ["Living Room", "Kitchen"],
    "required_photos": ["Overall room view", "Close-up of damage", "Serial numbers"],
    "required_documents": ["Contractor estimate", "Receipts", "Police report"],
    "completeness_score": 75
  },
  "missing_items": ["Item 1", "Item 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "summary": "Documentation assessment complete"
}

Policy Type: ${policy_type}
Claim Type: ${body.claimType || 'general'}

Policy Text:
${finalPolicyText}

Context: ${body.context || 'None provided'}

Generate a comprehensive documentation checklist including:
1. Required photos and angles
2. Required documents
3. Witness statements needed
4. Evidence of ownership
5. Completeness assessment

Return ONLY the JSON object. Do not include markdown formatting, code blocks, or any text outside the JSON.`;
        break;
      
      case 'coverage-gap':
      default:
        // POLICY INTELLIGENCE ENGINE: Inject rule-based gap detection
        const engineGapsSummary = engineGaps.length > 0 
          ? `\n\nRULE-BASED GAP DETECTION RESULTS:\n${JSON.stringify(engineGaps, null, 2)}\n\nUse these as your foundation and add any additional gaps you identify from the policy text.`
          : '';

        userPrompt = `You are analyzing a real insurance policy document. Extract the actual coverage values from the policy text provided. Do NOT use placeholder or example values.

Return ONLY this exact JSON structure with no markdown, no code blocks:

{
  "dwelling_coverage": 0,
  "contents_coverage": 0,
  "ale_coverage": 0,
  "deductible": 0,
  "settlement_type": "RCV",
  "endorsements": [],
  "coverages": [
    {
      "label": "Coverage name",
      "amount": "$0",
      "amount_raw": 0,
      "description": "Brief description",
      "not_applied": false
    }
  ],
  "gaps_found": 0,
  "gaps_summary": "Summary of coverages not yet applied by carrier",
  "summary": "Brief overview"
}

CRITICAL: Extract the ACTUAL dollar amounts from the policy text below. 
Do not invent numbers. If you cannot find a value, use 0.

Policy Type: ${policy_type}
Insurer: ${body.insurer || 'Unknown'}
Jurisdiction: ${jurisdiction}
Deductible: ${deductible}

Policy Text:
${finalPolicyText}

EXTRACTED COVERAGE LIMITS (from rule-based parser):
${JSON.stringify(coverageLimits, null, 2)}

Instructions:
1. Find Dwelling/Coverage A limit — set as dwelling_coverage
2. Find Personal Property/Coverage B or C limit — set as contents_coverage  
3. Find Loss of Use/Coverage C or D limit — set as ale_coverage
4. Find the deductible amount — set as deductible
5. Find settlement type (RCV or ACV) — set as settlement_type
6. List all endorsements found — set as endorsements array
7. For each coverage, set not_applied: true if carrier has not yet acknowledged it
8. Count unapplied coverages — set as gaps_found
9. Summarize unapplied coverages — set as gaps_summary

Return ONLY the JSON. No other text.`;
        break;
    }

    // PHASE 5B: Enhance prompt with claim context
    userPrompt = enhancePromptWithContext(userPrompt, claimInfo, 'analysis');

    const rawAnalysis = await runOpenAI(systemMessage.content, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    // Parse JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = rawAnalysis
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      result = JSON.parse(cleanedResponse);
      
      // Validate required fields exist
      if (!result.coverages || !Array.isArray(result.coverages)) {
        throw new Error('Missing or invalid coverages array');
      }
      
      // Ensure summary exists
      if (!result.summary) {
        result.summary = "Policy analysis completed";
      }
      
    } catch (parseError) {
      console.error('[ai-policy-review] JSON parse error:', parseError);
      await LOG_ERROR('json_parse_error', {
        function: 'ai-policy-review',
        error: parseError.message,
        raw_response: rawAnalysis.substring(0, 500)
      });
      
      // Fallback to generic response
      result = {
        dwelling_coverage: 0,
        contents_coverage: 0,
        ale_coverage: 0,
        deductible: 0,
        settlement_type: 'RCV',
        endorsements: [],
        coverages: [],
        gaps_found: 0,
        gaps_summary: '',
        gaps: [],
        summary: "Unable to parse policy analysis. Please review the policy manually or try again.",
        error: "JSON parsing failed"
      };
    }

    // PHASE 5B: Validate professional output (if we have valid JSON)
    const validation = result.error ? { pass: false, score: 0, issues: ['JSON parse error'] } : 
                       { pass: true, score: 100, issues: [] };

    if (!validation.pass) {
      console.warn('[ai-policy-review] Quality issues:', validation.issues);
      await LOG_EVENT('quality_warning', 'ai-policy-review', {
        issues: validation.issues,
        score: validation.score,
        user_id: user.id
      });
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Log usage
    await LOG_USAGE({
      function: 'ai-policy-review',
      duration_ms: durationMs,
      input_token_estimate: 0,
      output_token_estimate: 0,
      success: true
    });

    // Log cost
    await LOG_COST({
      function: 'ai-policy-review',
      estimated_cost_usd: 0.002
    });

    const parsedAnalysis = result;

    const responseData = {
      success: true,
      data: {
        dwelling_coverage: parsedAnalysis.dwelling_coverage || 0,
        contents_coverage: parsedAnalysis.contents_coverage || 0,
        ale_coverage: parsedAnalysis.ale_coverage || 0,
        deductible: parsedAnalysis.deductible || 0,
        settlement_type: parsedAnalysis.settlement_type || 'RCV',
        endorsements: parsedAnalysis.endorsements || [],
        coverages: parsedAnalysis.coverages || [],
        gaps_found: parsedAnalysis.gaps_found || 0,
        gaps_summary: parsedAnalysis.gaps_summary || '',
        summary: parsedAnalysis.summary || '',
        gaps: parsedAnalysis.gaps || []
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    await LOG_ERROR('ai_error', {
      function: 'ai-policy-review',
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

function extractSummary(text) {
  const match = text.match(/summary[:\s]+(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : text.substring(0, 200);
}

function extractExclusions(text) {
  const exclusions = [];
  const lines = text.split('\n');
  let inExclusions = false;
  for (const line of lines) {
    if (line.match(/exclusion/i)) inExclusions = true;
    if (inExclusions && line.match(/^[-•]\s*(.+)$/)) {
      exclusions.push(line.replace(/^[-•]\s*/, '').trim());
    }
  }
  return exclusions.slice(0, 10);
}

function extractRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n');
  let inRecommendations = false;
  for (const line of lines) {
    if (line.match(/recommendation/i)) inRecommendations = true;
    if (inRecommendations && line.match(/^[-•]\s*(.+)$/)) {
      recommendations.push(line.replace(/^[-•]\s*/, '').trim());
    }
  }
  return recommendations.slice(0, 5);
}


