/**
 * Contractor Scope Checklist Generation Function
 * AI-generated checklist to verify contractor estimates are complete
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
      project_type,
      damage_description,
      contractor_estimate,
      scope_of_work
    } = JSON.parse(event.body);

    if (!project_type || !damage_description) {
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

    const prompt = `Generate a comprehensive contractor scope checklist for this insurance claim repair project:

PROJECT INFO:
- Type: ${project_type}
- Damage Description: ${damage_description}
${contractor_estimate ? `- Contractor's Estimate: $${parseFloat(contractor_estimate).toLocaleString()}` : ''}
${scope_of_work ? `- Contractor's Scope of Work:\n${scope_of_work}` : ''}

Generate a detailed checklist in JSON format:
{
  "checklist_items": [
    {
      "category": "string - category name (e.g., Materials, Labor, Permits, Code Compliance, etc.)",
      "item": "string - specific item to verify is included",
      "description": "string - why this matters and what to look for",
      "priority": "critical|important|recommended",
      "typical_cost_range": "string - typical cost range if applicable (e.g., '$500-$1,200')"
    }
  ],
  "critical_missing_items": [
    "string - items commonly missed by contractors that could be expensive"
  ],
  "cost_considerations": [
    "string - cost factors to discuss with contractor"
  ],
  "questions_for_contractor": [
    "string - specific questions to ask to verify completeness"
  ],
  "red_flags": [
    "string - warning signs in the estimate or scope"
  ],
  "code_compliance_notes": "string - building code considerations for this project"
}

Focus on:
- Items commonly missed by contractors
- Code compliance requirements (electrical, structural, roofing codes)
- Permit requirements
- Warranty considerations
- Hidden damage potential (water intrusion, mold, structural)
- Material quality specifications
- Proper sequencing of work
- Cleanup and disposal
- Project management and supervision`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert construction project manager and insurance restoration specialist with 30+ years of experience. Generate comprehensive scope checklists that protect policyholders from incomplete contractor estimates and ensure all necessary work is identified. Before creating the checklist, analyze: 1) What items are commonly missed for this project type? 2) What code compliance issues apply? 3) What hidden damage might exist? 4) What permits are required? 5) What warranty considerations matter? Focus on items commonly missed, code compliance, and hidden damage. Return only valid JSON with no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const scopeChecklist = JSON.parse(completion.choices[0].message.content);

    // Store in Supabase
    if (claim) {
      await supabase
        .from('claim_outputs')
        .insert({
          claim_id: claim.id,
          output_type: 'contractor_scope_checklist',
          step_number: 5,
          output_json: scopeChecklist,
          created_at: new Date().toISOString()
        });
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(scopeChecklist)
    };

  } catch (error) {
    console.error('Scope checklist generation error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { message: error.message || 'Scope checklist generation failed' }
      })
    };
  }
};
