/**
 * Shared helpers for Claim Command Center v3 Netlify functions (Anthropic + optional PDF text).
 */

const pdfParse = require('pdf-parse');

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

function cccJsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(payload),
  };
}

function handleCccOptions() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: '',
  };
}

async function fetchUrlBuffer(fileUrl) {
  const res = await fetch(fileUrl, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to download file: HTTP ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Best-effort text from a URL (PDF via pdf-parse, else UTF-8 slice).
 */
async function extractTextFromUrl(fileUrl, maxChars = 120000) {
  const buf = await fetchUrlBuffer(fileUrl);
  try {
    const data = await pdfParse(buf);
    const t = (data.text || '').trim();
    if (t.length > 80) return t.slice(0, maxChars);
  } catch (_) {
    /* not a PDF or parse failed */
  }
  const asUtf8 = buf.toString('utf8').trim();
  if (asUtf8.length > 80) return asUtf8.slice(0, maxChars);
  throw new Error('Could not extract readable text from document (need PDF or text)');
}

function stripJsonFence(text) {
  let t = String(text || '').trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (m) t = m[1].trim();
  return t;
}

async function anthropicMessagesText({ system, userText, maxTokens = 4096 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system: system || 'You are a precise assistant for insurance claim documentation.',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: userText }],
        },
      ],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${errBody.slice(0, 500)}`);
  }
  const data = await res.json();
  const blocks = data.content || [];
  return blocks
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

async function anthropicJsonObject({ system, userText, maxTokens = 4096 }) {
  const raw = await anthropicMessagesText({
    system:
      (system ? `${system}\n\n` : '') +
      'Respond with a single JSON object only. No markdown fences, no commentary.',
    userText,
    maxTokens,
  });
  const cleaned = stripJsonFence(raw);
  return JSON.parse(cleaned);
}

module.exports = {
  cccJsonResponse,
  handleCccOptions,
  extractTextFromUrl,
  anthropicMessagesText,
  anthropicJsonObject,
  DEFAULT_MODEL,
};
