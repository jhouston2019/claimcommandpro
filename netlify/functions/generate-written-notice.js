/**
 * Written Notice Generation Function
 * Generates formal written notice of loss letters
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
      policyholder_name,
      property_address,
      policy_number,
      insurer_name,
      insurer_address,
      loss_date,
      loss_type,
      damage_description,
      estimated_amount,
      emergency_measures
    } = JSON.parse(event.body);

    if (!policyholder_name || !property_address || !policy_number || !insurer_name || !loss_date || !loss_type || !damage_description) {
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `Generate a formal written notice of loss letter with the following details:

POLICYHOLDER:
- Name: ${policyholder_name}
- Property Address: ${property_address}
- Policy Number: ${policy_number}

INSURANCE COMPANY:
- Name: ${insurer_name}
${insurer_address ? `- Address: ${insurer_address}` : ''}

LOSS DETAILS:
- Date of Loss: ${loss_date}
- Type of Loss: ${loss_type}
- Damage Description: ${damage_description}
${estimated_amount ? `- Estimated Loss Amount: $${parseFloat(estimated_amount).toLocaleString()}` : ''}
${emergency_measures ? `- Emergency Measures Taken: ${emergency_measures}` : ''}

REQUIREMENTS:
1. Professional business letter format
2. Include proper date (${todayDate}), addresses, and Re: line with policy number
3. State that this is formal written notice of loss as required by the insurance policy
4. Clearly state date of loss and type of damage
5. Provide preliminary description of damage
6. Mention emergency measures taken (if any)
7. State that full documentation and supporting evidence will follow
8. Request prompt inspection and claim processing
9. Include policy number prominently in Re: line
10. Professional but firm tone
11. Close with expectation of timely response
12. Length: 250-400 words

Return ONLY the letter text, properly formatted with line breaks and proper spacing.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert insurance claims professional with 20+ years of experience. Generate formal, legally compliant written notices of loss that protect the policyholder\'s rights, trigger the claim process, and establish a clear timeline. Before drafting, consider: 1) Does this meet policy notice requirements? 2) Does it preserve all claim rights? 3) Is it specific enough to trigger coverage but not so detailed it limits the claim? The notice should be professional, clear, and assertive.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const writtenNotice = completion.choices[0].message.content;

    // Find or create claim
    let { data: claim } = await supabase
      .from('claims')
      .select('id')
      .eq('policy_number', policy_number)
      .eq('user_id', user.id)
      .single();

    if (!claim) {
      const { data: newClaim, error: createError } = await supabase
        .from('claims')
        .insert({
          user_id: user.id,
          policy_number: policy_number,
          insurer_name: insurer_name,
          property_address: property_address,
          date_of_loss: loss_date,
          loss_type: loss_type,
          status: 'notice_sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create claim record');
      }
      claim = newClaim;
    }

    // Store generated notice
    await supabase
      .from('claim_generated_documents')
      .insert({
        claim_id: claim.id,
        document_type: 'written_notice',
        title: `Written Notice of Loss - ${loss_date}`,
        content_text: writtenNotice,
        step_number: 3,
        created_at: new Date().toISOString()
      });

    // Log communication
    await supabase
      .from('claim_communications')
      .insert({
        claim_id: claim.id,
        communication_type: 'written_notice',
        direction: 'outbound',
        recipient: insurer_name,
        subject: `Written Notice of Loss - Policy ${policy_number}`,
        body: writtenNotice,
        sent_at: new Date().toISOString()
      });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notice: writtenNotice,
        claim_id: claim.id
      })
    };

  } catch (error) {
    console.error('Written notice generation error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { message: error.message || 'Written notice generation failed' }
      })
    };
  }
};
