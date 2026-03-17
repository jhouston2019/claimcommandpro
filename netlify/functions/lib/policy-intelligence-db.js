/**
 * POLICY INTELLIGENCE DATABASE
 * 
 * Expert-level policy language interpretation and coverage analysis
 * NO AI - Pure rule-based logic with standard policy form knowledge
 * 
 * Contains standard policy language, coverage interpretations, and common exclusions
 * for major insurance carriers and policy forms (HO-3, HO-5, DP-3, Commercial Property, etc.)
 */

const STANDARD_POLICY_FORMS = {
  'HO-3': {
    name: 'Homeowners Special Form',
    coverage_basis: {
      dwelling: 'open-peril',
      personal_property: 'named-peril',
      liability: 'occurrence'
    },
    standard_coverages: {
      A: { name: 'Dwelling', typical_basis: '100% of insured value' },
      B: { name: 'Other Structures', typical_basis: '10% of Coverage A' },
      C: { name: 'Personal Property', typical_basis: '50-70% of Coverage A' },
      D: { name: 'Loss of Use', typical_basis: '20-30% of Coverage A' },
      E: { name: 'Personal Liability', typical_basis: '$100,000-$500,000' },
      F: { name: 'Medical Payments', typical_basis: '$1,000-$5,000' }
    },
    common_exclusions: [
      'Flood',
      'Earth Movement (earthquake)',
      'Ordinance or Law',
      'Water Backup (unless endorsed)',
      'Mold (limited coverage)',
      'Neglect',
      'War',
      'Nuclear Hazard',
      'Intentional Loss',
      'Government Action'
    ],
    common_limitations: [
      { item: 'Jewelry', limit: '$1,500' },
      { item: 'Silverware', limit: '$2,500' },
      { item: 'Money', limit: '$200' },
      { item: 'Securities', limit: '$1,500' },
      { item: 'Firearms', limit: '$2,500' },
      { item: 'Business Property', limit: '$2,500' },
      { item: 'Electronics (portable)', limit: '$1,500' }
    ]
  },
  'HO-5': {
    name: 'Homeowners Comprehensive Form',
    coverage_basis: {
      dwelling: 'open-peril',
      personal_property: 'open-peril',
      liability: 'occurrence'
    },
    standard_coverages: {
      A: { name: 'Dwelling', typical_basis: '100% of insured value' },
      B: { name: 'Other Structures', typical_basis: '10% of Coverage A' },
      C: { name: 'Personal Property', typical_basis: '70-75% of Coverage A' },
      D: { name: 'Loss of Use', typical_basis: '30-40% of Coverage A' },
      E: { name: 'Personal Liability', typical_basis: '$300,000-$1,000,000' },
      F: { name: 'Medical Payments', typical_basis: '$2,000-$5,000' }
    },
    common_exclusions: [
      'Flood',
      'Earth Movement (earthquake)',
      'War',
      'Nuclear Hazard',
      'Intentional Loss',
      'Government Action'
    ],
    common_limitations: [
      { item: 'Jewelry', limit: '$5,000-$10,000' },
      { item: 'Silverware', limit: '$5,000-$10,000' },
      { item: 'Money', limit: '$500' },
      { item: 'Securities', limit: '$2,500' },
      { item: 'Firearms', limit: '$5,000' }
    ]
  },
  'DP-3': {
    name: 'Dwelling Fire Special Form',
    coverage_basis: {
      dwelling: 'open-peril',
      personal_property: 'named-peril',
      liability: 'not included (must be added)'
    },
    standard_coverages: {
      A: { name: 'Dwelling', typical_basis: '100% of insured value' },
      B: { name: 'Other Structures', typical_basis: '10% of Coverage A' },
      C: { name: 'Personal Property', typical_basis: 'Optional, 10-50% of Coverage A' },
      D: { name: 'Fair Rental Value', typical_basis: '10-20% of Coverage A' }
    },
    common_exclusions: [
      'Flood',
      'Earth Movement',
      'Ordinance or Law',
      'Theft (unless occupied)',
      'Vandalism (if vacant >60 days)',
      'Water Backup',
      'Mold',
      'War',
      'Nuclear Hazard'
    ]
  }
};

