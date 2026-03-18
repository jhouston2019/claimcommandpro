/**
 * Netlify Function: evaluate-escalation-status
 * Evaluates claim status and recommends escalation level
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

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

    // Fetch communication history
    const { data: communications, error: commError } = await supabase
      .from('claim_communications')
      .select('*')
      .eq('claim_id', claim_id)
      .order('created_at', { ascending: false });

    // Fetch policy data
    const { data: policyData, error: policyError } = await supabase
      .from('claim_policy_coverage')
      .select('*')
      .eq('claim_id', claim_id)
      .single();

    // Fetch discrepancies
    const { data: discrepancies, error: discError } = await supabase
      .from('claim_estimate_discrepancies')
      .select('*')
      .eq('claim_id', claim_id);

    // Calculate escalation factors
    const dateOfLoss = new Date(claim.date_of_loss);
    const now = new Date();
    const daysSinceLoss = Math.floor((now - dateOfLoss) / (1000 * 60 * 60 * 24));
    
    const lastCommunication = communications?.[0];
    const daysSinceLastResponse = lastCommunication 
      ? Math.floor((now - new Date(lastCommunication.created_at)) / (1000 * 60 * 60 * 24))
      : null;

    const underpaymentAmount = financial?.underpayment_estimate || 0;
    const documentedLoss = financial?.contractor_estimate_total || 0;
    const carrierOffer = financial?.carrier_estimate_total || 0;

    // Build comprehensive context for AI analysis
    const claimContext = {
      claim_number: claim.claim_number,
      insurer: claim.insurer_name,
      date_of_loss: claim.date_of_loss,
      days_since_loss: daysSinceLoss,
      days_since_last_response: daysSinceLastResponse,
      documented_loss: documentedLoss,
      carrier_offer: carrierOffer,
      underpayment: underpaymentAmount,
      recovery_percentage: carrierOffer > 0 ? ((carrierOffer / documentedLoss) * 100).toFixed(1) : 0,
      num_discrepancies: discrepancies?.length || 0,
      policy_type: policyData?.settlement_type || 'Unknown',
      state: claim.property_state || 'Unknown',
      communication_count: communications?.length || 0
    };

    // Build evidence summary
    let evidenceSummary = 'Limited documentation';
    if (discrepancies && discrepancies.length > 0) {
      evidenceSummary = `${discrepancies.length} documented discrepancies with line-item details`;
    }
    if (policyData) {
      evidenceSummary += ', full policy analysis available';
    }

    // Build negotiation history
    let negotiationHistory = 'No documented negotiation history';
    if (communications && communications.length > 0) {
      negotiationHistory = communications.slice(0, 5).map(c => 
        `${c.communication_date}: ${c.communication_type} - ${c.summary || 'No summary'}`
      ).join('\n');
    }

    // Call OpenAI for comprehensive escalation analysis
    const prompt = `You are an expert insurance dispute resolution advisor. Evaluate this claim for escalation readiness and recommend the best path forward.

CLAIM SITUATION:
- Claim Number: ${claimContext.claim_number}
- Insurance Company: ${claimContext.insurer}
- Date of Loss: ${claimContext.date_of_loss}
- Days Since Loss: ${claimContext.days_since_loss}
- Days Since Last Response: ${claimContext.days_since_last_response || 'N/A'}

FINANCIAL POSITION:
- Documented Loss: $${claimContext.documented_loss.toLocaleString()}
- Carrier Offer: $${claimContext.carrier_offer.toLocaleString()}
- Underpayment: $${claimContext.underpayment.toLocaleString()}
- Recovery Percentage: ${claimContext.recovery_percentage}%

EVIDENCE & DOCUMENTATION:
- ${evidenceSummary}
- Number of Discrepancies: ${claimContext.num_discrepancies}
- Policy Type: ${claimContext.policy_type}
- State: ${claimContext.state}

NEGOTIATION HISTORY:
${negotiationHistory}

Provide a comprehensive escalation evaluation in JSON format:
{
  "recommendation": "<appraisal|mediation|litigation|continue_negotiating|doi_complaint>",
  "confidence": <1-10>,
  "reasoning": "<2-3 sentences explaining why>",
  "readiness_scores": {
    "appraisal": <1-10>,
    "mediation": <1-10>,
    "litigation": <1-10>
  },
  "pros_and_cons": {
    "appraisal": {
      "pros": ["<pro>"],
      "cons": ["<con>"]
    },
    "mediation": {
      "pros": ["<pro>"],
      "cons": ["<con>"]
    },
    "litigation": {
      "pros": ["<pro>"],
      "cons": ["<con>"]
    }
  },
  "cost_estimates": {
    "appraisal": "<cost range>",
    "mediation": "<cost range>",
    "litigation": "<cost range>"
  },
  "timeline_estimates": {
    "appraisal": "<time range>",
    "mediation": "<time range>",
    "litigation": "<time range>"
  },
  "success_probability": {
    "appraisal": <percentage>,
    "mediation": <percentage>,
    "litigation": <percentage>
  },
  "preparation_steps": [
    "<specific action needed before escalating>"
  ],
  "risks": [
    "<potential risk of escalation>"
  ],
  "state_specific_notes": "<notes about ${claimContext.state} laws, appraisal rights, mediation programs>",
  "urgency_level": "<low|medium|high|critical>",
  "bad_faith_indicators": [
    "<indicator if any>"
  ]
}

ANALYSIS GUIDELINES:
- Appraisal: Best for valuation disputes, faster (60-90 days), costs $2,000-$5,000
- Mediation: Best for coverage disputes, voluntary, costs $1,000-$3,000
- Litigation: Last resort, 12-24 months, costs $10,000+
- DOI Complaint: Good for delays and bad faith, free, 30-60 days
- Continue Negotiating: If still making progress

Consider:
- Size of dispute (larger = more worth escalating)
- Time elapsed (longer = more urgent)
- Evidence strength (stronger = better chance)
- Carrier behavior (delays, denials = bad faith indicators)
- State laws (some states favor policyholders)

Return ONLY valid JSON, no additional text.`;

    let escalationAnalysis;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance dispute resolution advisor with expertise in appraisal, mediation, litigation, and state insurance regulations. Before recommending escalation, analyze: 1) Cost-benefit ratio (dispute amount vs. escalation costs), 2) Evidence strength and likelihood of success, 3) Time sensitivity and urgency factors, 4) Carrier behavior patterns indicating bad faith, 5) State-specific advantages or disadvantages. Provide strategic, data-driven recommendations. Return only valid JSON.'
          },
          {
            role: 'user',
            content: `Example escalation evaluation:
Underpayment: $18,550
Days since loss: 75
Evidence: Strong (contractor estimate, photos, code citations)
Carrier behavior: Multiple delays, no substantive responses
State: Texas`
          },
          {
            role: 'assistant',
            content: `{
  "recommendation": "appraisal",
  "confidence": 9,
  "reasoning": "Strong evidence, significant underpayment, and carrier delay patterns make appraisal highly favorable. Texas appraisal rights are well-established and binding.",
  "pros": [
    "Binding decision on valuation dispute",
    "Faster than litigation (60-90 days vs 12-24 months)",
    "Cost-effective ($2,500-4,000 vs $15,000+ for litigation)",
    "High success rate with documented contractor estimates"
  ],
  "cons": [
    "Upfront cost of $2,500-4,000 for appraiser",
    "Only resolves valuation, not coverage disputes",
    "Carrier may still delay payment after award"
  ],
  "cost_estimates": {
    "appraisal": "$2,500-$4,000",
    "mediation": "$1,500-$3,000",
    "litigation": "$15,000-$50,000+"
  },
  "timeline_estimates": {
    "appraisal": "60-90 days",
    "mediation": "30-60 days",
    "litigation": "12-24 months"
  },
  "success_probability": {
    "appraisal": 85,
    "mediation": 70,
    "litigation": 75
  },
  "preparation_steps": [
    "Invoke appraisal clause in writing within policy deadline",
    "Select qualified umpire from approved list",
    "Compile all documentation for appraiser review",
    "Prepare itemized list of disputed line items"
  ],
  "risks": [
    "Appraisal award could be less than contractor estimate",
    "Carrier may challenge umpire selection",
    "Additional costs if carrier disputes award"
  ],
  "state_specific_notes": "Texas Insurance Code strongly favors appraisal for valuation disputes. Courts consistently uphold appraisal awards. Carrier must participate once properly invoked.",
  "urgency_level": "high",
  "bad_faith_indicators": [
    "75 days elapsed with minimal substantive response",
    "Multiple delays without justification",
    "Failure to address documented evidence"
  ]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      escalationAnalysis = JSON.parse(completion.choices[0].message.content);
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: { message: 'AI analysis failed: ' + aiError.message }
        })
      };
    }

    // Store analysis output
    const { error: outputError } = await supabase
      .from('claim_outputs')
      .insert({
        claim_id,
        step_number: 15,
        output_type: 'escalation_evaluation',
        output_json: escalationAnalysis,
        ai_model: 'gpt-4o'
      });

    if (outputError) {
      console.warn('Failed to store output:', outputError);
    }

    // Add legacy fields for backward compatibility
    const result = {
      ...escalationAnalysis,
      underpayment_amount: underpaymentAmount,
      days_since_loss: daysSinceLoss,
      days_since_last_response: daysSinceLastResponse
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ data: result })
    };

  } catch (error) {
    console.error('Escalation evaluation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Escalation evaluation failed' }
      })
    };
  }
};
