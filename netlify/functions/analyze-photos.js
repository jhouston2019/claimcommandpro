/**
 * analyze-photos.js — Vision analysis of damage photos (CCC Phase 03)
 */

const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const MAX_PHOTOS = 5;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Preview',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function emptyResult(message) {
  return {
    summary: message,
    damage_types: [],
    severity: 'minor',
    estimated_areas: [],
    notes: message,
    analyzed_at: new Date().toISOString(),
    error: message
  };
}

function mimeFromPath(path, fileName) {
  const name = (path || fileName || '').toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.heic') || name.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

async function loadImageBase64(supabase, photo) {
  const storagePath = photo.storage_path || photo.path;
  if (storagePath && supabase) {
    const { data, error } = await supabase.storage.from('claim-documents').download(storagePath);
    if (!error && data) {
      const buf = Buffer.from(await data.arrayBuffer());
      if (buf.length > MAX_IMAGE_BYTES) {
        console.warn('[analyze-photos] image too large, skipping:', storagePath);
        return null;
      }
      return {
        base64: buf.toString('base64'),
        mime: mimeFromPath(storagePath, photo.file_name || photo.name)
      };
    }
    console.warn('[analyze-photos] storage download failed:', storagePath, error?.message);
  }

  const url = photo.url;
  if (url && /^https?:\/\//i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) return null;
    const mime = res.headers.get('content-type') || mimeFromPath('', photo.file_name || photo.name);
    return { base64: buf.toString('base64'), mime: mime.split(';')[0] || 'image/jpeg' };
  }

  return null;
}

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 200, headers, body: JSON.stringify(emptyResult('Invalid JSON body')) };
  }

  const photos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  if (photos.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify(emptyResult('No photos provided')) };
  }

  const isAdminPreview =
    (event.headers['x-admin-preview'] || event.headers['X-Admin-Preview'] || '') === 'true';

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!isAdminPreview && (!authHeader || !authHeader.startsWith('Bearer '))) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authorization required' }) };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify(emptyResult('Photo analysis is temporarily unavailable (API not configured).')) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!isAdminPreview) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }
  }

  try {
    const imageParts = [];
    for (const photo of photos) {
      const loaded = await loadImageBase64(supabase, photo);
      if (loaded) {
        imageParts.push({
          type: 'image_url',
          image_url: { url: `data:${loaded.mime};base64,${loaded.base64}` }
        });
      }
    }

    if (imageParts.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify(emptyResult('Could not load any photos for analysis.')) };
    }

    const claimType = body.claim_type || 'property damage';
    const description = body.description || '';

    const systemPrompt = `You are an expert property insurance damage assessor. Analyze damage photos for a ${claimType} claim.
Return ONLY valid JSON with this schema:
{
  "summary": "string — 2-4 sentences for the policyholder",
  "damage_types": ["string"],
  "severity": "minor|moderate|severe",
  "estimated_areas": ["string — rooms or building areas visible"],
  "notes": "string — documentation tips or follow-up observations"
}`;

    const userText = `Claim type: ${claimType}
Loss description: ${description || 'Not provided'}
Number of photos: ${imageParts.length}

Assess visible structural and property damage. List specific damage types (e.g. water staining, drywall damage, flooring). Be conservative — only describe what is visible.`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 90000,
      maxRetries: 1
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [{ type: 'text', text: userText }, ...imageParts]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.3
    });

    const raw = response.choices[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { summary: raw, damage_types: [], severity: 'minor', estimated_areas: [], notes: '' };
    }

    const severity = ['minor', 'moderate', 'severe'].includes(parsed.severity)
      ? parsed.severity
      : 'moderate';

    const result = {
      summary: parsed.summary || 'Photo analysis complete.',
      damage_types: Array.isArray(parsed.damage_types) ? parsed.damage_types : [],
      severity,
      estimated_areas: Array.isArray(parsed.estimated_areas) ? parsed.estimated_areas : [],
      notes: parsed.notes || '',
      analyzed_at: new Date().toISOString()
    };

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    console.error('[analyze-photos] error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(emptyResult('Photo analysis failed. Please try again with fewer or smaller images.'))
    };
  }
};
