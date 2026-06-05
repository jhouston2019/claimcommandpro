/**
 * COMPREHENSIVE PIPELINE INTEGRATION TEST
 * Tests intelligence engines used by ai-estimate-comparison (ERP parity layer)
 */

const LossExpectationEngine = require('../netlify/functions/lib/loss-expectation-engine');
const TradeCompletenessEngine = require('../netlify/functions/lib/trade-completeness-engine');
const CodeUpgradeEngine = require('../netlify/functions/lib/code-upgrade-engine');
const LaborRateValidator = require('../netlify/functions/lib/labor-rate-validator');

const WATER_DAMAGE_LINE_ITEMS = [
  { description: 'Drying equipment - 3 days', quantity: 3, unit: 'DAY', unit_price: 150, total: 450, category: 'Cleaning' },
  { description: 'Demolition - remove wet drywall', quantity: 500, unit: 'SF', unit_price: 1.50, total: 750, category: 'Demolition' },
  { description: 'Drywall replacement', quantity: 500, unit: 'SF', unit_price: 3.00, total: 1500, category: 'Drywall' },
  { description: 'Paint interior walls', quantity: 500, unit: 'SF', unit_price: 2.50, total: 1250, category: 'Painting' },
  { description: 'Carpet replacement', quantity: 200, unit: 'SF', unit_price: 6.00, total: 1200, category: 'Flooring' },
  { description: 'Labor - drywall installation', quantity: 16, unit: 'HR', unit_price: 45, total: 720, category: 'Drywall' }
];

const FIRE_DAMAGE_LINE_ITEMS = [
  { description: 'Smoke cleaning', quantity: 1000, unit: 'SF', unit_price: 2.00, total: 2000, category: 'Cleaning' },
  { description: 'Demolition - fire damaged materials', quantity: 800, unit: 'SF', unit_price: 2.00, total: 1600, category: 'Demolition' },
  { description: 'Framing - structural repair', quantity: 200, unit: 'LF', unit_price: 15.00, total: 3000, category: 'Framing' },
  { description: 'Drywall replacement', quantity: 800, unit: 'SF', unit_price: 3.00, total: 2400, category: 'Drywall' },
  { description: 'Paint - complete interior', quantity: 800, unit: 'SF', unit_price: 2.50, total: 2000, category: 'Painting' },
  { description: 'Electrical repair', quantity: 12, unit: 'HR', unit_price: 85, total: 1020, category: 'Electrical' },
  { description: 'Flooring replacement', quantity: 400, unit: 'SF', unit_price: 8.00, total: 3200, category: 'Flooring' }
];

const WIND_DAMAGE_LINE_ITEMS = [
  { description: 'Roofing - shingle replacement', quantity: 25, unit: 'SQ', unit_price: 350, total: 8750, category: 'Roofing' },
  { description: 'Tear off old shingles', quantity: 25, unit: 'SQ', unit_price: 75, total: 1875, category: 'Roofing' },
  { description: 'Gutter replacement', quantity: 100, unit: 'LF', unit_price: 12, total: 1200, category: 'Roofing' },
  { description: 'Siding repair', quantity: 200, unit: 'SF', unit_price: 8, total: 1600, category: 'Siding' },
  { description: 'Window replacement', quantity: 2, unit: 'EA', unit_price: 550, total: 1100, category: 'Windows' }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertOneOf(value, options, message) {
  if (!options.includes(value)) {
    throw new Error(`${message}: got "${value}", expected one of [${options.join(', ')}]`);
  }
}

async function testWaterDamagePipeline() {
  console.log('\n========================================');
  console.log('TEST 1: WATER DAMAGE - FULL PIPELINE');
  console.log('========================================\n');

  const totalCost = WATER_DAMAGE_LINE_ITEMS.reduce((sum, item) => sum + item.total, 0);

  const lossExpectation = LossExpectationEngine.analyzeLossExpectation({
    lineItems: WATER_DAMAGE_LINE_ITEMS,
    totalCost,
    metadata: {}
  });

  console.log(`  Loss Type: ${lossExpectation.lossType}`);
  console.log(`  Severity: ${lossExpectation.severity}`);
  assert(lossExpectation.success, 'Water loss expectation should succeed');
  assert(lossExpectation.lossType === 'WATER', 'Expected WATER loss type');
  assertOneOf(lossExpectation.severity, ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'CATEGORY_3'], 'Water severity');

  const tradeCompleteness = TradeCompletenessEngine.analyzeTradeCompleteness({
    lineItems: WATER_DAMAGE_LINE_ITEMS,
    metadata: {}
  });
  assert(tradeCompleteness.success, 'Trade completeness should succeed');
  assert(tradeCompleteness.integrityScore > 0 && tradeCompleteness.integrityScore <= 100, 'Integrity score range');

  const codeUpgrades = CodeUpgradeEngine.analyzeCodeUpgrades({
    lineItems: WATER_DAMAGE_LINE_ITEMS,
    reconciliation: {},
    exposure: {},
    propertyMetadata: {},
    regionalData: {}
  });
  assert(Array.isArray(codeUpgrades.codeUpgradeFlags), 'Code upgrade flags should be array');

  const laborAnalysis = await LaborRateValidator.validateLaborRates({
    lineItems: WATER_DAMAGE_LINE_ITEMS,
    region: 'CA-San Francisco',
    metadata: {}
  });
  assert(laborAnalysis.success, 'Labor validation should succeed');
  assert(laborAnalysis.laborScore >= 0 && laborAnalysis.laborScore <= 100, 'Labor score range');

  console.log('\n✅ Water Damage Test PASSED\n');
}