const STANDARD_EXCLUSIONS_DETAIL = {
  'Flood': {
    language: 'We do not cover loss caused directly or indirectly by flood, surface water, waves, tidal water, overflow of a body of water, or spray from any of these, whether or not driven by wind.',
    coverage_available: 'National Flood Insurance Program (NFIP) or private flood insurance',
    common_disputes: 'Water vs. flood distinction, rain ingress vs. surface water'
  },
  'Earth Movement': {
    language: 'We do not cover loss caused directly or indirectly by earth movement including but not limited to earthquake, landslide, mudflow, earth sinking, rising or shifting.',
    coverage_available: 'Earthquake endorsement or separate earthquake policy',
    common_disputes: 'Ensuing loss (e.g., fire following earthquake may be covered)'
  },
  'Ordinance or Law': {
    language: 'We do not cover loss caused by enforcement of any ordinance or law regulating the construction, repair, or demolition of buildings or other structures.',
    coverage_available: 'Ordinance or Law endorsement',
    common_disputes: 'Undamaged portion demolition, increased cost due to code upgrades'
  },
  'Water Backup': {
    language: 'We do not cover loss caused by water or waterborne material which backs up through sewers or drains or which overflows or is discharged from a sump, sump pump or related equipment.',
    coverage_available: 'Water Backup endorsement',
    common_disputes: 'Sump pump failure, sewer backup, drain overflow'
  },
  'Mold': {
    language: 'We do not cover loss caused by, resulting from, contributed to or aggravated by mold, fungus, or wet or dry rot.',
    coverage_available: 'Limited mold coverage (typically $10,000-$50,000 if caused by covered peril)',
    common_disputes: 'Mold resulting from covered water damage, hidden mold discovery'
  },
  'Neglect': {
    language: 'We do not cover loss caused by neglect, meaning neglect of the insured to use all reasonable means to save and preserve property at and after the time of loss.',
    coverage_available: 'No separate coverage available',
    common_disputes: 'Failure to mitigate, delayed repairs, inadequate temporary protection'
  }
};

const COMMON_ENDORSEMENTS = {
  'Replacement Cost': {
    code: 'HO-04-90',
    description: 'Personal property paid at replacement cost without depreciation',
    typical_cost: 'Included or +5-10% premium'
  },
  'Increased Dwelling': {
    code: 'HO-04-15',
    description: 'Increased dwelling coverage (e.g., 125% or 150% of Coverage A)',
    typical_cost: '+10-25% premium'
  },
  'Ordinance or Law': {
    code: 'HO-04-77',
    description: 'Covers increased costs due to building code upgrades',
    typical_cost: '+5-15% premium'
  },
  'Water Backup': {
    code: 'HO-04-95',
    description: 'Covers sewer/drain backup and sump pump overflow',
    typical_cost: '+$50-$200 annually'
  },
  'Equipment Breakdown': {
    code: 'HO-04-12',
    description: 'Covers mechanical breakdown of systems (HVAC, electrical, plumbing)',
    typical_cost: '+$50-$150 annually'
  },
  'Scheduled Personal Property': {
    code: 'HO-04-61',
    description: 'Itemized coverage for high-value items (jewelry, art, collectibles)',
    typical_cost: '+$1-$2 per $100 of coverage'
  },
  'Identity Fraud': {
    code: 'HO-04-54',
    description: 'Covers expenses related to identity theft',
    typical_cost: '+$25-$50 annually'
  }
};

