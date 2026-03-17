/**
 * DAMAGE PATTERN RECOGNITION DATABASE
 * 
 * Expert-level damage assessment patterns, causation indicators, and scope analysis
 * NO AI - Rule-based pattern matching with construction and restoration expertise
 * 
 * Identifies damage patterns, causation indicators, and hidden damage risks
 */

const WATER_DAMAGE_PATTERNS = {
  'Sudden Pipe Burst': {
    indicators: [
      'Water staining on ceiling or walls',
      'Wet drywall or insulation',
      'Standing water',
      'Damaged flooring (warping, buckling)',
      'Visible pipe damage or leak'
    ],
    causation_evidence: [
      'Frozen pipe (winter)',
      'Corroded pipe',
      'High water pressure',
      'Physical impact to pipe'
    ],
    typical_scope: [
      'Drywall removal and replacement (2-4 feet above water line)',
      'Insulation replacement',
      'Flooring replacement (affected areas)',
      'Baseboard and trim replacement',
      'Paint and finish',
      'Plumbing repair'
    ],
    hidden_damage_risks: [
      'Mold growth (if not dried within 48-72 hours)',
      'Subfloor damage',
      'Structural framing damage',
      'Electrical system damage'
    ],
    coverage_likelihood: 'high',
    coverage_notes: 'Sudden and accidental discharge is covered peril under most policies'
  },
  'Slow Leak': {
    indicators: [
      'Gradual water staining',
      'Mold or mildew odor',
      'Soft or spongy drywall',
      'Rust stains',
      'Peeling paint'
    ],
    causation_evidence: [
      'Corroded pipe',
      'Loose fitting',
      'Deteriorated seal',
      'Long-term moisture presence'
    ],
    typical_scope: [
      'Extensive drywall removal (moisture travels)',
      'Mold remediation',
      'Insulation replacement',
      'Plumbing repair',
      'Structural drying'
    ],
    hidden_damage_risks: [
      'Extensive mold behind walls',
      'Structural rot',
      'Electrical hazards',
      'Foundation damage'
    ],
    coverage_likelihood: 'low-medium',
    coverage_notes: 'May be excluded as gradual damage or lack of maintenance; coverage depends on when leak started and insured knowledge'
  },
  'Sewer Backup': {
    indicators: [
      'Water in basement or lower levels',
      'Foul odor',
      'Sewage residue',
      'Multiple drain backups',
      'Toilet overflow'
    ],
    causation_evidence: [
      'Clogged sewer line',
      'Tree root intrusion',
      'Municipal sewer backup',
      'Sump pump failure'
    ],
    typical_scope: [
      'Water extraction',
      'Sewage cleanup and sanitization',
      'Flooring replacement',
      'Drywall removal (lower 2 feet minimum)',
      'Insulation replacement',
      'Sewer line repair or replacement'
    ],
    hidden_damage_risks: [
      'Contamination of HVAC system',
      'Subfloor damage',
      'Structural damage',
      'Health hazards'
    ],
    coverage_likelihood: 'low (without endorsement)',
    coverage_notes: 'Typically excluded unless Water Backup endorsement (HO-04-95) is present'
  },
  'Roof Leak': {
    indicators: [
      'Ceiling water stains',
      'Dripping water during rain',
      'Wet insulation in attic',
      'Damaged ceiling drywall',
      'Mold in attic'
    ],
    causation_evidence: [
      'Missing or damaged shingles',
      'Flashing failure',
      'Wind damage to roof',
      'Hail damage',
      'Age-related deterioration'
    ],
    typical_scope: [
      'Roof repair or replacement',
      'Roof decking replacement (if damaged)',
      'Attic insulation replacement',
      'Ceiling drywall repair',
      'Interior paint',
      'Flashing and trim repair'
    ],
    hidden_damage_risks: [
      'Roof decking rot',
      'Structural framing damage',
      'Mold in attic and walls',
      'Electrical damage'
    ],
    coverage_likelihood: 'medium-high',
    coverage_notes: 'Covered if caused by wind, hail, or other covered peril; excluded if wear-and-tear or lack of maintenance'
  }
};

