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
            content: `You are an expert insurance policyholder rights attorney with deep knowledge of settlement release contract law, bad faith insurance litigation, the NAIC Model Act, and policyholder bill of rights statutes across all 50 states.

You identify release language that systematically strips policyholders of future rights — broad unknown claims waivers, bad faith releases, confidentiality clauses preventing regulatory complaints, and absent carve-outs for depreciation recovery and supplemental claims.

Return only valid JSON. overall_verdict must be exactly "danger", "caution", or "safe". risk_level must be an integer 1-10. No prose outside the JSON.`
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
  "overall_verdict": "danger",
  "recommendation": "do_not_sign",
  "summary": "Release contains a broad unknown claims waiver and bad faith release — signing eliminates your right to pursue additional damages discovered after settlement and any bad faith claim against the carrier.",
  "risk_level": 9,
  "problematic_clauses": [
    {
      "severity": "critical",
      "clause_text": "Claimant releases all claims, known and unknown, arising from or related to the loss",
      "issue": "Waives rights to future claims for damage discovered after signing — including hidden damage and consequential losses not yet assessed",
      "recommendation": "Replace with language limiting release to specific line items listed in Exhibit A of the settlement agreement"
    },
    {
      "severity": "high",
      "clause_text": "Claimant releases insurer from any and all claims including extracontractual damages",
      "issue": "Waives bad faith claim before any bad faith liability has been established — insurer benefits from their own delay or underpayment",
      "recommendation": "Remove extracontractual damages waiver or limit to claims arising from this specific settlement negotiation only"
    }
  ],
  "red_flags": [
    "Broad unknown claims waiver eliminates supplemental claim rights",
    "Bad faith waiver present before full claim resolution",
    "No carve-out preserving depreciation recovery after repairs"
  ],
  "missing_protections": [
    "No carve-out for supplemental claims on newly discovered damage",
    "No preservation of RCV depreciation holdback rights",
    "No limitation of release to specific settlement line items"
  ],
  "suggested_revisions": [
    {
      "original": "Claimant releases all claims, known and unknown, arising from or related to the loss",
      "revised": "Claimant releases only those claims specifically identified in Exhibit A attached to this settlement agreement"
    },
    {
      "original": "Claimant releases insurer from any and all claims including extracontractual damages",
      "revised": "This release does not waive any claims for bad faith, statutory penalties, or extracontractual damages"
    }
  ],
  "acceptable_clauses": [
    {
      "clause_text": "Settlement amount of $25,000",
      "explanation": "Specific dollar amount is clearly stated and limits scope of payment obligation"
    }
  ],
  "next_steps": [
    "Return release unsigned with marked revisions within 10 business days",
    "Request itemized list of all claims being released",
    "Consult attorney before signing any modified release"
  ],
  "action_items": [
    "Document all release concerns in writing to the adjuster",
    "Preserve all claim file documentation in case of future bad faith action"
  ]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      releaseAnalysis = JSON.parse(completion.choices[0].message.content);

      // Add metadata for display
      releaseAnalysis.document_header = {
        brand: 'Claim Command Pro',
        claim_number: claim_id,
        generated_date: new Date().toISOString(),
        document_type: 'Release Form Analysis'
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