const CARRIER_SPECIFIC_LANGUAGE = {
  'State Farm': {
    policy_forms: ['HO-3', 'HO-5', 'DP-3'],
    unique_features: [
      'Guaranteed Replacement Cost (no cap)',
      'Extended Replacement Cost (25-50% over Coverage A)'
    ],
    common_tactics: [
      'Depreciation on roof based on age',
      'Actual Cash Value settlement until repairs complete',
      'Scope reduction through "pre-existing condition" claims'
    ]
  },
  'Allstate': {
    policy_forms: ['HO-3', 'HO-5', 'DP-3'],
    unique_features: [
      'Claim RateGuard (no rate increase for first claim)',
      'New Home Discount (homes <10 years old)'
    ],
    common_tactics: [
      'Aggressive depreciation schedules',
      'Limited mold coverage ($5,000-$10,000)',
      'Roof coverage limitations based on age'
    ]
  },
  'USAA': {
    policy_forms: ['HO-3', 'HO-5', 'DP-3'],
    unique_features: [
      'Extended Replacement Cost (25% over Coverage A)',
      'Inflation Protection'
    ],
    common_tactics: [
      'Generally fair claims handling',
      'May require multiple estimates',
      'Strong documentation requirements'
    ]
  },
  'Liberty Mutual': {
    policy_forms: ['HO-3', 'HO-5', 'DP-3'],
    unique_features: [
      'Better Home Replacement Cost Plus (up to 200% of Coverage A)',
      'Water Backup coverage up to $25,000'
    ],
    common_tactics: [
      'Depreciation on personal property',
      'May dispute causation',
      'Requires detailed documentation'
    ]
  }
};

/**
 * Analyze policy coverage for specific damage type
 * @param {Object} policySections - Extracted policy sections
 * @param {string} damageType - Type of damage (e.g., 'water', 'fire', 'wind')
 * @param {string} policyForm - Policy form type (e.g., 'HO-3')
 * @returns {Object} Coverage analysis
 */
function analyzeCoverageForDamage(policySections, damageType, policyForm = 'HO-3') {
  const form = STANDARD_POLICY_FORMS[policyForm];
  if (!form) {
    return { covered: 'unknown', reason: 'Policy form not recognized' };
  }

  const damageTypeMap = {
    'water': {
      covered_if: 'Sudden and accidental discharge from plumbing, heating, AC, or appliance',
      excluded_if: 'Flood, surface water, water backup (without endorsement), seepage, continuous leak',
      key_factors: ['Source of water', 'Suddenness', 'Duration', 'Maintenance history']
    },
    'fire': {
      covered_if: 'Fire or lightning (covered peril)',
      excluded_if: 'Intentional fire, war, nuclear hazard',
      key_factors: ['Cause of fire', 'Intentionality', 'Arson investigation']
    },
    'wind': {
      covered_if: 'Windstorm or hail (covered peril)',
      excluded_if: 'Flood, water damage from rain through opening made by wind (may be covered), cosmetic damage',
      key_factors: ['Wind speed', 'Opening made by wind', 'Rain ingress timing']
    },
    'hail': {
      covered_if: 'Hail (covered peril)',
      excluded_if: 'Cosmetic damage (policy-dependent)',
      key_factors: ['Functional vs. cosmetic damage', 'Roof age', 'Depreciation schedule']
    },
    'theft': {
      covered_if: 'Theft (covered peril)',
      excluded_if: 'Mysterious disappearance, tenant theft (DP-3 unoccupied)',
      key_factors: ['Evidence of forced entry', 'Police report', 'Occupancy status']
    },
    'vandalism': {
      covered_if: 'Vandalism or malicious mischief (covered peril)',
      excluded_if: 'Vacancy >60 days',
      key_factors: ['Occupancy status', 'Vacancy duration', 'Police report']
    },
    'mold': {
      covered_if: 'Mold resulting from covered water damage (limited sublimit)',
      excluded_if: 'Mold from excluded cause, long-term moisture, neglect',
      key_factors: ['Cause of moisture', 'Timing of discovery', 'Mitigation efforts', 'Sublimit amount']
    }
  };

  const analysis = damageTypeMap[damageType.toLowerCase()];
  if (!analysis) {
    return { covered: 'unknown', reason: 'Damage type not in database' };
  }

  return {
    damage_type: damageType,
    policy_form: policyForm,
    coverage_basis: form.coverage_basis,
    analysis: analysis,
    relevant_exclusions: form.common_exclusions.filter(exc => 
      analysis.excluded_if.toLowerCase().includes(exc.toLowerCase())
    ),
    recommended_endorsements: Object.entries(COMMON_ENDORSEMENTS)
      .filter(([key, end]) => 
        analysis.excluded_if.toLowerCase().includes(key.toLowerCase().replace(/_/g, ' '))
      )
      .map(([key, end]) => end)
  };
}