const FIRE_DAMAGE_PATTERNS = {
  'Structure Fire': {
    indicators: [
      'Charred or burned materials',
      'Smoke damage throughout structure',
      'Soot on walls and ceilings',
      'Melted materials',
      'Structural collapse or compromise'
    ],
    typical_scope: [
      'Structural demolition and rebuild',
      'Complete electrical system replacement',
      'HVAC system replacement',
      'Plumbing system repair',
      'Smoke remediation throughout',
      'Contents cleaning or replacement'
    ],
    hidden_damage_risks: [
      'Structural integrity compromise',
      'Smoke damage in HVAC ducts',
      'Electrical system damage',
      'Foundation damage from heat'
    ],
    coverage_likelihood: 'very high',
    coverage_notes: 'Fire is covered peril under all standard policies; investigate for arson if suspicious'
  },
  'Smoke Damage Only': {
    indicators: [
      'Soot on surfaces',
      'Smoke odor',
      'Discoloration of walls/ceilings',
      'No structural burning'
    ],
    typical_scope: [
      'Smoke cleaning (walls, ceilings, contents)',
      'HVAC duct cleaning',
      'Ozone treatment or thermal fogging',
      'Paint and refinishing',
      'Contents cleaning or replacement'
    ],
    hidden_damage_risks: [
      'Smoke in HVAC system',
      'Smoke damage to electronics',
      'Persistent odor requiring extensive remediation'
    ],
    coverage_likelihood: 'high',
    coverage_notes: 'Smoke damage from covered fire is covered'
  }
};

const WIND_DAMAGE_PATTERNS = {
  'Wind Damage to Roof': {
    indicators: [
      'Missing shingles',
      'Lifted or creased shingles',
      'Damaged flashing',
      'Granule loss',
      'Exposed roof decking'
    ],
    causation_evidence: [
      'Wind speed >50 mph',
      'Storm date documentation',
      'Neighbor damage',
      'Directional damage pattern',
      'Sudden onset'
    ],
    typical_scope: [
      'Roof replacement (if >30-40% damaged)',
      'Roof repair (if localized)',
      'Flashing replacement',
      'Gutter and downspout repair',
      'Interior water damage repair (if rain ingress)'
    ],
    hidden_damage_risks: [
      'Roof decking damage',
      'Attic insulation water damage',
      'Interior water damage',
      'Structural damage to trusses'
    ],
    coverage_likelihood: 'high',
    coverage_notes: 'Wind is covered peril; carrier may dispute if roof is old or poorly maintained'
  },
  'Wind Damage to Siding': {
    indicators: [
      'Dented or cracked siding',
      'Missing siding panels',
      'Damaged trim',
      'Water intrusion behind siding'
    ],
    typical_scope: [
      'Siding replacement (affected areas or full if matching unavailable)',
      'House wrap repair',
      'Trim and fascia repair',
      'Interior water damage repair',
      'Paint and finish'
    ],
    hidden_damage_risks: [
      'Sheathing damage',
      'Water intrusion into wall cavities',
      'Insulation damage',
      'Mold growth'
    ],
    coverage_likelihood: 'high',
    coverage_notes: 'Wind damage is covered; carrier may dispute matching requirement'
  }
};

const HAIL_DAMAGE_PATTERNS = {
  'Hail Damage to Roof': {
    indicators: [
      'Circular impact marks on shingles',
      'Granule loss in impact areas',
      'Shingle bruising or denting',
      'Damaged flashing or vents',
      'Consistent damage pattern across roof'
    ],
    causation_evidence: [
      'Hail storm documentation',
      'Hail size (>1 inch typically causes damage)',
      'Damage to other surfaces (AC unit, gutters, vehicles)',
      'Neighbor claims',
      'Weather service reports'
    ],
    typical_scope: [
      'Full roof replacement (if damage is widespread)',
      'Matching siding or gutters (if also damaged)',
      'Flashing and trim replacement',
      'Gutter and downspout replacement'
    ],
    hidden_damage_risks: [
      'Roof decking damage from severe impacts',
      'Compromised roof integrity',
      'Future leak risk'
    ],
    coverage_likelihood: 'high',
    coverage_notes: 'Hail is covered peril; carriers often dispute functional vs. cosmetic damage; may apply depreciation based on roof age'
  }
};

