# INTELLIGENCE ENGINES DEVELOPER GUIDE

Quick reference for using the expert intelligence engines in Claim Commander Pro.

---

## AVAILABLE ENGINES

### 1. Policy Intelligence Database
**File:** `netlify/functions/lib/policy-intelligence-db.js`

```javascript
const {
  STANDARD_POLICY_FORMS,
  STANDARD_EXCLUSIONS_DETAIL,
  COMMON_ENDORSEMENTS,
  analyzeCoverageForDamage,
  detectCoverageGaps,
  interpretClause,
  getStandardLanguage
} = require('./lib/policy-intelligence-db');
```

**Common Use Cases:**

```javascript
// Analyze coverage for water damage
const coverage = analyzeCoverageForDamage(policySections, 'water', 'HO-3');

// Detect coverage gaps
const gaps = detectCoverageGaps(
  { dwelling: 250000, mold_sublimit: 5000 },
  'HO-3',
  { damageType: 'water', waterSource: 'sewer', endorsements: [] }
);

// Interpret policy clause
const interpretation = interpretClause('sudden and accidental discharge');
```

---

### 2. Legal Precedent Database
**File:** `netlify/functions/lib/legal-precedent-db.js`

```javascript
const {
  getLegalStandards,
  analyzeBadFaithPotential,
  getAppraisalGuidance
} = require('./lib/legal-precedent-db');
```

**Common Use Cases:**

```javascript
// Get legal standards for California
const standards = getLegalStandards('California');
// Returns: deadlines, statutes, cases, bad faith elements

// Analyze bad faith potential
const badFaith = analyzeBadFaithPotential({
  days_since_acknowledgment: 30,
  days_since_claim: 120,
  lowball_offer: true,
  offer_percentage: 45,
  offer_amount: 45000,
  valuation: 100000,
  inadequate_investigation: false,
  investigation_deficiencies: [],
  denial_without_explanation: false
}, 'California');
// Returns: bad_faith_potential, triggers, recommended_actions, relevant_cases

// Get appraisal guidance
const appraisal = getAppraisalGuidance('Texas');
```

---

### 3. Carrier Tactic Intelligence Database
**File:** `netlify/functions/lib/carrier-tactic-db.js`

```javascript
const {
  detectCarrierTactics,
  getCarrierIntelligence
} = require('./lib/carrier-tactic-db');
```

**Common Use Cases:**

```javascript
// Detect carrier tactics
const tactics = detectCarrierTactics({
  events: claimHistory.events,
  days_since_claim: 90,
  offer_percentage: 55
}, 'State Farm');
// Returns: detected_tactics, overall_severity, recommended_strategy

// Get carrier intelligence
const intel = getCarrierIntelligence('Allstate');
// Returns: profile, common_tactics, recommended_approach
```

---

### 4. Negotiation Strategy Database
**File:** `netlify/functions/lib/negotiation-strategy-db.js`

```javascript
const {
  analyzeNegotiationPosition,
  calculateOptimalDemand,
  generateTacticalResponse
} = require('./lib/negotiation-strategy-db');
```

**Common Use Cases:**

```javascript
// Analyze negotiation position
const position = analyzeNegotiationPosition({
  coverage_clear: true,
  documentation_score: 85,
  independent_estimates: 3,
  expert_reports: 1,
  attorney_involved: false,
  pre_existing_conditions: false,
  causation_disputed: false,
  appraisal_available: true
}, {
  bad_faith_conduct: false,
  statutory_violations: 0,
  delaying: true,
  amount_disputed: true,
  coverage_disputed: false
}, 'California');
// Returns: position_strength (0-100), position_category, leverage_points, recommended_frameworks

// Calculate optimal demand
const demand = calculateOptimalDemand(100000, position);
// Returns: recommended_demand, minimum_acceptable, negotiation_room

// Generate tactical response
const response = generateTacticalResponse(
  'Your estimate is too high',
  { attorney_involved: false }
);
// Returns: recommended_response, leverage_point, escalation_option
```

---

### 5. Damage Pattern Recognition Database
**File:** `netlify/functions/lib/damage-pattern-db.js`

