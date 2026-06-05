/**
 * Estimate Comparison Engine — LINE_COMPARE integration test
 */

const fs = require('fs');
const path = require('path');
const {
  compareEstimates,
  shouldUseDeterministicResult
} = require('../netlify/functions/lib/estimate-comparison-engine');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  ESTIMATE COMPARISON ENGINE — LINE_COMPARE TEST                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const contractorText = fs.readFileSync(
    path.join(__dirname, 'fixtures/sample-contractor-estimate.txt'),
    'utf8'
  );
  const carrierText = fs.readFileSync(
    path.join(__dirname, 'fixtures/sample-carrier-estimate.txt'),
    'utf8'
  );

  const result = compareEstimates({
    contractorText,
    carrierText,
    claimType: 'property-claim'
  });

  console.log('Analysis method:', result.analysis_method);
  console.log('Contractor total:', result.contractor_total);
  console.log('Carrier total:', result.carrier_total);
  console.log('Gap:', result.gap_amount);
  console.log('Line items:', result.line_items.length);
  console.log('Gap categories:', result.gap_categories.length);

  assert(result.analysis_method === 'deterministic', 'Expected deterministic analysis');
  assert(shouldUseDeterministicResult(result), 'Deterministic result should pass quality gate');
  assert(result.line_items.length >= 5, `Expected >= 5 comparison rows, got ${result.line_items.length}`);
  assert(result.contractor_total > 5000, 'Contractor total should be parsed');
  assert(result.carrier_total > 3500, 'Carrier total should be parsed');
  assert(result.gap_amount > 1000, 'Gap should be material');
  assert(result.gap_categories.length >= 1, 'Gap categories should be populated');
  assert(result.exposure != null, 'Financial exposure should be calculated');
  assert(result.reconciliation.stats != null, 'Reconciliation stats required');

  const missing = result.line_items.filter((r) => r.status === 'Missing from Carrier');
  const undervalued = result.line_items.filter((r) => r.status === 'Undervalued');
  console.log('Missing from carrier:', missing.length);
  console.log('Undervalued:', undervalued.length);

  assert(missing.length + undervalued.length >= 1, 'Should detect at least one discrepancy');

  console.log('\n✅ ALL COMPARISON ENGINE TESTS PASSED\n');
  return true;
}

if (require.main === module) {
  try {
    runTests();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runTests };
