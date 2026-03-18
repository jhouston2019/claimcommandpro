/**
 * Coverage Gap Detection Function
 * Analyzes gaps between policy coverage, insurer payments, and actual losses
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

exports.handler = async (event) => {
  const headers = {
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
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.split(' ')[1];
    const { 
      claim_number, 
      policy_number,
      coverage_limits, 
      insurer_payment, 
      actual_loss,
      policy_type,
      coverage_type,
      notes 
    } = JSON.parse(event.body);

    if (!claim_number || !coverage_limits || !insurer_payment || !actual_loss) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Fetch existing claim data for context
    const { data: claim } = await supabase
      .from('claims')
      .select('*, claim_policy_data(*), claim_financial_summary(*)')
      .eq('claim_number', claim_number)
      .eq('user_id', user.id)
      .single();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const totalInsurerPayment = Object.values(insurer_payment).reduce((a, b) => a + b, 0);
    const totalActualLoss = Object.values(actual_loss).reduce((a, b) => a + b, 0);
    const totalGap = totalActualLoss - totalInsurerPayment;

    const prompt = `Analyze this insurance coverage gap situation:

CLAIM INFO:
- Claim Number: ${claim_number}
- Policy Number: ${policy_number || 'N/A'}
- Policy Type: ${policy_type}
- Coverage Type: ${coverage_type}

COVERAGE LIMITS:
- Dwelling: $${coverage_limits.dwelling.toLocaleString()}
- Other Structures: $${coverage_limits.otherStructures.toLocaleString()}
- Personal Property: $${coverage_limits.personalProperty.toLocaleString()}
- Loss of Use/ALE: $${coverage_limits.lossOfUse.toLocaleString()}
- Deductible: $${coverage_limits.deductible.toLocaleString()}

INSURER'S PAYMENT:
- Dwelling: $${insurer_payment.dwelling.toLocaleString()}
- Other Structures: $${insurer_payment.otherStructures.toLocaleString()}
- Personal Property: $${insurer_payment.personalProperty.toLocaleString()}
- Loss of Use/ALE: $${insurer_payment.lossOfUse.toLocaleString()}
- TOTAL: $${totalInsurerPayment.toLocaleString()}

DOCUMENTED ACTUAL LOSS:
- Dwelling: $${actual_loss.dwelling.toLocaleString()}
- Other Structures: $${actual_loss.otherStructures.toLocaleString()}
- Personal Property: $${actual_loss.personalProperty.toLocaleString()}
- Loss of Use/ALE: $${actual_loss.lossOfUse.toLocaleString()}
- TOTAL: $${totalActualLoss.toLocaleString()}

TOTAL GAP: $${totalGap.toLocaleString()}

${notes ? `ADDITIONAL CONTEXT:\n${notes}\n` : ''}

${claim ? `EXISTING CLAIM DATA:\n${JSON.stringify(claim, null, 2)}\n` : ''}

Provide a comprehensive coverage gap analysis in JSON format:
{
  "total_gap": number,
  "gaps_by_category": [
    {
      "category": "Dwelling|OtherStructures|PersonalProperty|LossOfUse",
      "limit": number,
      "insurer_payment": number,
      "actual_loss": number,
      "gap": number,
      "explanation": "detailed explanation of why this gap exists",
      "policy_provision": "relevant policy language if applicable"
    }
  ],
  "policy_analysis": {
    "coverage_adequacy": "whether policy limits are sufficient for actual loss",
    "deductible_impact": "how deductible affects recovery potential",
    "rcv_acv_implications": "RCV vs ACV impact on this claim",
    "exclusions_concerns": "any exclusions that may limit recovery"
  },
  "recommendations": [
    "specific actions to close gaps"
  ],
  "next_steps": [
    "immediate next steps for policyholder"
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert insurance coverage analyst with deep knowledge of policy provisions, coverage types, and claim valuation. Before identifying gaps, analyze: 1) Are coverage limits sufficient for the loss? 2) Is the payment within policy limits? 3) Are there sublimits that apply? 4) Is depreciation properly applied given coverage type? 5) What policy provisions support full payment? Identify gaps between policy coverage, insurer payments, and actual losses. Return only valid JSON with no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const gapAnalysis = JSON.parse(completion.choices[0].message.content);

    // Add metadata for display
    gapAnalysis.document_header = {
      brand: 'Claim Command Pro',
      claim_number: claim_number,
      generated_date: new Date().toISOString(),
      document_type: 'Coverage Gap Analysis'
    };

    // Store in Supabase
    if (claim) {
      await supabase
        .from('claim_outputs')
        .insert({
          claim_id: claim.id,
          output_type: 'coverage_gap_analysis',
          step_number: 10,
          output_json: gapAnalysis,
          created_at: new Date().toISOString()
        });

      // Update financial summary
      await supabase
        .from('claim_financial_summary')
        .upsert({
          claim_id: claim.id,
          coverage_gap: totalGap,
          insurer_total_payment: totalInsurerPayment,
          documented_loss_total: totalActualLoss,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'claim_id'
        });
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(gapAnalysis)
    };

  } catch (error) {
    console.error('Coverage gap detection error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { message: error.message || 'Coverage gap detection failed' }
      })
    };
  }
};