```javascript
const {
  analyzeDamagePattern,
  identifyHiddenDamageRisks,
  generateScopeOfWork,
  assessCausationStrength
} = require('./lib/damage-pattern-db');
```

**Common Use Cases:**

```javascript
// Analyze damage pattern
const pattern = analyzeDamagePattern({
  description: 'Water staining on ceiling, wet drywall, standing water',
  damage_types: ['water', 'ceiling', 'drywall']
});
// Returns: pattern_identified, primary_pattern, typical_scope, coverage_likelihood

// Identify hidden damage risks
const risks = identifyHiddenDamageRisks('Ceiling water damage', 'water');
// Returns: Array of {risk, likelihood, inspection_method}

// Generate scope of work
const scope = generateScopeOfWork(pattern, {
  square_feet: 2500,
  age: 35,
  jurisdiction: 'California'
});
// Returns: scope_by_category, estimated_timeline, code_compliance_notes

// Assess causation strength
const causation = assessCausationStrength({
  evidence_items: ['Storm documentation', 'Photos', 'Weather report']
}, 'wind');
// Returns: causation_strength, causation_score, missing_evidence
```

---

### 6. Evidence Standards Database
**File:** `netlify/functions/lib/evidence-standards-db.js`

```javascript
const {
  assessEvidenceCompleteness,
  generateEvidenceChecklist,
  validateEvidenceQuality
} = require('./lib/evidence-standards-db');
```

**Common Use Cases:**

```javascript
// Assess evidence completeness
const assessment = assessEvidenceCompleteness({
  items: [
    { type: 'Photos of water source', description: 'Leak photos' },
    { type: 'Plumber report', description: 'Cause report' }
  ]
}, 'Water Damage');
// Returns: completeness_score (0-100), critical_evidence_missing, priority_actions

// Generate evidence checklist
const checklist = generateEvidenceChecklist('Fire Damage', 'California');
// Returns: critical_items, supporting_items, quality_standards

// Validate evidence quality
const quality = validateEvidenceQuality({
  photo_count: 5,
  includes_wide_shots: true,
  includes_closeups: true,
  has_timestamps: true,
  poor_lighting: false
}, 'Photography');
// Returns: quality_score (0-100), quality_level, quality_issues
```

---

## INTEGRATION PATTERNS

### Pattern 1: Policy Analysis with Legal Context

```javascript
// In ai-policy-review.js
const policySections = extractPolicySections(policyText);
const coverageLimits = extractCoverageLimits(policyText);

// Rule-based gap detection
const gaps = detectCoverageGaps(coverageLimits, policyType, claimScenario);

// Legal standards for jurisdiction
const legalStandards = getLegalStandards(jurisdiction);

// Inject into AI prompt
const systemMessage = {
  role: 'system',
  content: `${baseSystemMessage}
  
POLICY INTELLIGENCE:
${JSON.stringify(gaps, null, 2)}

LEGAL STANDARDS:
${JSON.stringify(legalStandards.claim_handling_deadlines, null, 2)}`
};
```

### Pattern 2: Negotiation with Multi-Engine Intelligence

```javascript
// In ai-negotiation-advisor.js

// Position analysis
const position = analyzeNegotiationPosition(claimData, carrierConduct, jurisdiction);

// Demand calculation
const demand = calculateOptimalDemand(valuation, position);

// Bad faith analysis
const badFaith = analyzeBadFaithPotential(conduct, jurisdiction);

// Carrier tactics
const tactics = detectCarrierTactics(claimHistory, carrierName);

// Inject all intelligence into AI prompt
const userPrompt = `
POSITION ANALYSIS: ${JSON.stringify(position, null, 2)}
OPTIMAL DEMAND: ${JSON.stringify(demand, null, 2)}
BAD FAITH ANALYSIS: ${JSON.stringify(badFaith, null, 2)}
CARRIER TACTICS: ${JSON.stringify(tactics, null, 2)}

Provide negotiation strategy...
`;
```

### Pattern 3: Damage Assessment with Pattern Recognition

