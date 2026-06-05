/**
 * RECON_VS_CARRIER mode — analyze-estimates-v2 unit tests
 */

const fs = require('fs');
const path = require('path');
const {
  resolveCompareMode,
  buildReconRows,
  buildReconApiResult
} = require('../netlify/functions/analyze-estimates-v2');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  RECON_VS_CARRIER — MODE RESOLUTION & FALLBACK TEST             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  assert(resolveCompareMode(null) === 'RECON_VS_CARRIER', 'null contractor → RECON');
  assert(resolveCompareMode('') === 'RECON_VS_CARRIER', 'empty contractor → RECON');
  assert(resolveCompareMode('   ') === 'RECON_VS_CARRIER', 'whitespace contractor → RECON');
  assert(resolveCompareMode('$47,250') === 'RECON_VS_CARRIER', 'short total only → RECON');
  assert(resolveCompareMode('ABC Roofing Inc.\nLicense #GA-4421') === 'RECON_VS_CARRIER', 'header only → RECON');
  const substantive = 'CONTRACTOR ESTIMATE\n'.padEnd(101, 'x');
  assert(resolveCompareMode(substantive) === 'LINE_COMPARE', 'substantive contractor text → LINE_COMPARE');
  console.log('✓ resolveCompareMode');

  const carrierText = fs.readFileSync(
    path.join(__dirname, 'fixtures/sample-carrier-estimate.txt'),
    'utf8'
  );
  const fallback = buildReconRows(carrierText);
  assert(fallback.mode === 'RECON_VS_CARRIER', 'fallback mode');
  assert(fallback.lineItems.length > 0, 'fallback should parse carrier dollar lines');
  assert(fallback.totalDelta === 0, 'fallback delta is zero');
  assert(
    fallback.lineItems.every((r) => r.contractorAmount === r.carrierAmount),
    'fallback mirrors carrier amounts'
  );
  console.log('✓ buildReconRows fallback:', fallback.lineItems.length, 'rows');

  const api = buildReconApiResult(fallback, 'fallback', { carrier_extraction_method: 'pdf_parse' });
  assert(api.compare_mode === 'RECON_VS_CARRIER', 'api compare_mode');
  assert(api.recon_path === 'fallback', 'api recon_path');
  assert(api.contractor_extraction_method === null, 'no contractor extraction in RECON');
  assert(api.carrier_extraction_method === 'pdf_parse', 'carrier extraction passthrough');
  assert(api.line_items.length === fallback.lineItems.length, 'line_items mapped');
  console.log('✓ buildReconApiResult shape');

  console.log('\n✅ ALL RECON_VS_CARRIER TESTS PASSED\n');
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
