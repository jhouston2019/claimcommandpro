/**
 * PDF PARSING INFRASTRUCTURE
 * 
 * Extracts text, metadata, and structured data from PDF documents
 * Used for policy analysis, estimate parsing, and legal document review
 */

const pdfParse = require('pdf-parse');

/**
 * Extract text from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed PDF data
 */
async function parsePDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    
    return {
      success: true,
      text: data.text,
      pages: data.numpages,
      metadata: data.info,
      version: data.version
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract policy-specific sections from PDF text
 * @param {string} text - Full PDF text
 * @returns {Object} Structured policy sections
 */
function extractPolicySections(text) {
  const sections = {
    declarations: '',
    coverage: '',
    exclusions: '',
    conditions: '',
    endorsements: '',
    definitions: ''
  };

  const patterns = {
    declarations: /DECLARATIONS?\s+PAGE/i,
    coverage: /COVERAGE[S]?\s+(A|B|C|D|E|F)?/i,
    exclusions: /EXCLUSIONS?/i,
    conditions: /CONDITIONS?/i,
    endorsements: /ENDORSEMENTS?/i,
    definitions: /DEFINITIONS?/i
  };

  const lines = text.split('\n');
  let currentSection = null;
  let sectionContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    for (const [section, pattern] of Object.entries(patterns)) {
      if (pattern.test(line)) {
        if (currentSection && sectionContent.length > 0) {
          sections[currentSection] = sectionContent.join('\n');
        }
        currentSection = section;
        sectionContent = [line];
        break;
      }
    }
    
    if (currentSection && !Object.values(patterns).some(p => p.test(line))) {
      sectionContent.push(line);
    }
  }

  if (currentSection && sectionContent.length > 0) {
    sections[currentSection] = sectionContent.join('\n');
  }

  return sections;
}

/**
 * Extract estimate line items from PDF text
 * @param {string} text - Full PDF text
 * @returns {Array} Parsed line items
 */
function extractEstimateLineItems(text) {
  const lineItems = [];
  const lines = text.split('\n');
  
  const itemPattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s+([A-Z]{2,})\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)$/;
  
  for (const line of lines) {
    const match = line.trim().match(itemPattern);
    if (match) {
      lineItems.push({
        description: match[1].trim(),
        quantity: parseFloat(match[2]),
        unit: match[3],
        unitPrice: parseFloat(match[4].replace(/,/g, '')),
        totalPrice: parseFloat(match[5].replace(/,/g, ''))
      });
    }
  }
  
  return lineItems;
}

/**
 * Extract coverage limits from policy text
 * @param {string} text - Policy text
 * @returns {Object} Coverage limits
 */
function extractCoverageLimits(text) {
  const limits = {};
  
  const limitPatterns = [
    { key: 'dwelling', pattern: /COVERAGE A.*?DWELLING.*?\$?([\d,]+)/i },
    { key: 'other_structures', pattern: /COVERAGE B.*?OTHER STRUCTURES.*?\$?([\d,]+)/i },
    { key: 'personal_property', pattern: /COVERAGE C.*?PERSONAL PROPERTY.*?\$?([\d,]+)/i },
    { key: 'loss_of_use', pattern: /COVERAGE D.*?LOSS OF USE.*?\$?([\d,]+)/i },
    { key: 'liability', pattern: /COVERAGE E.*?LIABILITY.*?\$?([\d,]+)/i },
    { key: 'medical', pattern: /COVERAGE F.*?MEDICAL.*?\$?([\d,]+)/i },
    { key: 'deductible', pattern: /DEDUCTIBLE.*?\$?([\d,]+)/i },
    { key: 'aop_deductible', pattern: /ALL OTHER PERILS.*?DEDUCTIBLE.*?\$?([\d,]+)/i },
    { key: 'wind_hail_deductible', pattern: /WIND.*?HAIL.*?DEDUCTIBLE.*?([\d.]+)%/i }
  ];

  for (const { key, pattern } of limitPatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1].replace(/,/g, '');
      limits[key] = value.includes('%') ? value : parseFloat(value);
    }
  }

  return limits;
}

module.exports = {
  parsePDF,
  extractPolicySections,
  extractEstimateLineItems,
  extractCoverageLimits
};
