/**
 * RCV Recovery Submission Function
 * Handles submission of proof of repairs for depreciation recovery
 */

const { createClient } = require('@supabase/supabase-js');

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
      adjuster_name,
      adjuster_email,
      acv_paid,
      depreciation_withheld,
      total_repair_cost,
      repairs_summary,
      contractor_name,
      contractor_license,
      completion_date,
      proof_files
    } = JSON.parse(event.body);

    if (!claim_number || !acv_paid || !depreciation_withheld || !total_repair_cost || !repairs_summary || !completion_date) {
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

    // Find or create claim
    let { data: claim } = await supabase
      .from('claims')
      .select('id')
      .eq('claim_number', claim_number)
      .eq('user_id', user.id)
      .single();

    if (!claim) {
      const { data: newClaim, error: createError } = await supabase
        .from('claims')
        .insert({
          user_id: user.id,
          claim_number: claim_number,
          policy_number: policy_number,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create claim record');
      }
      claim = newClaim;
    }

    // Upload proof files to Supabase Storage
    const uploadedUrls = [];
    if (proof_files && Array.isArray(proof_files)) {
      for (const file of proof_files) {
        const fileName = `${claim.id}/rcv-recovery/${Date.now()}-${file.name}`;
        const fileBuffer = Buffer.from(file.data, 'base64');

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('claim-documents')
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('claim-documents')
            .getPublicUrl(fileName);
          
          uploadedUrls.push({
            name: file.name,
            url: urlData.publicUrl,
            type: file.type
          });
        }
      }
    }

    // Store RCV recovery submission
    const submissionRecord = {
      claim_id: claim.id,
      acv_paid,
      depreciation_withheld,
      total_repair_cost,
      repairs_summary,
      contractor_name,
      contractor_license,
      completion_date,
      proof_documents: uploadedUrls,
      adjuster_name,
      adjuster_email,
      submission_date: new Date().toISOString(),
      status: 'submitted'
    };

    const { error: insertError } = await supabase
      .from('claim_rcv_recoveries')
      .insert(submissionRecord);

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Log communication
    await supabase
      .from('claim_communications')
      .insert({
        claim_id: claim.id,
        communication_type: 'rcv_recovery_submission',
        direction: 'outbound',
        recipient: adjuster_name || 'Insurance Adjuster',
        subject: `RCV Recovery Request - Claim ${claim_number}`,
        body: `Submitted proof of repairs for depreciation recovery. Total repair cost: $${total_repair_cost.toLocaleString()}. Recovery requested: $${depreciation_withheld.toLocaleString()}.`,
        sent_at: new Date().toISOString()
      });

    // Update financial summary
    await supabase
      .from('claim_financial_summary')
      .upsert({
        claim_id: claim.id,
        rcv_recovery_requested: depreciation_withheld,
        total_repair_cost: total_repair_cost,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'claim_id'
      });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        claim_id: claim.id,
        recovery_amount: depreciation_withheld,
        files_uploaded: uploadedUrls.length,
        submission_date: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('RCV recovery submission error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { message: error.message || 'RCV recovery submission failed' }
      })
    };
  }
};
