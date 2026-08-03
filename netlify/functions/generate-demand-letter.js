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
            content: `You are a senior insurance claim advocate with 20+ years drafting demand letters in property insurance disputes. You have expert knowledge of:

- ISO HO-3 policy forms and the replacement cost value provision
- Standard O&P entitlement on claims requiring general contractor coordination
- Xactimate pricing and how carrier estimates systematically suppress labor rates, omit O&P, and exclude code upgrade costs
- State prompt payment statutes and the consequences of non-compliance
- The appraisal clause as a binding dispute mechanism
- Bad faith claim handling standards under the NAIC Model Act

Your demand letters are effective because they are specific — they cite exact dollar amounts, exact policy provisions, and exact regulatory consequences. Generic language gets ignored. Specificity gets responses.

Output only the complete letter text. No JSON. No commentary.`
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
            content: `March 15, 2026
Sent via Certified Mail, Return Receipt Requested

[Insurance Company Name]
Claims Department
[Carrier Mailing Address]

RE: Formal Demand for Payment — Claim No. CLM-2024-08456 — Policy No. HO-884521 — Date of Loss: June 12, 2025

Dear [Adjuster Name]:

I demand payment of $18,550 within ten (10) business days of your receipt of this letter, representing the documented underpayment owed under Policy No. HO-884521 pursuant to the Coverage A Replacement Cost provision and your obligation to pay the full cost of repair using like kind and quality materials.

The independent contractor estimate documents total replacement cost of $36,750. Your carrier estimate totals $18,200, creating a documented gap of $18,550. Line-item comparison confirms systematic omissions and undervaluation across roofing, exterior, and code-related items.

Specific disputes requiring immediate correction include: (1) O&P omission of $3,675 — this loss requires general contractor coordination of four trades (roofing, siding, gutters, and interior drywall) per standard industry practice; (2) labor rate suppression of $2,840 — your estimate applies $42/hour where documented contractor rates of $58/hour apply; (3) missing line items totaling $4,450 — fascia board replacement ($2,400), ridge vent installation ($850), and underlayment upgrade ($1,200); (4) improper depreciation of $5,200 applied to non-depreciable labor and removal items on an RCV policy; (5) code upgrade omission of $2,385 despite Ordinance and Law endorsement on the policy.

Payment is required under Coverage A — Replacement Cost, the like kind and quality standard, your Ordinance and Law endorsement, and standard claim handling practice entitling the insured to overhead and profit where a general contractor coordinates multiple trades.

Provide written response within ten (10) business days of receipt. Failure to respond will result in: (1) formal complaint with the Texas Department of Insurance citing Texas Insurance Code prompt payment requirements; (2) invocation of the appraisal clause per policy Section [X]; and (3) referral to legal counsel for bad faith evaluation under applicable Texas standards.

Sincerely,

[Policyholder Name]
Policy No. HO-884521
Claim No. CLM-2024-08456
Phone: [Phone]
Email: [Email]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
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
        success: true,
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