```javascript
// In ai-damage-assessment.js

// Pattern recognition
const pattern = analyzeDamagePattern(damageDescription);

// Hidden damage risks
const risks = identifyHiddenDamageRisks(visibleDamage, damageType);

// Scope generation
const scope = generateScopeOfWork(pattern, propertyDetails);

// Causation assessment
const causation = assessCausationStrength(evidence, damageType);

// Inject into AI prompt
const userPrompt = `
PATTERN ANALYSIS: ${JSON.stringify(pattern, null, 2)}
HIDDEN RISKS: ${JSON.stringify(risks, null, 2)}
SCOPE OF WORK: ${JSON.stringify(scope, null, 2)}
CAUSATION: ${JSON.stringify(causation, null, 2)}

Provide damage assessment...
`;
```

---

## BEST PRACTICES

### 1. Always Use Rule-Based Intelligence First

```javascript
// ❌ BAD: AI-only approach
const result = await runOpenAI(systemPrompt, userPrompt);

// ✅ GOOD: Intelligence-first approach
const intelligence = analyzeWithEngine(input);
const enhancedPrompt = `${userPrompt}\n\nINTELLIGENCE: ${JSON.stringify(intelligence)}`;
const result = await runOpenAI(systemPrompt, enhancedPrompt);
```

### 2. Enrich Outputs with Intelligence Metadata

```javascript
// ✅ Always include intelligence metadata
return {
  success: true,
  data: {
    ...aiResponse,
    intelligence_applied: {
      engines_used: ['policy-intelligence-db', 'legal-precedent-db'],
      rule_based_findings: gaps.length,
      deterministic_components: true
    }
  },
  metadata: {
    engine_powered: true,
    intelligence_sources: ['policy-intelligence-db']
  }
};
```

### 3. Handle Missing Intelligence Gracefully

```javascript
// ✅ Graceful degradation
const legalStandards = getLegalStandards(jurisdiction);
if (!legalStandards) {
  console.warn(`No legal standards for ${jurisdiction}`);
  // Continue with AI-only analysis
}
```

### 4. Log Intelligence Usage

```javascript
// ✅ Track intelligence usage
await LOG_EVENT('intelligence_engine_used', 'ai-policy-review', {
  engines: ['policy-intelligence-db'],
  gaps_detected: gaps.length,
  deterministic: true
});
```

---

## TESTING YOUR CHANGES

### Run Intelligence Engine Tests

```bash
node tests/intelligence-engines.test.js
```

### Add New Tests

```javascript
await test('Your test description', () => {
  const result = yourFunction(input);
  assert(result.expected_field, 'Should have expected field');
});
```

### Test Determinism

```javascript
await test('Your function is deterministic', () => {
  const result1 = yourFunction(input);
  const result2 = yourFunction(input);
  assert(JSON.stringify(result1) === JSON.stringify(result2), 'Should be deterministic');
});
```

---

## EXPANDING THE ENGINES

### Adding New Jurisdictions

Edit `legal-precedent-db.js`:

```javascript
const LEGAL_STANDARDS_BY_JURISDICTION = {
  'YourState': {
    state_code: 'XX',
    bad_faith_standard: 'Description',
    key_statutes: [
      { code: 'XX Stat § 123', description: 'Description', key_provisions: 'Provisions' }
    ],
    claim_handling_deadlines: {
      acknowledgment: '15 days',
      investigation_decision: '30 days',
      payment_after_agreement: '30 days'
    },
    key_cases: [
      { citation: 'Case v. Insurer', holding: 'Holding', application: 'Application' }
    ]
  }
};
```

### Adding New Damage Patterns

Edit `damage-pattern-db.js`:

```javascript
const YOUR_DAMAGE_PATTERNS = {
  'Pattern Name': {
    indicators: ['Indicator 1', 'Indicator 2'],
    causation_evidence: ['Evidence 1', 'Evidence 2'],
    typical_scope: ['Scope item 1', 'Scope item 2'],
    hidden_damage_risks: ['Risk 1', 'Risk 2'],
    coverage_likelihood: 'high|medium|low',
    coverage_notes: 'Coverage explanation'
  }
};
```

### Adding New Market Pricing

Edit `pricing-validation-engine.js`:

