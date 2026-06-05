/**
 * Contractor Estimate Interpreter
 * Analyzes contractor estimates, extracts line items, identifies missing scope, and compares against ROM ranges
 */

const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { parseEstimate } = require('./lib/estimate-parser');
const { sumEstimateTotal } = require('./lib/estimate-comparison-engine');
const EstimateEngine = require('../../app/assets/js/intelligence/estimate-engine');

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Download file from URL
 */
async function downloadFile(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Extract text from PDF
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from image using OCR
 */
async function extractTextFromImage(buffer, fileName) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const base64Image = buffer.toString('base64');
    const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this contractor estimate. Return only the raw text content, preserving line breaks and structure. Do not add any commentary or analysis.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Parse line items from extracted text using AI
 */
async function parseLineItemsWithAI(extractedText, lossType, severity, areas) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an expert at parsing contractor estimates. Extract every line item from the estimate text.

Return ONLY valid JSON matching this exact structure:
{
  "contractor_name": "string — name of contractor/company from estimate header",
  "estimate_date": "string — date on the estimate if present",
  "total": number,
  "line_items": [
    {
      "description": "string — exact line item description",
      "quantity": number or null,
      "unit": "string or null — SF, LF, EA, LS, Days, etc.",
      "unit_price": number or null,
      "total": number,
      "status": "Complete" | "Questionable" | "Missing from Carrier"
    }
  ],
  "notes": "string — overall observations about the estimate scope",
  "summary": "string — one paragraph summary for the user"
}

Rules:
- Extract EVERY line item from the estimate — do not summarize or group them
- If unit price cannot be determined, set to null but always set total
- Mark status as "Questionable" if the line item seems underpriced or vague
- Mark status as "Missing from Carrier" if you know this item is typically excluded from carrier estimates
- contractor_name should be the company name from the letterhead or header
- total must match the sum of all line_items[].total values (or the stated estimate total if present)`;

    const userPrompt = `Extract line items from this contractor estimate:

Loss Type: ${lossType || 'Unknown'}
Severity: ${severity || 'Unknown'}
Areas Affected: ${areas?.join(', ') || 'Unknown'}

Estimate Text:
${extractedText.substring(0, 8000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    parsed.line_items = Array.isArray(parsed.line_items) ? parsed.line_items : [];
    parsed.total = Number(parsed.total) || parsed.line_items.reduce((s, i) => s + (Number(i.total) || 0), 0);
    return parsed;
  } catch (error) {
    console.error('AI parsing error:', error);
    throw new Error('Failed to parse estimate with AI');
  }
}

function buildContractorResponse(parsedData, extras = {}) {
  const lineItems = (parsedData.line_items || []).map((item) => ({
    description: item.description || item.name || '—',
    quantity: item.quantity != null ? item.quantity : null,
    unit: item.unit || null,
    unit_price: item.unit_price != null ? item.unit_price : (item.unitPrice != null ? item.unitPrice : null),
    total: Number(item.total) || Number(item.lineTotal) || 0,
    status: item.status || 'Complete'
  }));
  const total = Number(parsedData.total) || lineItems.reduce((s, i) => s + (i.total || 0), 0);
  return {
    contractor_name: parsedData.contractor_name || '',
    estimate_date: parsedData.estimate_date || '',
    total,
    line_items: lineItems,
    notes: parsedData.notes || '',
    summary: parsedData.summary || `Contractor estimate analyzed — ${lineItems.length} line items, total ${total}.`,
    ...extras
  };
}

function buildFromDeterministicParse(extractedText) {
  const parsed = parseEstimate(extractedText, 'contractor');
  const materialItems = (parsed.lineItems || []).filter(
    (item) => !item.is_tax && !item.is_op && !item.is_subtotal && !item.is_total && !item.is_summary_depreciation
  );
  const lineItems = materialItems.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    total: item.rcv_total ?? item.total ?? 0,
    status: 'Complete',
    category: item.category
  }));
  const total = sumEstimateTotal(materialItems);
  return {
    line_items: lineItems,
    total,
    parse_metadata: parsed.metadata,
    parse_success_rate: Number(parsed.metadata?.parse_success_rate || 0)
  };
}

function mergeContractorResults(deterministic, aiParsed) {
  const detCount = deterministic.line_items?.length || 0;
  const aiCount = aiParsed.line_items?.length || 0;
  const useDeterministic = detCount >= 3 && deterministic.parse_success_rate >= 50;

  if (useDeterministic) {
    return buildContractorResponse({
      contractor_name: aiParsed.contractor_name,
      estimate_date: aiParsed.estimate_date,
      total: deterministic.total || aiParsed.total,
      line_items: deterministic.line_items,
      notes: aiParsed.notes,
      summary: `Deterministic parse: ${detCount} line items extracted (${deterministic.parse_success_rate}% success). ${aiParsed.summary || ''}`.trim()
    }, {
      parse_method: 'deterministic',
      parse_metadata: deterministic.parse_metadata,
      scope_analysis: null
    });
  }

  if (detCount > 0 && aiCount > 0) {
    const seen = new Set(aiParsed.line_items.map((i) => (i.description || '').toLowerCase()));
    const merged = [...aiParsed.line_items];
    for (const item of deterministic.line_items) {
      const key = (item.description || '').toLowerCase();
      if (!seen.has(key)) {
        merged.push(item);
        seen.add(key);
      }
    }
    return buildContractorResponse({
      ...aiParsed,
      line_items: merged,
      total: Math.max(aiParsed.total, deterministic.total)
    }, {
      parse_method: 'hybrid',
      parse_metadata: deterministic.parse_metadata
    });
  }

  return buildContractorResponse(aiParsed, { parse_method: 'ai' });
}