const MOLD_DAMAGE_PATTERNS = {
  'Mold from Covered Water Damage': {
    indicators: [
      'Visible mold growth',
      'Musty odor',
      'Recent water damage',
      'Mold appears within days/weeks of water event'
    ],
    causation_evidence: [
      'Documented covered water event',
      'Timeline showing mold appeared after water damage',
      'No prior mold issues',
      'Proper mitigation attempted'
    ],
    typical_scope: [
      'Mold remediation (containment, removal, disposal)',
      'Affected material removal (drywall, insulation, flooring)',
      'HEPA air filtration',
      'Antimicrobial treatment',
      'Reconstruction after remediation'
    ],
    hidden_damage_risks: [
      'Mold in HVAC system',
      'Mold behind walls beyond visible area',
      'Structural damage from moisture',
      'Health impacts'
    ],
    coverage_likelihood: 'medium',
    coverage_notes: 'Covered if mold resulted from covered water damage; subject to sublimit ($5,000-$50,000 typical); carrier will scrutinize causation and mitigation efforts'
  },
  'Mold from Long-Term Moisture': {
    indicators: [
      'Extensive mold growth',
      'Mold in multiple areas',
      'Long-term moisture evidence',
      'Structural rot',
      'No recent water event'
    ],
    coverage_likelihood: 'very low',
    coverage_notes: 'Typically excluded as gradual damage or lack of maintenance'
  }
};

/**
 * Analyze damage pattern and identify causation
 * @param {Object} damageDescription - Damage details
 * @returns {Object} Pattern analysis
 */
function analyzeDamagePattern(damageDescription) {
  const patterns = {
    ...WATER_DAMAGE_PATTERNS,
    ...FIRE_DAMAGE_PATTERNS,
    ...WIND_DAMAGE_PATTERNS,
    ...HAIL_DAMAGE_PATTERNS,
    ...MOLD_DAMAGE_PATTERNS
  };

  const matchedPatterns = [];

  for (const [patternName, pattern] of Object.entries(patterns)) {
    let matchScore = 0;
    const matchedIndicators = [];

    for (const indicator of pattern.indicators || []) {
      const indicatorWords = indicator.toLowerCase().split(' ');
      const descLower = (damageDescription.description || '').toLowerCase();
      
      if (descLower.includes(indicator.toLowerCase()) ||
          indicatorWords.some(word => word.length > 3 && descLower.includes(word)) ||
          damageDescription.damage_types?.some(dt => {
            const dtLower = dt.toLowerCase();
            return dtLower.includes(indicator.toLowerCase()) || 
                   indicatorWords.some(word => word.length > 3 && dtLower.includes(word));
          })) {
        matchScore += 1;
        matchedIndicators.push(indicator);
      }
    }

    if (matchScore >= 1) {
      matchedPatterns.push({
        pattern_name: patternName,
        match_score: matchScore,
        matched_indicators: matchedIndicators,
        pattern_details: pattern
      });
    }
  }

  matchedPatterns.sort((a, b) => b.match_score - a.match_score);

  const primaryPattern = matchedPatterns[0];

  if (!primaryPattern) {
    return {
      pattern_identified: false,
      recommendation: 'Damage does not match known patterns; recommend expert inspection'
    };
  }

  return {
    pattern_identified: true,
    primary_pattern: primaryPattern.pattern_name,
    confidence: primaryPattern.match_score >= 4 ? 'high' : primaryPattern.match_score >= 3 ? 'medium' : 'low',
    matched_indicators: primaryPattern.matched_indicators,
    typical_scope: primaryPattern.pattern_details.typical_scope,
    hidden_damage_risks: primaryPattern.pattern_details.hidden_damage_risks,
    coverage_likelihood: primaryPattern.pattern_details.coverage_likelihood,
    coverage_notes: primaryPattern.pattern_details.coverage_notes,
    causation_evidence_needed: primaryPattern.pattern_details.causation_evidence,
    alternative_patterns: matchedPatterns.slice(1, 3).map(p => ({
      pattern: p.pattern_name,
      match_score: p.match_score
    }))
  };
}

/**
 * Identify hidden damage risks
 * @param {string} visibleDamage - Visible damage description
 * @param {string} damageType - Primary damage type
 * @returns {Array} Hidden damage risks
 */