/**
 * Detect coverage gaps based on claim scenario
 * @param {Object} policyLimits - Extracted coverage limits
 * @param {string} policyForm - Policy form type
 * @param {Object} claimScenario - Claim details
 * @returns {Array} Identified coverage gaps
 */
function detectCoverageGaps(policyLimits, policyForm, claimScenario) {
  const gaps = [];
  const form = STANDARD_POLICY_FORMS[policyForm];

  if (claimScenario.damageType === 'water' && !claimScenario.endorsements?.includes('Water Backup')) {
    if (claimScenario.waterSource === 'sewer' || claimScenario.waterSource === 'drain' || claimScenario.waterSource === 'sump pump') {
      gaps.push({
        gap_type: 'exclusion',
        coverage: 'Water Backup',
        severity: 'critical',
        description: 'Water damage from sewer/drain backup or sump pump failure is excluded without HO-04-95 endorsement',
        recommendation: 'Verify if Water Backup endorsement is present; if not, claim may be denied'
      });
    }
  }

  if (claimScenario.codeUpgradeRequired && !claimScenario.endorsements?.includes('Ordinance or Law')) {
    gaps.push({
      gap_type: 'exclusion',
      coverage: 'Ordinance or Law',
      severity: 'high',
      description: 'Increased costs due to building code compliance are excluded without HO-04-77 endorsement',
      recommendation: 'Ordinance or Law costs will not be covered; negotiate for partial coverage or carrier goodwill'
    });
  }

  if (claimScenario.moldPresent && policyLimits.mold_sublimit < 10000) {
    gaps.push({
      gap_type: 'sublimit',
      coverage: 'Mold',
      severity: 'medium',
      description: `Mold coverage is limited to $${policyLimits.mold_sublimit || 5000}`,
      recommendation: 'Document that mold resulted from covered peril; negotiate for higher sublimit if extensive'
    });
  }

  if (claimScenario.totalLoss && policyLimits.dwelling < claimScenario.estimatedRepairCost) {
    gaps.push({
      gap_type: 'underinsurance',
      coverage: 'Dwelling',
      severity: 'critical',
      description: `Dwelling limit ($${policyLimits.dwelling}) is insufficient for total loss ($${claimScenario.estimatedRepairCost})`,
      recommendation: 'Check for Extended or Guaranteed Replacement Cost endorsement; if not present, claim will be limited to policy limit'
    });
  }

  for (const limitation of form.common_limitations) {
    if (claimScenario.highValueItems?.[limitation.item.toLowerCase()]) {
      const itemValue = claimScenario.highValueItems[limitation.item.toLowerCase()];
      const limitValue = parseFloat(limitation.limit.replace(/[$,]/g, ''));
      if (itemValue > limitValue) {
        gaps.push({
          gap_type: 'sublimit',
          coverage: `Personal Property - ${limitation.item}`,
          severity: 'medium',
          description: `${limitation.item} coverage is limited to ${limitation.limit}; claimed value is $${itemValue}`,
          recommendation: 'Check for Scheduled Personal Property endorsement (HO-04-61) for this item'
        });
      }
    }
  }

  return gaps;
}

/**
 * Interpret specific policy language clause
 * @param {string} clauseText - Policy clause text
 * @returns {Object} Interpretation
 */
