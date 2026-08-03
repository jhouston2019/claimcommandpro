/**
 * Netlify Function: analyze-settlement
 * Analyzes settlement letters to break down RCV, ACV, and depreciation
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { buildSettlementAnalysisPrompt } = require('./lib/ai-prompts');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: { message: 'Method not allowed' } })
    };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: { message: 'Unauthorized' } })
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { claim_id, settlement_pdf_url, document_id } = JSON.parse(event.body);

    if (!claim_id || !settlement_pdf_url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: { message: 'Missing required fields' } })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // Download and parse settlement PDF
    let settlementText;
    try {
      const response = await fetch(settlement_pdf_url);
      if (!response.ok) {
        throw new Error('Failed to download settlement PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      settlementText = pdfData.text;

      if (!settlementText || settlementText.trim().length < 100) {
        throw new Error('Settlement PDF appears to be empty or unreadable');
      }
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: { message: 'Failed to parse settlement PDF: ' + pdfError.message }
        })
      };
    }

    // Fetch estimate data for comparison
    const { data: estimateData, error: estError } = await supabase
      .from('claim_financial_summary')
      .select('contractor_estimate_total, carrier_estimate_total')
      .eq('claim_id', claim_id)
      .single();

    // Build AI prompt using library function
    const prompt = buildSettlementAnalysisPrompt(settlementText, estimateData || {});

    let settlementAnalysis;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a senior property insurance claim analyst with expert knowledge of ISO HO-3 policy forms, RCV/ACV settlement mechanics, depreciation schedules under industry standard useful-life tables, the NAIC Model Unfair Claims Settlement Practices Act, and state prompt payment statutes across all 50 jurisdictions.

You identify underpayment patterns that insurers systematically apply: labor depreciation (improper in most states), O&P omission on multi-trade claims, matching clause violations, code upgrade exclusions, and depreciation rates that exceed industry standards for the material type.

Return only valid JSON. No prose, no markdown, no explanation outside the JSON structure.`
          },
          {
            role: 'user',
            content: `Example settlement analysis:
Settlement letter shows: RCV $28,000, Depreciation $8,200, ACV $19,800, Deductible $2,500, Net payment $17,300
Contractor estimate: $36,750
Policy: HO3 with RCV coverage`
          },
          {
            role: 'assistant',
            content: `{
  "rcv_total": 45000,
  "acv_paid": 32000,
  "depreciation_withheld": 9800,
  "deductible": 2500,
  "net_payment": 29500,
  "breakdown": [
    { "category": "Structure", "rcv": 38000, "acv": 27000, "depreciation": 8500 },
    { "category": "Contents", "rcv": 5000, "acv": 3800, "depreciation": 1200 },
    { "category": "ALE", "rcv": 2000, "acv": 1200, "depreciation": 100 }
  ],
  "issues": [
    "Labor depreciation of $3,200 applied — improper under standard policy language",
    "Overhead and profit ($7,500) omitted — required when general contractor coordinates 3+ trades",
    "Roofing depreciation rate of 60% applied to 12-year-old roof — exceeds standard for 25-year shingles"
  ],
  "recommendation": "Reject offer and submit supplement request citing O&P omission and improper labor depreciation — documented gap is $13,000",
  "next_steps": [
    "Submit supplement request within 10 business days citing O&P and labor depreciation",
    "Obtain second contractor estimate documenting O&P requirement",
    "After repairs complete, submit proof to recover $9,800 depreciation holdback"
  ],
  "document_header": {
    "claim_number": "CLM-2024-08456",
    "document_type": "Settlement Analysis",
    "generated_date": "2026-07-20T10:00:00Z"
  }
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      settlementAnalysis = JSON.parse(completion.choices[0].message.content);

      // Add metadata for display
      settlementAnalysis.document_header = {
        brand: 'Claim Command Pro',
        claim_number: claim_id,
        generated_date: new Date().toISOString(),
        document_type: 'Settlement Analysis'
      };

    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: { message: 'AI analysis failed: ' + aiError.message }
        })
      };
    }

    // Update financial summary
    const { error: updateError } = await supabase
      .from('claim_financial_summary')
      .upsert({
        claim_id,
        rcv_total: settlementAnalysis.rcv_total,
        acv_paid: settlementAnalysis.acv_paid,
        depreciation_withheld: settlementAnalysis.depreciation_withheld,
        deductible: settlementAnalysis.deductible,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.warn('Failed to update financial summary:', updateError);
    }

    // Store analysis output
    const { error: outputError } = await supabase
      .from('claim_outputs')
      .insert({
        claim_id,
        step_number: 16,
        output_type: 'settlement_analysis',
        output_json: settlementAnalysis,
        ai_model: 'gpt-4o'
      });

    if (outputError) {
      console.warn('Failed to store output:', outputError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: settlementAnalysis
      })
    };

  } catch (error) {
    console.error('Settlement analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Settlement analysis failed' }
      })
    };
  }
};
