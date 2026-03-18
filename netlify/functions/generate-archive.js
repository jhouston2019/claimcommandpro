/**
 * Archive Generation Function
 * Creates ZIP archives of claim documents
 */

const archiver = require('archiver');
const { createClient } = require('@supabase/supabase-js');
const { Readable } = require('stream');

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
    const { claim_id, include_types, include_outputs } = JSON.parse(event.body);

    if (!claim_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing claim_id parameter' })
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

    // Fetch claim info
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claim_id)
      .eq('user_id', user.id)
      .single();

    if (claimError || !claim) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Claim not found' })
      };
    }

    // Fetch generated documents
    let documentsQuery = supabase
      .from('claim_generated_documents')
      .select('*')
      .eq('claim_id', claim_id);

    if (include_types && Array.isArray(include_types)) {
      documentsQuery = documentsQuery.in('document_type', include_types);
    }

    const { data: documents, error: docsError } = await documentsQuery;

    // Fetch analysis outputs
    let outputs = [];
    if (include_outputs !== false) {
      const { data: outputsData, error: outputsError } = await supabase
        .from('claim_outputs')
        .select('*')
        .eq('claim_id', claim_id);

      if (!outputsError && outputsData) {
        outputs = outputsData;
      }
    }

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    const chunks = [];
    archive.on('data', chunk => chunks.push(chunk));
    archive.on('error', err => {
      throw err;
    });

    // Add README
    const readme = `CLAIM PACKAGE - ${claim.claim_number}
Generated: ${new Date().toLocaleString()}

Claim Information:
- Claim Number: ${claim.claim_number}
- Date of Loss: ${claim.date_of_loss}
- Insurance Company: ${claim.insurer_name}
- Policy Number: ${claim.policy_number || 'N/A'}
- Property Address: ${claim.property_address || 'N/A'}

This archive contains all generated documents and analysis outputs for this claim.

Contents:
- Generated Documents: ${documents?.length || 0} files
- Analysis Outputs: ${outputs.length} files

For questions, contact support.
`;

    archive.append(readme, { name: 'README.txt' });

    // Add generated documents
    if (documents && documents.length > 0) {
      documents.forEach(doc => {
        const content = doc.content_html || doc.content_text || doc.content_markdown || '';
        const ext = doc.document_type.includes('pdf') ? 'pdf' : 
                    doc.document_type.includes('docx') ? 'docx' : 'txt';
        const filename = `${doc.document_type}/${doc.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
        archive.append(content, { name: filename });
      });
    }

    // Add analysis outputs as JSON
    if (outputs.length > 0) {
      outputs.forEach(output => {
        const filename = `analysis/${output.output_type}_step${output.step_number}.json`;
        archive.append(JSON.stringify(output.output_json, null, 2), { name: filename });
      });
    }

    // Finalize archive
    await archive.finalize();

    // Wait for all chunks
    await new Promise((resolve) => {
      archive.on('end', resolve);
    });

    const buffer = Buffer.concat(chunks);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="claim-${claim.claim_number}-package.zip"`
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Archive generation error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { message: error.message || 'Archive generation failed' }
      })
    };
  }
};
