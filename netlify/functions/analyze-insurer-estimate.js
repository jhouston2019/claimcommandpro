/**
 * Analyze Insurer Estimate
 * Accepts a base64-encoded PDF, sends it to Claude via the Anthropic API,
 * and returns the analysis text for use in Step 9 of the Claim Command Center.
 */

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not configured');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { pdfBase64, mediaType = 'application/pdf' } = body;

  if (!pdfBase64) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'pdfBase64 is required' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: 'You are an expert public insurance adjuster. Analyze this insurance estimate and identify: the total insurer offered amount, all missing scope items, all line items with suppressed or below-market pricing, all unclaimed coverage triggers, and the total recoverable gap. Return amounts as dollar figures. Be specific and cite line items by name.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: pdfBase64
                }
              },
              {
                type: 'text',
                text: 'Analyze this insurance estimate document. Identify the total insurer offered amount, all missing scope items, all suppressed or below-market line items, any unclaimed coverage triggers, and the total recoverable gap. Cite specific line items and dollar amounts throughout.'
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Anthropic API error: ${response.status}`, detail: errText })
      };
    }

    const result = await response.json();
    const analysis = result.content?.[0]?.text || '';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, analysis })
    };

  } catch (err) {
    console.error('analyze-insurer-estimate error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
