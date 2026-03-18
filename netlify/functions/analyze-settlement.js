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
            content: 'You are an expert insurance settlement analyst with expertise in RCV/ACV calculations, depreciation schedules, and settlement negotiations. Analyze settlement offers to identify underpayments, improper depreciation, and missing items. Before providing your analysis, consider: 1) Is depreciation properly applied given the coverage type? 2) Are all line items from the contractor estimate addressed? 3) Is the deductible correctly calculated? 4) Are there any red flags or concerning patterns? Return only valid JSON with no additional text.'
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
  "rcv_total": 28000,
  "acv_paid": 19800,
  "depreciation_withheld": 8200,
  "deductible": 2500,
  "net_payment": 17300,
  "issues": [
    {
      "issue": "Settlement significantly below contractor estimate",
      "impact": "Underpayment of $8,750 ($36,750 contractor vs $28,000 RCV)",
      "severity": "high"
    },
    {
      "issue": "Depreciation applied to RCV policy",
      "impact": "Improper withholding of $8,200 - RCV policies should pay full replacement cost upon completion",
      "severity": "critical"
    }
  ],
  "missing_items": [
    "Ridge vent installation",
    "Fascia board replacement",
    "Code upgrade costs"
  ],
  "recommendations": [
    "Demand full RCV payment of contractor estimate ($36,750)",
    "Challenge improper depreciation withholding",
    "Submit supplement for missing line items",
    "Request itemized breakdown of how $28,000 RCV was calculated"
  ]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      settlementAnalysis = JSON.parse(completion.choices[0].message.content);
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
