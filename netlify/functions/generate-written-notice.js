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
      emergency_measures,
      claim_number,
      adjuster_name,
      phone,
      email
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

    const name = policyholder_name;
    const propertyAddress = property_address;
    const policyNumber = policy_number;
    const insurerName = insurer_name;
    const dateOfLoss = loss_date;
    const lossType = loss_type;
    const damageDescription = damage_description;
    const claimNumber = claim_number || 'Pending Assignment';
    const adjusterName = adjuster_name || '[Adjuster Name]';

    const prompt = `Generate a formal written notice of loss with the following details:

POLICYHOLDER INFORMATION:
Name: ${name}
Property Address: ${propertyAddress || '[Property Address]'}
Policy Number: ${policyNumber}
Phone: ${phone || '[Phone]'}
Email: ${email || '[Email]'}

INSURANCE COMPANY:
Name: ${insurerName}
Address: ${insurer_address || '[Carrier Mailing Address]'}
Adjuster: ${adjusterName}

LOSS DETAILS:
Date of Loss: ${dateOfLoss}
Claim Number: ${claimNumber}
Type of Loss: ${lossType}
General Description: ${damageDescription}
${emergency_measures ? 'Emergency Measures Taken: ' + emergency_measures : ''}

LETTER REQUIREMENTS:
1. Line 1: ${todayDate}
2. Line 2: "Sent via Certified Mail, Return Receipt Requested"
3. Carrier name and address block
4. RE: Formal Written Notice of Loss — Policy No. ${policyNumber} — Date of Loss ${dateOfLoss}
5. Formal salutation
6. Opening paragraph: state this is formal written notice per policy requirements
7. Loss description paragraph: date, time, cause, general nature of damage
8. Emergency measures paragraph (if any taken)
9. Documentation paragraph: state that complete documentation, damage inventory, and supporting evidence will follow
10. Inspection request: request prompt adjuster inspection and assignment
11. Contact information for scheduling
12. Professional closing with expectation of timely response
13. Signature block with all policyholder information

CRITICAL RULES:
- Do not estimate total damage dollar amount
- Do not describe detailed scope — general description only
- Every word chosen to preserve maximum claim rights
- Certified mail notation must appear below the date
- Length: 300-450 words — complete but not excessive
- Output letter text only`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a senior insurance claim advocate expert in written notice of loss requirements across all 50 states and standard ISO policy forms.

LEGAL REQUIREMENTS FOR WRITTEN NOTICE:
- Most policies require written notice within a "reasonable time" — interpreted as 24-72 hours in most states
- Notice must be sent via certified mail with return receipt to create legally documented record of timely reporting
- The postmark date is the legal evidence of timely notice
- Failure to provide timely written notice can void coverage in some jurisdictions — the written notice protects this right

WHAT TO INCLUDE IN INITIAL NOTICE:
- Date, time, and location of loss
- Cause of loss (general description — not detailed assessment)
- General nature of damage (not detailed scope)
- Claim number if already assigned
- Request for prompt inspection and adjuster assignment
- Statement that full documentation will follow
- Contact information for scheduling

WHAT TO EXCLUDE FROM INITIAL NOTICE:
- Do not estimate total damage amounts — this can limit the claim before full assessment is complete
- Do not speculate about cause if uncertain — describe observable facts only
- Do not describe full scope of damage in detail — this is for the proof of loss after complete assessment
- Do not make admissions about pre-existing conditions
- Do not waive any rights or agree to any limitations

CERTIFIED MAIL LANGUAGE:
Every notice must include "Sent via Certified Mail, Return Receipt Requested, USPS Tracking No. [TRACKING NUMBER]" below the date.

Output only the complete letter text — no JSON, no markdown fences, no commentary before or after.`
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

    // Add professional header and footer
    const formattedNotice = `
CLAIM INFORMATION:
Policyholder: ${policyholder_name}
Policy #: ${policy_number}
Property Address: ${property_address}
Date of Loss: ${new Date(loss_date).toLocaleDateString()}
Loss Type: ${loss_type}
Generated: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════════

${writtenNotice}

═══════════════════════════════════════════════════════════════
Generated by Claim Command Pro • Professional Insurance Claim Management
Not for redistribution • Confidential claim documentation
Document ID: WN-${Date.now()}
═══════════════════════════════════════════════════════════════
`;

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
        content_text: formattedNotice,
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
        body: formattedNotice,
        sent_at: new Date().toISOString()
      });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notice: formattedNotice,
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
