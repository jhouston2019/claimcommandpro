/**
 * API Endpoint: /generate-supplement
 * Generates structured supplement letter based on discrepancies
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { sendSuccess, sendError, validateAuth, parseBody, getClientIP, getUserAgent, logAPIRequest } = require('./api/lib/api-utils');
const { buildSupplementLetterPrompt } = require('./lib/ai-prompts');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const startTime = Date.now();
  let userId = null;

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: ''
      };
    }

    // Validate authentication
    const authResult = await validateAuth(event.headers.authorization);
    if (!authResult.valid) {
      return sendError(authResult.error, 'AUTH-001', 401);
    }
    userId = authResult.user.id;

    // Parse and validate request body
    const body = parseBody(event.body);
    
    if (!body.claim_id) {
      return sendError('claim_id is required', 'VAL-001', 400);
    }

    // Validate claim ownership
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, user_id, claim_number, insured_name, policy_number, insurer, date_of_loss')
      .eq('id', body.claim_id)
      .eq('user_id', userId)
      .single();

    if (claimError || !claim) {
      return sendError('Claim not found or access denied', 'CLAIM-001', 404);
    }

    // Get adjuster info
    const adjusterName = claim.metadata?.adjuster_name || 'Claims Adjuster';

    // Get discrepancy data
    const { data: discrepancies, error: discError } = await supabase
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', body.claim_id)
      .eq('resolved', false);

    if (discError || !discrepancies || discrepancies.length === 0) {
      return sendError('No unresolved discrepancies found for this claim', 'DATA-001', 400);
    }

    // Get policy data
    const { data: policyData, error: policyError } = await supabase
      .from('claim_policy_coverage')
      .select('*')
      .eq('claim_id', body.claim_id)
      .single();

    if (policyError) {
      console.warn('Policy data not found, continuing without it');
    }

    // Prepare claim info
    const claimInfo = {
      claim_number: claim.claim_number,
      insured_name: claim.insured_name,
      policy_number: claim.policy_number,
      carrier: claim.insurer,
      loss_date: claim.date_of_loss,
      adjuster_name: adjusterName
    };

    // Prepare discrepancy summary
    const discrepancyData = {
      total_discrepancies: discrepancies.length,
      total_amount: discrepancies.reduce((sum, d) => sum + (parseFloat(d.difference_amount) || 0), 0),
      items: discrepancies.map(d => ({
        description: d.line_item_description,
        type: d.discrepancy_type,
        contractor_total: d.contractor_total,
        carrier_total: d.carrier_total,
        difference: d.difference_amount,
        category: d.category,
        notes: d.notes
      }))
    };

    // Call OpenAI for supplement letter generation
    let supplementResult;
    try {
      const prompt = buildSupplementLetterPrompt(discrepancyData, policyData, claimInfo);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance supplement letter writer with deep knowledge of policy provisions and claim documentation. Before drafting, analyze: 1) Which discrepancies have the strongest evidence? 2) What policy provisions support each item? 3) Are there code compliance requirements? 4) What is the total supplement amount justified? 5) What tone will be most effective? Return only valid JSON with no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0].message.content;
      supplementResult = JSON.parse(responseText);

      // Add professional header and footer to the letter
      const headerFooter = {
        header: `
CLAIM INFORMATION:
Claim #: ${claim.claim_number}
Policyholder: ${claim.insured_name}
Policy #: ${claim.policy_number}
Date of Loss: ${new Date(claim.date_of_loss).toLocaleDateString()}
Generated: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════════
`,
        footer: `
═══════════════════════════════════════════════════════════════
Generated by Claim Command Pro • Professional Insurance Claim Management
Not for redistribution • Confidential claim documentation
Document ID: ${claim.claim_number}-SUP-${Date.now()}
═══════════════════════════════════════════════════════════════
`
      };

      // Format the outputs
      if (supplementResult.letter_html) {
        supplementResult.letter_html = `<pre>${headerFooter.header}</pre>${supplementResult.letter_html}<pre>${headerFooter.footer}</pre>`;
      }
      if (supplementResult.letter_markdown) {
        supplementResult.letter_markdown = `${headerFooter.header}\n\n${supplementResult.letter_markdown}\n\n${headerFooter.footer}`;
      }

    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      return sendError('AI generation failed', 'AI-001', 500, {
        details: aiError.message
      });
    }

    // Store generated document
    const { data: document, error: docError } = await supabase
      .from('claim_generated_documents')
      .insert({
        claim_id: body.claim_id,
        user_id: userId,
        document_type: 'supplement_letter',
        title: `Supplement Request - ${claim.claim_number}`,
        content_html: supplementResult.letter_html,
        content_markdown: supplementResult.letter_markdown,
        template_version: '1.0',
        ai_model: 'gpt-4o',
        status: 'draft'
      })
      .select()
      .single();

    if (docError) {
      console.error('Failed to store document:', docError);
    }

    // Store output
    const { data: output, error: outputError } = await supabase
      .from('claim_outputs')
      .insert({
        claim_id: body.claim_id,
        user_id: userId,
        step_number: 10,
        output_type: 'supplement_letter',
        output_json: supplementResult,
        ai_model: 'gpt-4o',
        processing_time_ms: Date.now() - startTime
      })
      .select()
      .single();

    if (outputError) {
      console.error('Failed to store output:', outputError);
    }

    // Update financial summary with supplement amount
    const rawDelta = Number(supplementResult.total_supplement_amount);
    const delta = Number.isFinite(rawDelta) ? rawDelta : 0;

    const { data: finRow } = await supabase
      .from('claim_financial_summary')
      .select('supplement_count, supplement_total, supplement_pending')
      .eq('claim_id', body.claim_id)
      .maybeSingle();

    await supabase
      .from('claim_financial_summary')
      .update({
        supplement_count: (finRow?.supplement_count ?? 0) + 1,
        supplement_total: (finRow?.supplement_total ?? 0) + delta,
        supplement_pending: (finRow?.supplement_pending ?? 0) + delta
      })
      .eq('claim_id', body.claim_id);

    // Log request
    await logAPIRequest({
      userId,
      endpoint: '/generate-supplement',
      method: 'POST',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      ipAddress: getClientIP(event),
      userAgent: getUserAgent(event)
    });

    return sendSuccess({
      document_id: document?.id,
      output_id: output?.id,
      supplement: supplementResult,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Supplement generation error:', error);
    
    // Log error
    if (userId) {
      await logAPIRequest({
        userId,
        endpoint: '/generate-supplement',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        ipAddress: getClientIP(event),
        userAgent: getUserAgent(event),
        errorMessage: error.message
      });
    }

    return sendError('Supplement generation failed', 'SYS-001', 500, {
      error: error.message
    });
  }
};
