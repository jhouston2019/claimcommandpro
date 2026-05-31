const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authorization required' }) };
    }

    const { storage_path, claim_id } = JSON.parse(event.body);
    if (!storage_path) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'storage_path required' }) };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('claim-documents')
      .download(storage_path);

    if (error || !data) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'File not found in storage: ' + (error?.message || '') }) };
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    let extractedText = '';
    if (storage_path.endsWith('.pdf')) {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } else if (storage_path.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unsupported file type. Use PDF or TXT.' }) };
    }

    // Optionally store extracted text in claim_documents
    if (claim_id) {
      await supabase
        .from('claim_documents')
        .update({ extracted_text: extractedText })
        .eq('file_path', storage_path)
        .eq('claim_id', claim_id);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: extractedText, storage_path })
    };

  } catch (error) {
    console.error('Text extraction error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
