/**
 * Netlify Function: generate-demand-letter
 * Generates a formal demand letter with policy citations and specific amounts
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { buildDemandLetterPrompt } = require('./lib/ai-prompts');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: { message: 'Method not allowed' } })
    };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: { message: 'Unauthorized' } })
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { claim_id } = JSON.parse(event.body);

    if (!claim_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: { message: 'Missing claim_id' } })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // Fetch claim data
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claim_id)
      .single();

    if (claimError) throw claimError;

    // Fetch financial summary
    const { data: financial, error: finError } = await supabase
      .from('claim_financial_summary')
      .select('*')
      .eq('claim_id', claim_id)
      .single();

    if (finError) {
      console.warn('Financial summary not found, using claim data only');
    }

    // Fetch discrepancies
    const { data: discrepancies, error: discError } = await supabase
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', claim_id)
      .eq('resolved', false);

    // Fetch policy data
    const { data: policyData, error: policyError } = await supabase
      .from('claim_policy_coverage')
      .select('*')
      .eq('claim_id', claim_id)
      .single();

    const demandAmount = financial?.underpayment_estimate || 0;

    // Prepare claim info
    const claimInfo = {
      claim_number: claim.claim_number,
      insured_name: claim.insured_name,
      policy_number: claim.policy_number,
      carrier: claim.insurer_name,
      loss_date: claim.date_of_loss,
      adjuster_name: claim.adjuster_name || 'Claims Department',
      property_address: claim.property_address
    };

    // Prepare discrepancy data
    const discrepancyData = {
      total_discrepancies: discrepancies?.length || 0,
      total_amount: demandAmount,
      items: discrepancies?.map(d => ({
        description: d.line_item_description,
        type: d.discrepancy_type,
        contractor_total: d.contractor_total,
        carrier_total: d.carrier_total,
        difference: d.difference_amount,
        category: d.category
      })) || []
    };

    // Prepare financial data
    const financialData = {
      contractor_estimate: financial?.contractor_estimate_total || 0,
      carrier_estimate: financial?.carrier_estimate_total || 0,
      underpayment: demandAmount
    };

    // Build AI prompt using library function
    const prompt = buildDemandLetterPrompt(claimInfo, discrepancyData, policyData, financialData);

    // Call OpenAI for demand letter generation with few-shot examples
    let demandLetter;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance demand letter writer with 20+ years of experience in property claims and bad faith litigation. Generate professional, legally sound demand letters that maximize recovery while maintaining professional tone. Use specific policy provisions, cite documented evidence, and create urgency through deadlines and bad faith implications.'
          },
          {
            role: 'user',
            content: `Example demand letter request:
Claim: Wind/hail damage, $18,550 underpayment
Policy: HO3 with RCV coverage
Key issues: Depreciation applied to RCV policy, missing line items, undervalued labor`
          },
          {
            role: 'assistant',
            content: `[Date]

[Insurance Company Name]
Claims Department
[Address]

Re: Formal Demand for Payment – Claim No. [XXX] – Policy No. [XXX]

Dear Claims Department:

This letter constitutes formal demand for immediate payment of the full amount owed under Policy No. [XXX] for the wind and hail damage sustained on [date]. Your company has underpaid this claim by $18,550, in direct violation of the policy terms and Texas insurance regulations.

POLICY VIOLATIONS:

Your estimate improperly applies depreciation despite this being a Replacement Cost Value (RCV) policy. Section [X] of the policy explicitly provides for replacement cost coverage. The application of depreciation constitutes a material breach of the policy contract.

Additionally, your estimate omits the following covered items:
• Fascia board replacement: $2,400
• Ridge vent installation: $850
• Underlayment upgrade per code: $1,200

DOCUMENTED EVIDENCE:

We have obtained an independent contractor estimate from [Licensed Contractor], a licensed and insured contractor with 15+ years of experience. This estimate, prepared in accordance with industry standards and local building codes, documents the full scope of necessary repairs at $36,750.

Supporting documentation includes:
• Independent contractor estimate
• Photographic evidence of all damage
• Material cost verification
• Local building code requirements

DEMAND FOR PAYMENT:

We demand payment of $18,550 within 15 business days of receipt of this letter. This amount represents the difference between the actual replacement cost and your company's inadequate estimate.

Failure to issue payment within this timeframe will be considered evidence of bad faith under [State] Insurance Code Section [XXX], and we will pursue all available remedies, including statutory penalties, attorney fees, and consequential damages.

We expect your prompt attention to this matter.

Sincerely,
[Policyholder Name]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      demandLetter = completion.choices[0].message.content;
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      throw new Error('AI generation failed: ' + aiError.message);
    }

    // Add professional header and footer to the letter
    const formattedLetter = `
CLAIM INFORMATION:
Claim #: ${claim.claim_number}
Policyholder: ${claim.insured_name}
Policy #: ${claim.policy_number}
Date of Loss: ${new Date(claim.date_of_loss).toLocaleDateString()}
Generated: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════════

${demandLetter}

═══════════════════════════════════════════════════════════════
Generated by Claim Command Pro • Professional Insurance Claim Management
Not for redistribution • Confidential claim documentation
Document ID: ${claim.claim_number}-DL-${Date.now()}
═══════════════════════════════════════════════════════════════
`;

    // Store generated document
    const { data: document, error: docError } = await supabase
      .from('claim_generated_documents')
      .insert({
        claim_id: claim_id,
        document_type: 'demand_letter',
        title: `Demand Letter - ${claim.claim_number}`,
        content_text: formattedLetter,
        template_version: '2.0',
        ai_model: 'gpt-4o',
        status: 'draft'
      })
      .select()
      .single();

    if (docError) {
      console.error('Failed to store document:', docError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: {
          letter_content: formattedLetter,
          demand_amount: demandAmount,
          document_id: document?.id
        }
      })
    };

  } catch (error) {
    console.error('Demand letter generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Demand letter generation failed' }
      })
    };
  }
};