/**
 * Get ROM range estimate
 */
async function getROMRange(lossType, severity, areas) {
  try {
    // Map loss type to ROM category
    const categoryMap = {
      'Fire': 'fire',
      'Water': 'water',
      'Wind': 'wind',
      'Hail': 'roof',
      'Hurricane': 'structural',
      'Mold': 'water',
      'Theft': 'contents',
      'Vandalism': 'structural'
    };

    const category = categoryMap[lossType] || 'structural';
    const severityMap = {
      'Low': 'minor',
      'Moderate': 'moderate',
      'Severe': 'severe',
      'Catastrophic': 'total_loss'
    };
    const romSeverity = severityMap[severity] || 'moderate';

    // Estimate square footage based on areas (rough approximation)
    let estimatedSqft = 1000; // Default
    if (areas && areas.length > 0) {
      // Rough estimate: 200 sqft per area
      estimatedSqft = areas.length * 200;
    }

    // Call ROM estimator
    const romResponse = await fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/ai-rom-estimator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        category: category,
        severity: romSeverity,
        square_feet: estimatedSqft
      })
    });

    if (romResponse.ok) {
      const romData = await romResponse.json();
      const estimate = romData.estimate || romData.low || 0;
      
      // Create range (low = 0.9x, high = 1.2x of estimate)
      return {
        low: Math.round(estimate * 0.9),
        high: Math.round(estimate * 1.2)
      };
    }
  } catch (error) {
    console.warn('ROM estimator call failed:', error);
  }

  // Fallback: return null (will be handled in comparison)
  return null;
}

/**
 * Compare estimate to ROM range
 */
function compareToROMRange(totalAmount, romRange) {
  if (!romRange || !romRange.low || !romRange.high) {
    return { relation: 'unknown' };
  }

  if (totalAmount < romRange.low) {
    return { ...romRange, relation: 'below-range' };
  } else if (totalAmount > romRange.high) {
    return { ...romRange, relation: 'above-range' };
  } else {
    return { ...romRange, relation: 'within-range' };
  }
}

/**
 * Generate recommendations
 */
async function generateRecommendations(parsedData, lossType, severity, areas) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return [];
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Based on this contractor estimate analysis:

Loss Type: ${lossType || 'Unknown'}
Severity: ${severity || 'Unknown'}
Total: $${parsedData.totalAmount || 0}
Missing Scope Items: ${(parsedData.missingScope || []).join(', ') || 'None identified'}
ROM Relation: ${parsedData.romRange?.relation || 'unknown'}

Provide 3-5 plain-language recommendations as a JSON array:
- Questions to ask the contractor
- Documents/photos to add
- Whether to discuss with adjuster
- Any other actionable advice

Return only a JSON array of strings: ["recommendation 1", "recommendation 2", ...]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    return parsed.recommendations || parsed.array || [];
  } catch (error) {
    console.warn('Recommendations generation failed:', error);
    return [
      'Review the estimate line items for accuracy.',
      'Ask the contractor to clarify any ambiguous descriptions.',
      'Compare this estimate with your carrier\'s estimate when available.'
    ];
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    const supabase = getSupabaseClient();
    
    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch (err) {
        console.warn('Auth check failed:', err.message);
      }
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      fileUrl,
      fileName,
      estimate_text,
      lossType,
      severity,
      areas,
      claimId,
      claim_type,
      property_type
    } = body;

    const resolvedLossType = lossType || claim_type || 'property-claim';
    let extractedText = (estimate_text || '').trim();

    if (!extractedText && fileUrl) {
      const fileBuffer = await downloadFile(fileUrl);
      const name = fileName || 'estimate.pdf';
      if (name.endsWith('.pdf')) {
        extractedText = await extractTextFromPDF(fileBuffer);
      } else if (name.match(/\.(png|jpg|jpeg)$/i)) {
        extractedText = await extractTextFromImage(fileBuffer, name);
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unsupported file type. Please use PDF or image.' })
        };
      }
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Could not extract sufficient text. Upload a PDF or paste estimate text.' })
      };
    }

    const deterministic = buildFromDeterministicParse(extractedText);
    const parsedData = await parseLineItemsWithAI(extractedText, resolvedLossType, severity, areas);
    const response = mergeContractorResults(deterministic, parsedData);

    try {
      const scopeCheck = EstimateEngine.analyzeEstimate({
        estimateText: extractedText.slice(0, 12000),
        lineItems: [],
        userInput: '',
        metadata: { lossType: resolvedLossType }
      });
      if (scopeCheck.success) {
        response.scope_analysis = {
          classification: scopeCheck.classification,
          analysis: scopeCheck.analysis
        };
      }
    } catch (scopeErr) {
      console.warn('Scope analysis skipped:', scopeErr.message);
    }

    // Store interpretation in database (optional)
    if (supabase && userId && claimId) {
      try {
        await supabase.from('contractor_estimate_interpretations').insert({
          user_id: userId,
          claim_id: claimId,
          estimate_total: response.total,
          loss_type: resolvedLossType,
          property_type: property_type || null,
          areas: areas || [],
          line_items: response.line_items,
          recommendations: response.notes,
          created_at: new Date().toISOString()
        }).catch(() => {
          console.warn('contractor_estimate_interpretations table not found, skipping database storage');
        });
      } catch (error) {
        console.warn('Failed to store interpretation:', error);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Contractor estimate interpreter error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to interpret estimate',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};


