/**
 * Netlify Function: text-extract
 * Extracts text from claim documents in Supabase Storage.
 * PDF: pdf-parse with quality gate → Claude vision fallback on failure or poor quality.
 * Images: Claude vision OCR directly.
 * TXT: UTF-8 read.
 */

const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const VISION_MODEL = 'claude-sonnet-4-20250514';
const IMAGE_MEDIA_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic'
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(payload)
  };
}

function getExtension(storagePath) {
  const dot = String(storagePath || '').lastIndexOf('.');
  if (dot < 0) return '';
  return String(storagePath).slice(dot).toLowerCase();
}

function normalizeDocumentType(documentType) {
  const t = String(documentType || 'general').toLowerCase().trim();
  if (t === 'estimate' || t === 'policy' || t === 'general') return t;
  return 'general';
}

function getExtractionPrompt(documentType) {
  switch (normalizeDocumentType(documentType)) {
    case 'estimate':
      return 'Extract all text from this document exactly as it appears. Preserve line items, quantities, unit costs, totals, RCV, ACV, O&P, depreciation amounts, and section headers. Format as plain text maintaining the original structure.';
    case 'policy':
      return 'Extract all text from this document exactly as it appears. Preserve coverage limits, deductibles, exclusions, endorsements, section headers, and policy numbers. Format as plain text maintaining the original structure.';
    default:
      return 'Extract all text from this document exactly as it appears. Preserve all numbers, headings, and structure. Format as plain text.';
  }
}

function computeQuality(text) {
  const char_count = String(text || '').length;
  if (char_count === 0) {
    return { char_count: 0, printable_ratio: 0, word_density: 0 };
  }

  let printable = 0;
  for (let i = 0; i < char_count; i++) {
    const code = text.charCodeAt(i);
    if (code >= 32 && code <= 126) printable++;
  }

  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  return {
    char_count,
    printable_ratio: Number((printable / char_count).toFixed(4)),
    word_density: Number((wordCount / char_count).toFixed(4))
  };
}

function isPoorQuality(quality) {
  return (
    quality.char_count < 150 ||
    quality.printable_ratio < 0.85 ||
    quality.word_density < 0.05
  );
}

async function visionExtract(buffer, { isPdf, mediaType, documentType }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const base64 = buffer.toString('base64');
  const prompt = getExtractionPrompt(documentType);

  const content = isPdf
    ? [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64
          }
        },
        { type: 'text', text: prompt }
      ]
    : [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64
          }
        },
        { type: 'text', text: prompt }
      ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25'
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 4096,
      system: 'You are a precise document text extraction assistant. Return only the extracted plain text with no commentary.',
      messages: [
        {
          role: 'user',
          content
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText.slice(0, 500)}`);
  }

  const result = await response.json();
  const text = (result.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Anthropic returned empty text');
  }

  return text;
}

async function persistExtractedText(supabase, claimId, storagePath, text, extractionMethod) {
  if (!claimId) return;

  const withMethod = await supabase
    .from('claim_documents')
    .update({
      extracted_text: text,
      extraction_method: extractionMethod
    })
    .eq('file_path', storagePath)
    .eq('claim_id', claimId);

  if (withMethod.error) {
    console.warn(
      'claim_documents update with extraction_method failed:',
      withMethod.error.message
    );
    const textOnly = await supabase
      .from('claim_documents')
      .update({ extracted_text: text })
      .eq('file_path', storagePath)
      .eq('claim_id', claimId);
    if (textOnly.error) {
      console.warn('claim_documents extracted_text update failed:', textOnly.error.message);
    }
  }
}

function buildSuccessPayload(storagePath, text, extractionMethod) {
  const quality = computeQuality(text);
  console.log(
    'text-extract success:',
    JSON.stringify({
      storage_path: storagePath,
      extraction_method: extractionMethod,
      char_count: quality.char_count,
      printable_ratio: quality.printable_ratio
    })
  );
  return {
    text,
    storage_path: storagePath,
    extraction_method: extractionMethod,
    quality
  };
}

async function extractFromPdf(buffer, storagePath, documentType) {
  let parsedText = '';

  try {
    const parsed = await pdfParse(buffer);
    parsedText = String(parsed.text || '').trim();
    const quality = computeQuality(parsedText);

    if (!isPoorQuality(quality)) {
      return buildSuccessPayload(storagePath, parsedText, 'pdf_parse');
    }

    console.error(
      'text-extract fallback triggered:',
      JSON.stringify({
        reason: 'quality_gate_failed',
        char_count: quality.char_count,
        printable_ratio: quality.printable_ratio,
        word_density: quality.word_density
      })
    );
  } catch (parseError) {
    console.error(
      'text-extract fallback triggered:',
      JSON.stringify({ reason: 'pdf_parse_threw', error: parseError.message })
    );
  }

  const visionText = await visionExtract(buffer, {
    isPdf: true,
    mediaType: 'application/pdf',
    documentType
  });

  return buildSuccessPayload(storagePath, visionText, 'vision_ocr');
}

async function extractFromImage(buffer, storagePath, extension, documentType) {
  const mediaType = IMAGE_MEDIA_TYPES[extension];
  if (!mediaType) {
    throw new Error(`Unsupported image type: ${extension}`);
  }

  const visionText = await visionExtract(buffer, {
    isPdf: false,
    mediaType,
    documentType
  });

  return buildSuccessPayload(storagePath, visionText, 'vision_ocr');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse(401, { error: 'Authorization required' });
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const { storage_path, claim_id, document_type } = body;
    const documentType = normalizeDocumentType(document_type);

    console.log(
      'text-extract called:',
      JSON.stringify({ storage_path, claim_id, document_type: documentType })
    );

    if (!storage_path) {
      return jsonResponse(400, { error: 'storage_path required' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.storage
      .from('claim-documents')
      .download(storage_path);

    if (error || !data) {
      return jsonResponse(404, {
        error: 'File not found in storage: ' + (error?.message || '')
      });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const extension = getExtension(storage_path);
    let result;

    if (extension === '.pdf') {
      try {
        result = await extractFromPdf(buffer, storage_path, documentType);
      } catch (visionError) {
        console.error('text-extract vision fallback failed:', visionError.message);
        return jsonResponse(500, {
          error: 'Extraction failed: both pdf-parse and vision OCR unsuccessful',
          details: visionError.message
        });
      }
    } else if (extension === '.txt') {
      const text = buffer.toString('utf-8');
      result = buildSuccessPayload(storage_path, text, 'text');
    } else if (IMAGE_MEDIA_TYPES[extension]) {
      try {
        result = await extractFromImage(buffer, storage_path, extension, documentType);
      } catch (visionError) {
        console.error('text-extract image vision failed:', visionError.message);
        return jsonResponse(500, {
          error: 'Extraction failed: both pdf-parse and vision OCR unsuccessful',
          details: visionError.message
        });
      }
    } else {
      return jsonResponse(400, { error: 'Unsupported file type' });
    }

    await persistExtractedText(
      supabase,
      claim_id,
      storage_path,
      result.text,
      result.extraction_method
    );

    return jsonResponse(200, result);
  } catch (error) {
    console.error('Text extraction error:', error);
    return jsonResponse(500, { error: error.message });
  }
};
