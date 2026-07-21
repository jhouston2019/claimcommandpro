const { extractUserIdFromToken, validateClaimAccess } = require('./utils/claim-access-control.js');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

const SYSTEM_MESSAGE =
  'You are an expert insurance claim estimator. Compare the insurance company estimate against the contractor estimate and identify all discrepancies, missing items, and undervalued line items.';

function buildUserMessage(insuranceText, contractorText) {
  return `Compare these two estimates and provide a detailed analysis:

INSURANCE COMPANY ESTIMATE:
${insuranceText.substring(0, 25000)}

CONTRACTOR ESTIMATE:
${contractorText.substring(0, 25000)}

Provide your analysis in the following format:

1. FINANCIAL SUMMARY
   - Insurance Total: $X,XXX
   - Contractor Total: $X,XXX
   - Gap Amount: $X,XXX
   - Percentage Difference: X%

2. MISSING ITEMS (items in contractor estimate but not in insurance estimate)
   List each missing item with:
   - Item description
   - Contractor price
   - Why it's necessary

3. QUANTITY DISCREPANCIES (different quantities for same item)
   List each discrepancy with:
   - Item description
   - Insurance quantity vs Contractor quantity
   - Price impact

4. PRICING DIFFERENCES (same item, different unit prices)
   List each difference with:
   - Item description
   - Insurance price vs Contractor price
   - Market rate assessment

5. SCOPE ISSUES
   - Work that should be included but isn't
   - Code compliance requirements
   - Overhead & profit considerations

6. RECOMMENDATIONS
   - Priority items to dispute
   - Documentation needed
   - Negotiation strategy

Be specific with dollar amounts and line item references.`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({
          success: false,
          error: 'claimId, insuranceText, and contractorText are required'
        })
      };
    }

    const { claimId, insuranceText, contractorText } = body;

    if (
      !claimId ||
      !insuranceText ||
      !contractorText ||
      String(claimId).trim() === '' ||
      String(insuranceText).trim() === '' ||
      String(contractorText).trim() === ''
    ) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({
          success: false,
          error: 'claimId, insuranceText, and contractorText are required'
        })
      };
    }

    const userId = extractUserIdFromToken(event);
    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }

    const accessResult = await validateClaimAccess(userId, claimId);
    if (!accessResult.hasAccess) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({ success: false, error: accessResult.error })
      };
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_MESSAGE },
          { role: 'user', content: buildUserMessage(insuranceText, contractorText) }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!openaiResponse.ok) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: JSON.stringify({
          success: false,
          error: 'Analysis service unavailable'
        })
      };
    }

    const openaiData = await openaiResponse.json();
    const analysis = openaiData.choices[0].message.content;

    const gapMatch = analysis.match(/Gap Amount:\s*\$?([\d,]+)/i);
    const gapAmount = gapMatch ? gapMatch[1] : '0';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: { analysis, gapAmount }
      })
    };
  } catch (error) {
    console.error('compare-estimates-browser error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};