function identifyHiddenDamageRisks(visibleDamage, damageType) {
  const riskMap = {
    'water': [
      { risk: 'Mold growth in wall cavities', likelihood: 'high', inspection_method: 'Moisture meter, infrared camera, visual inspection after drywall removal' },
      { risk: 'Subfloor damage', likelihood: 'medium-high', inspection_method: 'Remove flooring to inspect subfloor' },
      { risk: 'Electrical system damage', likelihood: 'medium', inspection_method: 'Electrician inspection of affected circuits' },
      { risk: 'HVAC system contamination', likelihood: 'low-medium', inspection_method: 'HVAC inspection and duct cleaning' },
      { risk: 'Structural framing rot', likelihood: 'medium', inspection_method: 'Visual inspection after drywall removal; moisture meter' }
    ],
    'fire': [
      { risk: 'Structural integrity compromise', likelihood: 'high', inspection_method: 'Structural engineer inspection' },
      { risk: 'Smoke in HVAC ducts', likelihood: 'very high', inspection_method: 'HVAC inspection and duct camera' },
      { risk: 'Electrical system damage', likelihood: 'high', inspection_method: 'Licensed electrician full system inspection' },
      { risk: 'Hidden char in wall cavities', likelihood: 'medium-high', inspection_method: 'Thermal imaging, wall cavity inspection' },
      { risk: 'Foundation damage from heat', likelihood: 'low-medium', inspection_method: 'Foundation inspection' }
    ],
    'wind': [
      { risk: 'Roof decking damage', likelihood: 'high', inspection_method: 'Attic inspection, remove shingles to inspect decking' },
      { risk: 'Structural framing damage', likelihood: 'medium', inspection_method: 'Attic inspection, structural engineer if severe' },
      { risk: 'Water intrusion damage', likelihood: 'high', inspection_method: 'Interior inspection for water stains, moisture meter' },
      { risk: 'Sheathing damage', likelihood: 'medium', inspection_method: 'Remove siding to inspect sheathing' }
    ],
    'hail': [
      { risk: 'Roof decking damage', likelihood: 'low-medium', inspection_method: 'Attic inspection for impact damage' },
      { risk: 'Compromised roof integrity', likelihood: 'medium', inspection_method: 'Professional roof inspection' },
      { risk: 'Gutter and downspout damage', likelihood: 'high', inspection_method: 'Visual inspection of all gutters' },
      { risk: 'HVAC unit damage', likelihood: 'medium-high', inspection_method: 'HVAC technician inspection' }
    ]
  };

  return riskMap[damageType.toLowerCase()] || [];
}

/**
 * Generate comprehensive scope of work
 * @param {Object} damagePattern - Identified damage pattern
 * @param {Object} propertyDetails - Property characteristics
 * @returns {Object} Detailed scope
 */
function generateScopeOfWork(damagePattern, propertyDetails) {
  if (!damagePattern.pattern_identified) {
    return {
      scope_available: false,
      recommendation: 'Obtain professional inspection for scope determination'
    };
  }

  const baseScope = damagePattern.typical_scope || [];
  const additionalItems = [];

  if (propertyDetails.square_feet > 2000) {
    additionalItems.push('Extended scope due to property size');
  }

  if (propertyDetails.age > 30) {
    additionalItems.push('Potential code upgrade requirements');
  }

  if (damagePattern.hidden_damage_risks?.length > 0) {
    additionalItems.push('Recommend invasive inspection for hidden damage');
  }

  const scopeCategories = {
    'Demolition': [],
    'Structural': [],
    'Mechanical': [],
    'Finishes': [],
    'Specialty': []
  };

  for (const item of baseScope) {
    if (item.toLowerCase().includes('removal') || item.toLowerCase().includes('demolition')) {
      scopeCategories['Demolition'].push(item);
    } else if (item.toLowerCase().includes('framing') || item.toLowerCase().includes('structural') || item.toLowerCase().includes('decking')) {
      scopeCategories['Structural'].push(item);
    } else if (item.toLowerCase().includes('electrical') || item.toLowerCase().includes('plumbing') || item.toLowerCase().includes('hvac')) {
      scopeCategories['Mechanical'].push(item);
    } else if (item.toLowerCase().includes('paint') || item.toLowerCase().includes('flooring') || item.toLowerCase().includes('drywall') || item.toLowerCase().includes('trim')) {
      scopeCategories['Finishes'].push(item);
    } else {
      scopeCategories['Specialty'].push(item);
    }
  }

  return {
    scope_available: true,
    pattern: damagePattern.primary_pattern,
    scope_by_category: scopeCategories,
    additional_considerations: additionalItems,
    hidden_damage_inspection_required: damagePattern.hidden_damage_risks,
    estimated_timeline: estimateRepairTimeline(scopeCategories),
    code_compliance_notes: generateCodeComplianceNotes(damagePattern, propertyDetails)
  };
}

