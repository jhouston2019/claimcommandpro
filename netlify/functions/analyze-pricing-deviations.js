/**
 * Pricing Deviation Analysis Function
 * Analyzes pricing differences between contractor and insurer estimates
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
      location,
      contractor_total,
      insurer_total,
      line_items,
      market_context
    } = JSON.parse(event.body);

    if (!location || !contractor_total || !insurer_total || !line_items) {
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

    // Find claim if claim_number provided
    let claim = null;
    if (claim_number) {
      const { data: claimData } = await supabase
        .from('claims')
        .select('id')
        .eq('claim_number', claim_number)
        .eq('user_id', user.id)
        .single();
      claim = claimData;
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const totalDeviation = contractor_total - insurer_total;
    const deviationPercent = ((totalDeviation / contractor_total) * 100).toFixed(1);

    const prompt = `Analyze pricing deviations between contractor and insurance estimates:

LOCATION: ${location}

TOTALS:
- Contractor Estimate: $${contractor_total.toLocaleString()}
- Insurer Estimate: $${insurer_total.toLocaleString()}
- Total Deviation: $${totalDeviation.toLocaleString()} (${deviationPercent}%)

LINE ITEM COMPARISON:
${line_items}

${market_context ? `MARKET CONTEXT:\n${market_context}\n` : ''}

Provide a comprehensive pricing deviation analysis in JSON format:
{
  "total_deviation": number,
  "deviation_percentage": number,
  "line_item_deviations": [
    {
      "item": "string - line item name",
      "contractor_price": number,
      "insurer_price": number,
      "deviation": number,
      "deviation_percent": number,
      "explanation": "string - detailed explanation of why this deviation exists",
      "market_justification": "string - market rate justification for contractor price with specific data"
    }
  ],
  "market_analysis": {
    "location_factors": "string - how location affects pricing (labor rates, cost of living, demand)",
    "current_market_conditions": "string - relevant market conditions (material costs, labor shortages, seasonal factors)",
    "labor_cost_analysis": "string - labor rate analysis for this location and project type",
    "material_cost_analysis": "string - material cost analysis and market rates"
  },
  "recommendations": [
    "string - specific actions to address deviations and support contractor pricing"
  ],
  "supporting_data_needed": [
    "string - specific data to gather to support contractor pricing (quotes, market surveys, etc.)"
  ],
  "negotiation_leverage": "string - how to use this analysis in negotiations"
}

Consider:
- Regional labor rates and cost of living
- Current material costs and supply chain issues
- Seasonal demand and availability
- Contractor overhead and profit margins
- Insurance company pricing databases (Xactimate) vs actual market rates
- Specialty work or difficult access
- Code compliance requirements`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert construction cost estimator and insurance claims pricing analyst with deep knowledge of regional construction costs, labor rates, and material pricing. Before analyzing deviations, consider: 1) Regional cost of living and labor rates, 2) Current material costs and supply chain factors, 3) Xactimate pricing vs. actual market rates, 4) Specialty work or access premiums, 5) Code compliance cost impacts. Analyze pricing deviations between contractor and insurer estimates, providing detailed market rate justifications that can be used in claim negotiations. Return only valid JSON with no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const pricingAnalysis = JSON.parse(completion.choices[0].message.content);

    // Store in Supabase
    if (claim) {
      await supabase
        .from('claim_outputs')
        .insert({
          claim_id: claim.id,
          output_type: 'pricing_deviation_analysis',
          step_number: 9,
          output_json: pricingAnalysis,
          created_at: new Date().toISOString()
        });
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(pricingAnalysis)
    };

  } catch (error) {
    console.error('Pricing deviation analysis error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { message: error.message || 'Pricing deviation analysis failed' }
      })
    };
  }
};