async function testFireDamagePipeline() {
  console.log('\n========================================');
  console.log('TEST 2: FIRE DAMAGE - FULL PIPELINE');
  console.log('========================================\n');

  const totalCost = FIRE_DAMAGE_LINE_ITEMS.reduce((sum, item) => sum + item.total, 0);
  const lossExpectation = LossExpectationEngine.analyzeLossExpectation({
    lineItems: FIRE_DAMAGE_LINE_ITEMS,
    totalCost,
    metadata: {}
  });

  assert(lossExpectation.success, 'Fire loss expectation should succeed');
  assert(lossExpectation.lossType === 'FIRE', 'Expected FIRE loss type');
  assertOneOf(lossExpectation.severity, ['LIGHT', 'MODERATE', 'HEAVY'], 'Fire severity');

  const tradeCompleteness = TradeCompletenessEngine.analyzeTradeCompleteness({
    lineItems: FIRE_DAMAGE_LINE_ITEMS,
    metadata: {}
  });
  assert(tradeCompleteness.success, 'Fire trade completeness should succeed');

  console.log('\n✅ Fire Damage Test PASSED\n');
}

async function testWindDamagePipeline() {
  console.log('\n========================================');
  console.log('TEST 3: WIND DAMAGE - FULL PIPELINE');
  console.log('========================================\n');

  const totalCost = WIND_DAMAGE_LINE_ITEMS.reduce((sum, item) => sum + item.total, 0);
  const lossExpectation = LossExpectationEngine.analyzeLossExpectation({
    lineItems: WIND_DAMAGE_LINE_ITEMS,
    totalCost,
    metadata: {}
  });

  assert(lossExpectation.success, 'Wind loss expectation should succeed');
  assert(lossExpectation.lossType === 'WIND', 'Expected WIND loss type');
  assertOneOf(lossExpectation.severity, ['MINOR', 'MAJOR'], 'Wind severity');

  const tradeCompleteness = TradeCompletenessEngine.analyzeTradeCompleteness({
    lineItems: WIND_DAMAGE_LINE_ITEMS,
    metadata: {}
  });
  assert(tradeCompleteness.success, 'Wind trade completeness should succeed');

  console.log('\n✅ Wind Damage Test PASSED\n');
}

async function testLaborRateRegions() {
  console.log('\n========================================');
  console.log('TEST 4: LABOR RATE VALIDATION - REGIONS');
  console.log('========================================\n');

  const laborItems = [
    { description: 'Electrician labor', quantity: 8, unit: 'HR', unit_price: 45, total: 360, category: 'Electrical' },
    { description: 'Plumber labor', quantity: 6, unit: 'HR', unit_price: 50, total: 300, category: 'Plumbing' },
    { description: 'Painter labor', quantity: 20, unit: 'HR', unit_price: 35, total: 700, category: 'Painting' }
  ];

  for (const region of ['CA-San Francisco', 'TX-Houston', 'NY-New York City', 'FL-Miami']) {
    const result = await LaborRateValidator.validateLaborRates({
      lineItems: laborItems,
      region,
      metadata: {}
    });
    assert(result.success, `Labor validation should succeed for ${region}`);
    console.log(`  ✓ ${region}: score ${result.laborScore}/100`);
  }

  console.log('\n✅ Multi-Region Test PASSED\n');
}

async function testEdgeCases() {
  console.log('\n========================================');
  console.log('TEST 5: EDGE CASES');
  console.log('========================================\n');

  const emptyResult = LossExpectationEngine.analyzeLossExpectation({
    lineItems: [],
    totalCost: 0,
    metadata: {}
  });
  assert(!emptyResult.success, 'Empty line items should fail');
  console.log('  ✓ Empty input handled correctly');

  console.log('\n✅ Edge Cases Test PASSED\n');
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  COMPREHENSIVE PIPELINE INTEGRATION TEST SUITE                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  await testWaterDamagePipeline();
  await testFireDamagePipeline();
  await testWindDamagePipeline();
  await testLaborRateRegions();
  await testEdgeCases();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  ALL TESTS PASSED ✅                                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  return true;
}

if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n❌ TEST FAILED:', error.message);
      process.exit(1);
    });
}

module.exports = {
  WATER_DAMAGE_LINE_ITEMS,
  FIRE_DAMAGE_LINE_ITEMS,
  WIND_DAMAGE_LINE_ITEMS,
  runAllTests
};