/**
 * Estimate repair timeline
 * @param {Object} scopeCategories - Scope organized by category
 * @returns {string} Timeline estimate
 */
function estimateRepairTimeline(scopeCategories) {
  let totalDays = 0;

  if (scopeCategories.Demolition.length > 0) totalDays += 3;
  if (scopeCategories.Structural.length > 0) totalDays += 7;
  if (scopeCategories.Mechanical.length > 0) totalDays += 5;
  if (scopeCategories.Finishes.length > 0) totalDays += 10;
  if (scopeCategories.Specialty.length > 0) totalDays += 5;

  if (totalDays <= 7) return '1-2 weeks';
  if (totalDays <= 21) return '2-4 weeks';
  if (totalDays <= 45) return '4-8 weeks';
  return '8-12+ weeks';
}

/**
 * Generate code compliance notes
 * @param {Object} damagePattern - Damage pattern
 * @param {Object} propertyDetails - Property details
 * @returns {Array} Code compliance considerations
 */
function generateCodeComplianceNotes(damagePattern, propertyDetails) {
  const notes = [];

  if (propertyDetails.age > 30) {
    notes.push('Property age >30 years: expect significant code upgrade requirements');
  }

  if (damagePattern.primary_pattern?.includes('Fire')) {
    notes.push('Fire damage repairs require full code compliance (electrical, structural, fire safety)');
  }

  if (damagePattern.primary_pattern?.includes('Roof')) {
    notes.push('Roof replacement may trigger solar panel requirements in some jurisdictions');
    notes.push('Check for roof deck attachment requirements (high-wind zones)');
  }

  if (damagePattern.primary_pattern?.includes('Water') || damagePattern.primary_pattern?.includes('Sewer')) {
    notes.push('Water damage repairs may require backflow preventer installation');
    notes.push('Check for mold remediation licensing requirements');
  }

  if (propertyDetails.jurisdiction === 'California') {
    notes.push('California Title 24 energy efficiency requirements apply to major renovations');
  }

  if (propertyDetails.jurisdiction === 'Florida') {
    notes.push('Florida Building Code requires wind-resistant construction in coastal areas');
  }

  return notes;
}

/**
 * Assess causation strength
 * @param {Object} damageEvidence - Evidence of damage and cause
 * @param {string} damageType - Type of damage
 * @returns {Object} Causation assessment
 */
function assessCausationStrength(damageEvidence, damageType) {
  const patterns = {
    ...WATER_DAMAGE_PATTERNS,
    ...FIRE_DAMAGE_PATTERNS,
    ...WIND_DAMAGE_PATTERNS,
    ...HAIL_DAMAGE_PATTERNS
  };

  let causationScore = 0;
  const supportingEvidence = [];
  const missingEvidence = [];

  for (const [patternName, pattern] of Object.entries(patterns)) {
    if (patternName.toLowerCase().includes(damageType.toLowerCase())) {
      const requiredEvidence = pattern.causation_evidence || [];
      
      for (const evidence of requiredEvidence) {
        if (damageEvidence.evidence_items?.some(item => 
          item.toLowerCase().includes(evidence.toLowerCase())
        )) {
          causationScore += 20;
          supportingEvidence.push(evidence);
        } else {
          missingEvidence.push(evidence);
        }
      }
      break;
    }
  }

  let strength = 'weak';
  if (causationScore >= 80) strength = 'very strong';
  else if (causationScore >= 60) strength = 'strong';
  else if (causationScore >= 40) strength = 'moderate';

  return {
    causation_strength: strength,
    causation_score: causationScore,
    supporting_evidence: supportingEvidence,
    missing_evidence: missingEvidence,
    recommendations: missingEvidence.length > 0 
      ? `Obtain: ${missingEvidence.join(', ')}`
      : 'Causation is well-documented',
    coverage_impact: strength === 'very strong' || strength === 'strong' 
      ? 'Strong causation evidence supports coverage'
      : 'Weak causation may lead to carrier dispute; strengthen evidence'
  };
}

module.exports = {
  WATER_DAMAGE_PATTERNS,
  FIRE_DAMAGE_PATTERNS,
  WIND_DAMAGE_PATTERNS,
  HAIL_DAMAGE_PATTERNS,
  MOLD_DAMAGE_PATTERNS,
  analyzeDamagePattern,
  identifyHiddenDamageRisks,
  generateScopeOfWork,
  assessCausationStrength
};