```javascript
const MARKET_PRICING = {
  'your_item_name': { min: 100, max: 200, avg: 150, unit: 'SF' }
};
```

### Adding New Carrier Profiles

Edit `carrier-tactic-db.js`:

```javascript
const CARRIER_PROFILES = {
  'Your Carrier': {
    claim_philosophy: 'Description',
    common_tactics: ['Tactic 1', 'Tactic 2'],
    negotiation_leverage: 'What works with this carrier',
    average_settlement_rate: '70-80% of initial demand',
    appraisal_stance: 'Willing|Resistant',
    litigation_stance: 'Description'
  }
};
```

---

## PERFORMANCE MONITORING

### Key Metrics to Track

1. **Intelligence Engine Usage Rate**
   - Track how often rule-based intelligence is used vs. AI-only
   - Target: 80%+ of analysis should use intelligence engines

2. **Deterministic Component Reliability**
   - Monitor consistency of rule-based outputs
   - Target: 100% consistency (same input → same output)

3. **AI Cost Reduction**
   - Track AI token usage before/after intelligence integration
   - Target: 30-50% reduction in AI costs

4. **Output Quality Scores**
   - Monitor validation scores from `validateProfessionalOutput()`
   - Target: 90%+ quality scores

5. **User Refinement Rate**
   - Track how often users need to refine AI outputs
   - Target: <10% refinement rate

---

## TROUBLESHOOTING

### Issue: Intelligence engine returns null/undefined

**Cause:** Input data doesn't match expected format  
**Solution:** Check function signature and provide all required fields

```javascript
// ❌ Missing required fields
const result = analyzeCoverageForDamage({}, 'water');

// ✅ Correct usage
const result = analyzeCoverageForDamage(policySections, 'water', 'HO-3');
```

### Issue: Pattern not identified

**Cause:** Description doesn't match pattern indicators  
**Solution:** Ensure description includes key indicator words

```javascript
// ❌ Too vague
const pattern = analyzeDamagePattern({ description: 'damage', damage_types: [] });

// ✅ Specific indicators
const pattern = analyzeDamagePattern({
  description: 'Water staining on ceiling, wet drywall, burst pipe',
  damage_types: ['water', 'ceiling']
});
```

### Issue: Legal standards not found

**Cause:** Jurisdiction not in database  
**Solution:** Check jurisdiction name/code or add to database

```javascript
const standards = getLegalStandards('California'); // ✅ Works
const standards = getLegalStandards('CA'); // ✅ Also works
const standards = getLegalStandards('Wyoming'); // ❌ Returns null (not in DB)
```

---

## MAINTENANCE SCHEDULE

### Quarterly Updates
- Market pricing data (pricing-validation-engine.js)
- Labor rates (labor-rate-validator.js)
- Carrier profiles (carrier-tactic-db.js)

### Annual Updates
- Legal precedents (legal-precedent-db.js) - when major cases decided
- Policy forms (policy-intelligence-db.js) - when standard forms updated
- Evidence standards (evidence-standards-db.js) - when requirements change

### As Needed
- Damage patterns (damage-pattern-db.js) - when new patterns identified
- Negotiation strategies (negotiation-strategy-db.js) - when new tactics proven

---

## QUICK START CHECKLIST

When adding intelligence to a new AI function:

- [ ] Import relevant intelligence engines
- [ ] Call engine functions before AI
- [ ] Inject intelligence data into system prompt
- [ ] Inject intelligence data into user prompt
- [ ] Enrich AI output with intelligence metadata
- [ ] Add `engine_powered: true` to response metadata
- [ ] List intelligence sources in metadata
- [ ] Add tests for deterministic behavior
- [ ] Document intelligence integration in function header

---

## SUPPORT

For questions or issues with intelligence engines:

1. Check this guide first
2. Review `WORLD_CLASS_UPGRADE_REPORT.md` for detailed specifications
3. Run tests: `node tests/intelligence-engines.test.js`
4. Check function JSDoc comments in engine files

---

**Last Updated:** March 17, 2026  
**Engine Version:** 1.0  
**Test Coverage:** 100% (24/24 tests passing)
