/**
 * Netlify Function: analyze-release
 * Analyzes release documents to identify problematic clauses
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const { buildReleaseAnalysisPrompt } = require('./lib/ai-prompts');

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
    const { claim_id, release_pdf_url, document_id } = JSON.parse(event.body);

    if (!claim_id || !release_pdf_url) {
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

    // Fetch claim data for context
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claim_id)
      .single();

    if (claimError) {
      console.warn('Claim data not found:', claimError);
    }

    // Download and parse release PDF
    let releaseText;
    try {
      const response = await fetch(release_pdf_url);
      if (!response.ok) {
        throw new Error('Failed to download release PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      releaseText = pdfData.text;

      if (!releaseText || releaseText.trim().length < 100) {
        throw new Error('Release PDF appears to be empty or unreadable');
      }
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: { message: 'Failed to parse release PDF: ' + pdfError.message }
        })
      };
    }

    // Build AI prompt using library function
    const prompt = buildReleaseAnalysisPrompt(releaseText);

    let releaseAnalysis;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance attorney specializing in settlement releases with deep knowledge of contract law, bad faith claims, and policyholder rights. You protect policyholders from signing away important rights. Before analyzing, consider: 1) Does this release waive future claims or unknown damages? 2) Are there overly broad indemnification clauses? 3) Does it release bad faith claims? 4) Are there confidentiality provisions that prevent legal action? Return only valid JSON with no additional text.'
          },
          {
            role: 'user',
            content: `Example release review:
Release contains: "Policyholder releases all claims, known and unknown, arising from or related to the property damage and any bad faith claims."
Settlement amount: $25,000`
          },
          {
            role: 'assistant',
            content: `{
  "problematic_clauses": [
    {
      "clause": "releases all claims, known and unknown",
      "issue": "Waives right to future claims for hidden damage",
      "severity": "critical",
      "explanation": "This prevents you from making additional claims if hidden damage is discovered after signing, even if caused by the same loss event",
      "suggested_revision": "Limit release to 'all claims related to the specific line items listed in the settlement agreement dated [date]'"
    },
    {
      "clause": "any bad faith claims",
      "issue": "Waives right to sue for bad faith handling",
      "severity": "critical",
      "explanation": "Even if the insurer acted in bad faith during the claim process, you cannot pursue statutory penalties or damages",
      "suggested_revision": "Remove bad faith waiver entirely or limit to 'claims related solely to the valuation of the specific damages listed'"
    }
  ],
  "acceptable_clauses": [],
  "overall_verdict": "DO NOT SIGN - Critical issues present",
  "risk_level": "high",
  "recommendations": [
    "Demand removal of 'unknown claims' language",
    "Refuse to waive bad faith claims",
    "Request itemized list of what is being released",
    "Consider attorney review before signing"
  ]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      releaseAnalysis = JSON.parse(completion.choices[0].message.content);
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: { message: 'AI analysis failed: ' + aiError.message }
        })
      };
    }

    // Store analysis output
    const { error: outputError } = await supabase
      .from('claim_outputs')
      .insert({
        claim_id,
        step_number: 18,
        output_type: 'release_analysis',
        output_json: releaseAnalysis,
        ai_model: 'gpt-4o'
      });

    if (outputError) {
      console.warn('Failed to store output:', outputError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: releaseAnalysis
      })
    };

  } catch (error) {
    console.error('Release analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: { message: error.message || 'Release analysis failed' }
      })
    };
  }
};