function interpretClause(clauseText) {
  const interpretations = [];

  if (/sudden and accidental/i.test(clauseText)) {
    interpretations.push({
      phrase: 'Sudden and Accidental',
      meaning: 'Damage must occur unexpectedly and not result from gradual deterioration or neglect',
      favorable_to: 'insurer',
      common_disputes: 'Slow leaks, long-term moisture damage, repeated incidents'
    });
  }

  if (/ensuing loss/i.test(clauseText)) {
    interpretations.push({
      phrase: 'Ensuing Loss',
      meaning: 'Damage caused by an excluded peril may be covered if it results in a covered peril',
      favorable_to: 'insured',
      common_disputes: 'Fire after earthquake, collapse after earth movement'
    });
  }

  if (/actual cash value/i.test(clauseText)) {
    interpretations.push({
      phrase: 'Actual Cash Value (ACV)',
      meaning: 'Replacement cost minus depreciation',
      favorable_to: 'insurer',
      common_disputes: 'Depreciation schedules, useful life calculations, recoverable depreciation timing'
    });
  }

  if (/replacement cost/i.test(clauseText)) {
    interpretations.push({
      phrase: 'Replacement Cost (RCV)',
      meaning: 'Cost to replace with new materials of like kind and quality without depreciation',
      favorable_to: 'insured',
      common_disputes: 'Like kind and quality definition, upgrade vs. replacement, holdback of depreciation'
    });
  }

  if (/reasonable and necessary/i.test(clauseText)) {
    interpretations.push({
      phrase: 'Reasonable and Necessary',
      meaning: 'Expenses must be both reasonable in cost and necessary for the repair',
      favorable_to: 'insurer',
      common_disputes: 'Scope of necessary repairs, reasonable cost determination, betterment'
    });
  }

  if (/direct physical loss/i.test(clauseText)) {
    interpretations.push({
      phrase: 'Direct Physical Loss',
      meaning: 'Tangible, physical damage to property (not economic loss or loss of use alone)',
      favorable_to: 'insurer',
      common_disputes: 'Loss of use without physical damage, diminution in value, business interruption'
    });
  }

  return {
    clause_text: clauseText,
    interpretations: interpretations,
    ambiguity_level: interpretations.length > 0 ? 'standard' : 'clear'
  };
}

/**
 * Get standard policy language for specific coverage
 * @param {string} coverageType - Type of coverage (e.g., 'dwelling', 'water_damage')
 * @param {string} policyForm - Policy form type
 * @returns {Object} Standard language and interpretation
 */
function getStandardLanguage(coverageType, policyForm = 'HO-3') {
  const form = STANDARD_POLICY_FORMS[policyForm];
  if (!form) {
    return null;
  }

  const languageMap = {
    'dwelling': {
      standard_language: 'We cover direct physical loss to the property described in Coverage A caused by a peril listed below unless the loss is excluded.',
      interpretation: 'Open-peril coverage for dwelling (all risks except those specifically excluded)',
      coverage_trigger: 'Direct physical loss from non-excluded peril'
    },
    'personal_property': {
      standard_language: form.coverage_basis.personal_property === 'open-peril' 
        ? 'We cover direct physical loss to personal property caused by any peril unless excluded'
        : 'We cover direct physical loss to personal property caused by the following perils: [named perils list]',
      interpretation: form.coverage_basis.personal_property === 'open-peril'
        ? 'Open-peril coverage (all risks except exclusions)'
        : 'Named-peril coverage (only listed perils covered)',
      coverage_trigger: form.coverage_basis.personal_property === 'open-peril'
        ? 'Any non-excluded peril'
        : 'Fire, lightning, windstorm, hail, explosion, riot, aircraft, vehicles, smoke, vandalism, theft, falling objects, weight of ice/snow/sleet, water damage (sudden/accidental), electrical surge'
    },
    'loss_of_use': {
      standard_language: 'If a covered loss makes your residence premises uninhabitable, we cover the Additional Living Expense (ALE) necessary to maintain your normal standard of living.',
      interpretation: 'Covers increased living costs while home is uninhabitable due to covered loss',
      coverage_trigger: 'Covered loss rendering home uninhabitable'
    }
  };

  return languageMap[coverageType] || null;
}

module.exports = {
  STANDARD_POLICY_FORMS,
  STANDARD_EXCLUSIONS_DETAIL,
  COMMON_ENDORSEMENTS,
  CARRIER_SPECIFIC_LANGUAGE,
  analyzeCoverageForDamage,
  detectCoverageGaps,
  interpretClause,
  getStandardLanguage
};
