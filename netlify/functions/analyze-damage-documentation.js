/**
 * Damage Documentation Analysis Function
 * AI-powered analysis of damage photos and documentation quality
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.split(' ')[1];
    const {
      claim_number,
      damage_area,
      damage_type,
      damage_description,
      photos
    } = JSON.parse(event.body);

    if (!damage_area || !damage_type || !damage_description || !photos || photos.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Find claim if claim_number provided
    let claim = null;
    if (claim_number) {
      const { data: claimData } = await supabase
        .from('claims')
        .select('id')
        .eq('claim_number', claim_number)
        .eq('user_id', user.id)
        .single();
      claim = claimData;
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Analyze documentation quality using AI
    const prompt = `Analyze this damage documentation for an insurance claim:

DAMAGE INFO:
- Area/Room: ${damage_area}
- Type: ${damage_type}
- Description: ${damage_description}
- Number of Photos: ${photos.length}
- Photo Names: ${photos.map(p => p.name).join(', ')}

Based on the description and number of photos, evaluate the documentation quality and provide guidance in JSON format:
{
  "overall_quality_score": number (0-100),
  "quality_assessment": "string - comprehensive assessment of documentation quality",
  "strengths": [
    "string - specific aspects that were documented well"
  ],
  "gaps": [
    "string - specific missing or weak documentation"
  ],
  "recommendations": [
    "string - specific actionable recommendations to improve documentation"
  ],
  "additional_photos_needed": [
    "string - specific photos that should be taken"
  ],
  "documentation_checklist": [
    {
      "item": "string - documentation requirement",
      "status": "complete|incomplete|partial",
      "importance": "critical|important|helpful",
      "guidance": "string - how to complete this item"
    }
  ],
  "claim_strength_impact": "string - how this documentation affects claim strength"
}

Consider best practices:
- Multiple angles (wide, medium, close-up)
- Scale references
- Serial/model numbers
- Context and surrounding areas
- Before cleanup documentation
- Lighting and clarity`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert insurance claims adjuster and documentation specialist with 25+ years of experience. Evaluate damage documentation quality and provide actionable guidance to strengthen claims. Before scoring, consider: 1) Are multiple angles captured? 2) Is scale/context visible? 3) Are serial numbers documented? 4) Is the full scope visible? 5) Would this withstand adjuster scrutiny? Focus on what makes documentation compelling and legally defensible. Return only valid JSON with no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const documentationAnalysis = JSON.parse(completion.choices[0].message.content);

    // Add metadata for display
    documentationAnalysis.document_header = {
      brand: 'Claim Command Pro',
      claim_id: claim_id,
      generated_date: new Date().toISOString(),
      document_type: 'Damage Documentation Analysis'
    };

    // Store photos in Supabase Storage
    const uploadedUrls = [];
    if (claim) {
      for (const photo of photos) {
        const fileName = `${claim.id}/damage-photos/${damage_area.replace(/\s+/g, '_')}/${Date.now()}-${photo.name}`;
        const fileBuffer = Buffer.from(photo.data, 'base64');

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('claim-documents')
          .upload(fileName, fileBuffer, {
            contentType: photo.type,
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('claim-documents')
            .getPublicUrl(fileName);
          
          uploadedUrls.push({
            name: photo.name,
            url: urlData.publicUrl
          });
        }
      }

      // Store analysis
      await supabase
        .from('claim_outputs')
        .insert({
          claim_id: claim.id,
          output_type: 'damage_documentation_analysis',
          step_number: 4,
          output_json: {
            ...documentationAnalysis,
            damage_area,
            damage_type,
            photos: uploadedUrls
          },
          created_at: new Date().toISOString()
        });
    }

    return documentationAnalysis;

  } catch (error) {
    console.error('Damage documentation analysis error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: { message: error.message || 'Documentation analysis failed' }
      })
    };
  }
};
