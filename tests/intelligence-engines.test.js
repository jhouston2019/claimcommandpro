/**
 * INTELLIGENCE ENGINES TEST SUITE
 * 
 * Comprehensive tests for all expert intelligence databases and engines
 */

const assert = require('assert');

// Import all intelligence engines
const policyIntelligence = require('../netlify/functions/lib/policy-intelligence-db');
const legalPrecedent = require('../netlify/functions/lib/legal-precedent-db');
const carrierTactics = require('../netlify/functions/lib/carrier-tactic-db');
const negotiationStrategy = require('../netlify/functions/lib/negotiation-strategy-db');
const damagePatterns = require('../netlify/functions/lib/damage-pattern-db');
const evidenceStandards = require('../netlify/functions/lib/evidence-standards-db');
const pricingValidation = require('../netlify/functions/lib/pricing-validation-engine');
const laborRateValidator = require('../netlify/functions/lib/labor-rate-validator');

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

(async function runAllTests() {
  console.log('🧪 INTELLIGENCE ENGINES TEST SUITE\n');

  // POLICY INTELLIGENCE ENGINE TESTS
  console.log('📋 POLICY INTELLIGENCE ENGINE');

  await test('Policy form HO-3 exists with correct structure', () => {
    const ho3 = policyIntelligence.STANDARD_POLICY_FORMS['HO-3'];
    assert(ho3, 'HO-3 form should exist');
    assert(ho3.name === 'Homeowners Special Form', 'HO-3 name should be correct');
    assert(ho3.coverage_basis.dwelling === 'open-peril', 'HO-3 dwelling should be open-peril');
    assert(ho3.common_exclusions.includes('Flood'), 'HO-3 should exclude flood');
  });

  await test('Coverage analysis for water damage returns valid structure', () => {
    const analysis = policyIntelligence.analyzeCoverageForDamage({}, 'water', 'HO-3');
    assert(analysis.damage_type === 'water', 'Should identify water damage type');
    assert(analysis.analysis, 'Should include analysis object');
    assert(analysis.analysis.covered_if, 'Should specify coverage conditions');
    assert(analysis.analysis.excluded_if, 'Should specify exclusion conditions');
  });

  await test('Coverage gap detection identifies water backup exclusion', () => {
    const gaps = policyIntelligence.detectCoverageGaps(
      { dwelling: 250000 },
      'HO-3',
      { damageType: 'water', waterSource: 'sewer', endorsements: [] }
    );
    assert(gaps.length > 0, 'Should detect at least one gap');
    const waterBackupGap = gaps.find(g => g.coverage === 'Water Backup');
    assert(waterBackupGap, 'Should detect water backup exclusion gap');
    assert(waterBackupGap.severity === 'critical', 'Water backup gap should be critical');
  });

  await test('Standard exclusions database contains detailed information', () => {
    const floodExclusion = policyIntelligence.STANDARD_EXCLUSIONS_DETAIL['Flood'];
    assert(floodExclusion, 'Flood exclusion should exist');
    assert(floodExclusion.language, 'Should include standard policy language');
    assert(floodExclusion.coverage_available, 'Should specify alternative coverage');
    assert(floodExclusion.common_disputes, 'Should list common disputes');
  });

  // LEGAL PRECEDENT ENGINE TESTS
  console.log('\n⚖️  LEGAL PRECEDENT ENGINE');

  await test('California legal standards exist with complete structure', () => {
    const caStandards = legalPrecedent.getLegalStandards('California');
    assert(caStandards, 'California standards should exist');
    assert(caStandards.state_code === 'CA', 'State code should be CA');
    assert(caStandards.claim_handling_deadlines, 'Should include deadlines');
    assert(caStandards.key_statutes.length > 0, 'Should include statutes');
    assert(caStandards.key_cases.length > 0, 'Should include case law');
  });

  await test('Bad faith analysis detects excessive delay', () => {
    const analysis = legalPrecedent.analyzeBadFaithPotential({
      days_since_acknowledgment: 30,
      days_since_claim: 120,
      lowball_offer: false,
      offer_percentage: 80,
      offer_amount: 80000,
      valuation: 100000,
      inadequate_investigation: false,
      investigation_deficiencies: [],
      denial_without_explanation: false
    }, 'California');
    
    assert(analysis.bad_faith_potential !== 'low', 'Should detect bad faith potential for 120-day delay');
    assert(analysis.triggers.length > 0, 'Should identify specific triggers');
    assert(analysis.recommended_actions.length > 0, 'Should provide recommendations');
  });

  await test('Bad faith analysis detects lowball offer', () => {
    const analysis = legalPrecedent.analyzeBadFaithPotential({
      days_since_acknowledgment: 10,
      days_since_claim: 30,
      lowball_offer: true,
      offer_percentage: 40,
      offer_amount: 40000,
      valuation: 100000,
      inadequate_investigation: false,
      investigation_deficiencies: [],
      denial_without_explanation: false
    }, 'Texas');
    
    assert(analysis.bad_faith_potential === 'high', 'Should detect high bad faith potential for 40% offer');
    const lowballTrigger = analysis.triggers.find(t => t.trigger.includes('Lowball'));
    assert(lowballTrigger, 'Should identify lowball trigger');
  });

  // CARRIER TACTIC ENGINE TESTS
  console.log('\n🎯 CARRIER TACTIC ENGINE');

  await test('Carrier tactics database contains delay tactics', () => {
    const delayTactics = carrierTactics.CARRIER_TACTICS['Delay Tactics'];
    assert(delayTactics.length > 0, 'Should have delay tactics');
    assert(delayTactics[0].tactic, 'Each tactic should have name');
    assert(delayTactics[0].countermeasure, 'Each tactic should have countermeasure');
    assert(delayTactics[0].severity, 'Each tactic should have severity');
  });

  await test('Carrier profile exists for State Farm', () => {
    const intel = carrierTactics.getCarrierIntelligence('State Farm');
    assert(intel.carrier === 'State Farm', 'Should identify carrier');
    assert(intel.profile, 'Should have profile');
    assert(intel.profile.claim_philosophy, 'Should include claim philosophy');
    assert(intel.profile.common_tactics, 'Should list common tactics');
  });

  await test('Tactic detection identifies slow-walking', () => {
    const detected = carrierTactics.detectCarrierTactics({
      events: [],
      days_since_claim: 90,
      offer_percentage: 70
    }, 'Allstate');
    
    assert(detected.detected_tactics.length > 0, 'Should detect tactics');
    const slowWalking = detected.detected_tactics.find(t => t.tactic.includes('Slow-Walking'));
    assert(slowWalking, 'Should detect slow-walking for 90-day delay');
  });

  // NEGOTIATION STRATEGY ENGINE TESTS
  console.log('\n💼 NEGOTIATION STRATEGY ENGINE');

  await test('Position analysis calculates strength correctly', () => {
    const analysis = negotiationStrategy.analyzeNegotiationPosition({
      coverage_clear: true,
      documentation_score: 85,
      independent_estimates: 3,
      expert_reports: 1,
      attorney_involved: true,
      pre_existing_conditions: false,
      causation_disputed: false,
      appraisal_available: true
    }, {
      bad_faith_conduct: false,
      statutory_violations: 0,
      delaying: false,
      amount_disputed: true,
      coverage_disputed: false
    }, 'California');
    
    assert(analysis.position_strength > 70, 'Strong position should score >70');
    assert(analysis.position_category.includes('Strong'), 'Should categorize as strong position');
    assert(analysis.strengths.length > 0, 'Should identify strengths');
  });

  await test('Optimal demand calculation provides reasonable multiplier', () => {
    const demand = negotiationStrategy.calculateOptimalDemand(100000, {
      position_strength: 80
    });
    
    assert(demand.actual_valuation === 100000, 'Should preserve actual valuation');
    assert(demand.recommended_demand > 100000, 'Demand should be higher than valuation');
    assert(demand.recommended_demand < 150000, 'Demand should not be excessive');
    assert(demand.minimum_acceptable >= 85000, 'Minimum should be reasonable');
  });

  // DAMAGE PATTERN ENGINE TESTS
  console.log('\n🔍 DAMAGE PATTERN ENGINE');

  await test('Water damage pattern recognition works', () => {
    const analysis = damagePatterns.analyzeDamagePattern({
      description: 'Water staining on ceiling, wet drywall, standing water from burst pipe',
      damage_types: ['water', 'ceiling', 'drywall']
    });
    
    assert(analysis.pattern_identified, 'Should identify pattern');
    assert(analysis.primary_pattern, 'Should identify primary pattern');
    assert(analysis.typical_scope, 'Should provide typical scope');
    assert(analysis.coverage_likelihood, 'Should assess coverage likelihood');
  });

  await test('Hidden damage risks identified for water damage', () => {
    const risks = damagePatterns.identifyHiddenDamageRisks('Ceiling water damage', 'water');
    assert(risks.length > 0, 'Should identify hidden risks');
    assert(risks.some(r => r.risk.includes('Mold')), 'Should identify mold risk for water damage');
    assert(risks[0].likelihood, 'Each risk should have likelihood');
    assert(risks[0].inspection_method, 'Each risk should have inspection method');
  });

  // EVIDENCE STANDARDS ENGINE TESTS
  console.log('\n📸 EVIDENCE STANDARDS ENGINE');

  await test('Evidence requirements exist for major claim types', () => {
    const waterReqs = evidenceStandards.EVIDENCE_REQUIREMENTS_BY_CLAIM_TYPE['Water Damage'];
    assert(waterReqs, 'Water damage requirements should exist');
    assert(waterReqs.critical_evidence.length > 0, 'Should have critical evidence list');
    assert(waterReqs.supporting_evidence.length > 0, 'Should have supporting evidence list');
    assert(waterReqs.documentation_timeline, 'Should specify timeline');
  });

  await test('Evidence completeness assessment works', () => {
    const assessment = evidenceStandards.assessEvidenceCompleteness({
      items: [
        { type: 'Photos of water source', description: 'Leak photos' },
        { type: 'Photos of all affected areas', description: 'Damage photos' },
        { type: 'Moisture readings', description: 'Meter readings' }
      ]
    }, 'Water Damage');
    
    assert(assessment.completeness_level, 'Should provide completeness level');
    assert(assessment.completeness_score >= 0, 'Should calculate score');
    assert(assessment.critical_evidence_present, 'Should list present evidence');
    assert(assessment.critical_evidence_missing, 'Should list missing evidence');
  });

  // PRICING VALIDATION ENGINE TESTS
  console.log('\n💰 PRICING VALIDATION ENGINE');

  await test('Market pricing database contains construction items', () => {
    assert(pricingValidation.MARKET_PRICING, 'Market pricing should exist');
    assert(Object.keys(pricingValidation.MARKET_PRICING).length > 50, 'Should have 50+ items');
    const shingles = pricingValidation.MARKET_PRICING['asphalt shingles (architectural)'];
    assert(shingles, 'Should include asphalt shingles');
    assert(shingles.min && shingles.max, 'Should have min/max pricing');
  });

  await test('Pricing validation detects deviations', async () => {
    const results = await pricingValidation.validatePricing(
      [{ description: 'Asphalt shingles', quantity: 25, unit_price: 150 }],
      [],
      [],
      'CA'
    );
    
    assert(results, 'Should return results object');
    assert(results.contractor_pricing, 'Should include contractor pricing');
    assert(results.report, 'Should include report');
  });

  // LABOR RATE VALIDATOR TESTS
  console.log('\n👷 LABOR RATE VALIDATOR');

  await test('Labor rates exist for major regions', () => {
    assert(laborRateValidator.REGIONAL_LABOR_RATES, 'Labor rates should exist');
    const caRates = laborRateValidator.REGIONAL_LABOR_RATES['CA-San Francisco'];
    assert(caRates, 'California rates should exist');
  });

  await test('Labor rate validation works', () => {
    const validation = laborRateValidator.validateLaborRate('Carpenter', 75, 'CA', 'San Francisco');
    assert(validation.status, 'Should provide status');
    assert(validation.market_range, 'Should provide market range');
    assert(validation.provided_rate === 75, 'Should include provided rate');
  });

  // INTEGRATION TESTS
  console.log('\n🔗 INTEGRATION TESTS');

  await test('All engines integrate seamlessly', () => {
    const policyGaps = policyIntelligence.detectCoverageGaps(
      { dwelling: 200000 },
      'HO-3',
      { damageType: 'water', waterSource: 'sewer', endorsements: [] }
    );
    
    const legalStandards = legalPrecedent.getLegalStandards('California');
    
    const damagePattern = damagePatterns.analyzeDamagePattern({
      description: 'Water damage from burst pipe',
      damage_types: ['water']
    });
    
    const evidenceChecklist = evidenceStandards.generateEvidenceChecklist('Water Damage', 'California');
    
    assert(policyGaps.length > 0, 'Should detect policy gaps');
    assert(legalStandards, 'Should have legal standards');
    assert(damagePattern.pattern_identified, 'Should identify damage pattern');
    assert(evidenceChecklist.available !== false, 'Should generate evidence checklist');
  });

  // DETERMINISM TESTS
  console.log('\n🎲 DETERMINISM TESTS');

  await test('Policy gap detection is deterministic', () => {
    const input = { dwelling: 250000 };
    const scenario = { damageType: 'water', waterSource: 'sewer', endorsements: [] };
    
    const gaps1 = policyIntelligence.detectCoverageGaps(input, 'HO-3', scenario);
    const gaps2 = policyIntelligence.detectCoverageGaps(input, 'HO-3', scenario);
    
    assert(JSON.stringify(gaps1) === JSON.stringify(gaps2), 'Gap detection should be deterministic');
  });

  await test('Bad faith analysis is deterministic', () => {
    const conduct = {
      days_since_acknowledgment: 30,
      days_since_claim: 120,
      lowball_offer: true,
      offer_percentage: 45,
      offer_amount: 45000,
      valuation: 100000,
      inadequate_investigation: false,
      investigation_deficiencies: [],
      denial_without_explanation: false
    };
    
    const analysis1 = legalPrecedent.analyzeBadFaithPotential(conduct, 'California');
    const analysis2 = legalPrecedent.analyzeBadFaithPotential(conduct, 'California');
    
    assert(analysis1.bad_faith_potential === analysis2.bad_faith_potential, 'Bad faith analysis should be deterministic');
    assert(analysis1.triggers.length === analysis2.triggers.length, 'Trigger count should be consistent');
  });

  await test('Negotiation position analysis is deterministic', () => {
    const claimData = {
      coverage_clear: true,
      documentation_score: 80,
      independent_estimates: 2,
      expert_reports: 1,
      attorney_involved: false,
      pre_existing_conditions: false,
      causation_disputed: false,
      appraisal_available: true
    };
    
    const carrierConduct = {
      bad_faith_conduct: false,
      statutory_violations: 0,
      delaying: false,
      amount_disputed: true,
      coverage_disputed: false
    };
    
    const analysis1 = negotiationStrategy.analyzeNegotiationPosition(claimData, carrierConduct, 'Texas');
    const analysis2 = negotiationStrategy.analyzeNegotiationPosition(claimData, carrierConduct, 'Texas');
    
    assert(analysis1.position_strength === analysis2.position_strength, 'Position analysis should be deterministic');
  });

  // SUMMARY
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total: ${passedTests + failedTests}`);
  console.log(`🎯 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failedTests > 0) {
    console.log('\n⚠️  Some tests failed. Review errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All intelligence engine tests passed!');
    process.exit(0);
  }
})();
