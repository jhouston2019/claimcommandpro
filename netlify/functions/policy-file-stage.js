/**
 * policy-file-stage.js — Upload policy PDF once (OpenAI Files + optional Supabase).
 * Analyze via ai-policy-review with openai_file_id only (no huge base64 on analyze POST).
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const {
  decodeBase64Payload,
  preparePdfBuffer,
  uploadPdfToOpenAI,
  resolveMime
} = require('./lib/policy-pdf-utils');

function corsHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Preview',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...extra
  };
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: 'Invalid JSON body' })
    };
  }

  if (!body.file_base64 || String(body.file_base64).length < 100) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: 'file_base64 is required' })
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: 'OPENAI_API_KEY not configured' })
    };
  }

  try {
    const { buffer } = decodeBase64Payload(body.file_base64);
    const mime = resolveMime(buffer, body.file_mime_type || 'application/pdf');
    if (mime !== 'application/pdf') {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ success: false, error: 'Only PDF files can be staged for policy analysis' })
      };
    }

    const declarationsOnly = body.declarations_only !== false;
    const { uploadBuffer, bytesStaged, declarationsOnly: declFlag } = preparePdfBuffer(
      buffer,
      declarationsOnly
    );

    console.log('[policy-file-stage] staging PDF bytes:', bytesStaged, 'declarations_only:', declFlag);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 90000 });
    const openai_file_id = await uploadPdfToOpenAI(openai, uploadBuffer);

    let storage_path = null;
    const supabase = getSupabaseAdmin();
    if (body.claim_id && supabase) {
      try {
        storage_path = `claims/${body.claim_id}/policy/staged-${Date.now()}.pdf`;
        const { error } = await supabase.storage
          .from('claim-documents')
          .upload(storage_path, uploadBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
        if (error) {
          console.warn('[policy-file-stage] storage upload failed:', error.message);
          storage_path = null;
        }
      } catch (e) {
        console.warn('[policy-file-stage] storage:', e.message);
        storage_path = null;
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: true,
        openai_file_id,
        storage_path,
        bytes_staged: bytesStaged,
        declarations_only: declFlag
      })
    };
  } catch (err) {
    console.error('[policy-file-stage]', err);
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, error: err.message || 'Failed to stage policy file' })
    };
  }
};
