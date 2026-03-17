/**
 * NEGOTIATION STRATEGY DATABASE
 * 
 * Proven negotiation tactics, settlement strategies, and leverage points
 * NO AI - Expert negotiation frameworks and tactical playbooks
 * 
 * Contains battle-tested negotiation strategies for insurance claim settlements
 */

const NEGOTIATION_FRAMEWORKS = {
  'Anchoring Strategy': {
    description: 'Set initial demand to anchor negotiation range',
    when_to_use: 'First demand letter or settlement negotiation',
    tactics: [
      'Demand 125-150% of actual valuation to create negotiation room',
      'Justify high anchor with detailed documentation',
      'Never accept first offer (typically 40-60% of demand)',
      'Use independent appraisals to support high anchor'
    ],
    psychological_basis: 'First number sets reference point for all subsequent negotiations',
    success_rate: 'High (70-80% achieve better settlements than those who anchor low)'
  },
  'Deadline Pressure': {
    description: 'Use statutory deadlines and time pressure to force carrier action',
    when_to_use: 'When carrier is delaying or slow-walking',
    tactics: [
      'Cite state-specific claim handling deadlines in all communications',
      'Set reasonable deadlines for carrier response (7-14 days)',
      'Reference bad faith implications of continued delay',
      'Escalate to supervisor if deadlines missed'
    ],
    psychological_basis: 'Adjusters respond to accountability and deadline pressure',
    success_rate: 'Medium-High (60-75% see faster response)'
  },
  'Evidence Overwhelming': {
    description: 'Provide such comprehensive documentation that denial becomes indefensible',
    when_to_use: 'When carrier disputes scope, causation, or valuation',
    tactics: [
      'Obtain multiple independent estimates (3+ contractors)',
      'Hire expert witnesses (engineers, appraisers)',
      'Document every item with photos, videos, receipts',
      'Provide market pricing data for all line items',
      'Create detailed damage timeline with evidence'
    ],
    psychological_basis: 'Adjusters settle when defense becomes more expensive than payment',
    success_rate: 'Very High (80-90% with comprehensive evidence package)'
  },
  'Appraisal Leverage': {
    description: 'Invoke or threaten appraisal to force fair valuation',
    when_to_use: 'Amount of loss dispute (not coverage dispute)',
    tactics: [
      'Formally invoke appraisal clause in writing',
      'Select highly credentialed appraiser',
      'Prepare detailed scope and pricing documentation for appraiser',
      'Use appraisal threat to force negotiation before incurring costs'
    ],
    psychological_basis: 'Appraisal removes carrier control over valuation; often results in higher awards',
    success_rate: 'Very High (85-95% achieve better outcome than carrier\'s initial offer)'
  },
  'Bad Faith Threat': {
    description: 'Reference bad faith implications to encourage fair settlement',
    when_to_use: 'When carrier conduct is unreasonable, delayed, or in bad faith',
    tactics: [
      'Document all unreasonable conduct',
      'Cite specific bad faith statutes and case law',
      'Reference potential for consequential damages, penalties, attorney fees',
      'Send formal bad faith warning letter (or civil remedy notice in FL)',
      'Involve attorney for credibility'
    ],
    psychological_basis: 'Bad faith exposure (penalties, attorney fees, punitive damages) exceeds claim value',
    success_rate: 'High (75-85% when legitimate bad faith conduct documented)',
    caution: 'Only use when genuine bad faith conduct exists; false accusations harm credibility'
  },
  'Regulatory Complaint': {
    description: 'File or threaten complaint with state Department of Insurance',
    when_to_use: 'When carrier violates state regulations or engages in unfair practices',
    tactics: [
      'Document specific regulatory violations',
      'File formal complaint with state DOI',
      'Reference complaint in communications with carrier',
      'Request DOI investigation of carrier practices'
    ],
    psychological_basis: 'Carriers fear regulatory scrutiny, fines, and pattern-of-practice investigations',
    success_rate: 'Medium-High (65-80% see improved response after DOI complaint)',
    timeline: 'DOI investigations take 30-90 days; may accelerate settlement'
  }
};

const SETTLEMENT_FORMULAS = {
  'Initial Demand': {
    formula: 'Actual Valuation × 1.25 to 1.50',
    rationale: 'Creates negotiation room while remaining defensible',
    documentation_required: ['Independent estimate', 'Market pricing data', 'Damage photos', 'Expert reports (if applicable)']
  },
  'Minimum Acceptable Settlement': {
    formula: 'Actual Valuation × 0.85 to 0.95',
    rationale: 'Accounts for negotiation costs, time value, and risk of litigation',
    considerations: ['Attorney fees if hired', 'Time to resolution', 'Litigation risk and cost', 'Strength of evidence']
  },
  'Counter-Offer Response': {
    formula: '(Initial Demand + Carrier Offer) ÷ 2, then add 10-20%',
    rationale: 'Moves toward middle ground while maintaining leverage',
    tactics: ['Never accept first offer', 'Counter with detailed justification', 'Cite specific line-item disputes']
  },
  'Final Settlement Range': {
    formula: 'Actual Valuation × 0.90 to 1.10',
    rationale: 'Most claims settle within 10% of actual value after negotiation',
    success_factors: ['Strong documentation', 'Expert opinions', 'Attorney involvement', 'Appraisal threat or completion']
  }
};

const LEVERAGE_POINTS = {
  'Statutory Violations': {
    leverage_level: 'critical',
    examples: [
      'Missed claim handling deadlines',
      'Failure to acknowledge claim',
      'Unreasonable delay in payment',
      'Denial without adequate explanation'
    ],
    how_to_use: 'Cite specific statute violated; reference penalties and attorney fees; threaten regulatory complaint',
    potential_damages: 'Statutory penalties (18% in TX), interest, attorney fees, bad faith damages'
  },
  'Bad Faith Conduct': {
    leverage_level: 'critical',
    examples: [
      'Inadequate investigation',
      'Lowball offers without justification',
      'Misrepresenting policy language',
      'Ignoring evidence'
    ],
    how_to_use: 'Document conduct; cite bad faith case law; involve attorney; send bad faith warning letter',
    potential_damages: 'Consequential damages, punitive damages, attorney fees, policy benefits'
  },
  'Expert Opinions': {
    leverage_level: 'high',
    examples: [
      'Independent appraiser valuation',
      'Engineer causation report',
      'Contractor scope assessment',
      'Public adjuster representation'
    ],
    how_to_use: 'Obtain credentialed expert reports; submit with demand; reference expert credentials',
    potential_damages: 'Increases settlement value by 20-40% on average'
  },
  'Multiple Estimates': {
    leverage_level: 'medium-high',
    examples: [
      '3+ contractor estimates',
      'Independent appraiser estimate',
      'Public adjuster estimate'
    ],
    how_to_use: 'Submit all estimates; highlight consistency across estimates; challenge carrier\'s outlier estimate',
    potential_damages: 'Increases settlement by 15-30% when estimates align'
  },
  'Appraisal Clause': {
    leverage_level: 'high',
    examples: [
      'Formal appraisal demand',
      'Selection of credentialed appraiser',
      'Appraisal award'
    ],
    how_to_use: 'Invoke appraisal for amount of loss disputes; select strong appraiser; prepare comprehensive documentation',
    potential_damages: 'Appraisal awards typically 30-50% higher than carrier\'s initial offer'
  },
  'Attorney Involvement': {
    leverage_level: 'high',
    examples: [
      'Demand letter from attorney',
      'Attorney representation notice',
      'Litigation threat'
    ],
    how_to_use: 'Hire attorney for complex or high-value claims; attorney demand letters receive priority handling',
    potential_damages: 'Increases settlement by 25-40% on average (net of attorney fees)'
  },
  'Public Adjuster': {
    leverage_level: 'medium-high',
    examples: [
      'PA representation',
      'PA estimate and documentation',
      'PA negotiation'
    ],
    how_to_use: 'Hire PA for complex claims; PA provides expert documentation and negotiation',
    potential_damages: 'Increases settlement by 30-50% on average (net of PA fees, typically 10-15%)'
  },
  'Regulatory Complaint': {
    leverage_level: 'medium',
    examples: [
      'DOI complaint filed',
      'DOI investigation pending',
      'Pattern of practice allegations'
    ],
    how_to_use: 'File complaint for regulatory violations; reference in communications; request DOI intervention',
    potential_damages: 'Increases settlement likelihood by 20-30%; may accelerate resolution'
  }
};

const NEGOTIATION_PHASES = {
  'Phase 1: Initial Demand': {
    timing: 'After damage assessment and documentation complete',
    objective: 'Establish high anchor and set negotiation tone',
    key_actions: [
      'Submit comprehensive demand package',
      'Include all documentation (estimates, photos, reports)',
      'Set demand at 125-150% of actual valuation',
      'Provide 14-21 day response deadline',
      'Reference policy provisions supporting coverage'
    ],
    expected_carrier_response: 'Lowball counter-offer (40-70% of demand)',
    success_metrics: 'Carrier engages in negotiation; does not deny outright'
  },
  'Phase 2: Counter-Offer Negotiation': {
    timing: 'After receiving carrier\'s initial offer',
    objective: 'Narrow gap while maintaining leverage',
    key_actions: [
      'Reject lowball offer with detailed rebuttal',
      'Counter at 80-90% of initial demand',
      'Provide additional documentation addressing carrier\'s objections',
      'Cite specific line-item disputes',
      'Reference comparable settlements or appraisal values'
    ],
    expected_carrier_response: 'Increased offer (60-80% of demand)',
    success_metrics: 'Gap narrows to <20% of actual valuation'
  },
  'Phase 3: Leverage Escalation': {
    timing: 'When negotiation stalls or carrier is unreasonable',
    objective: 'Apply pressure to force movement',
    key_actions: [
      'Invoke appraisal clause (if amount dispute)',
      'Send bad faith warning letter (if conduct warrants)',
      'Involve attorney',
      'File regulatory complaint',
      'Set final deadline before litigation'
    ],
    expected_carrier_response: 'Significant movement or settlement',
    success_metrics: 'Settlement at 85-100% of actual valuation'
  },
  'Phase 4: Final Resolution': {
    timing: 'When settlement range is narrow',
    objective: 'Close deal or proceed to appraisal/litigation',
    key_actions: [
      'Make final settlement demand',
      'Offer minor concessions to close gap',
      'Set hard deadline',
      'Prepare for appraisal or litigation if no agreement'
    ],
    expected_carrier_response: 'Final offer or agreement',
    success_metrics: 'Settlement at 90-105% of actual valuation'
  }
};

const TACTICAL_RESPONSES = {
  'Carrier Says: "Your estimate is too high"': {
    response: 'Provide 2-3 additional estimates from licensed contractors; cite market pricing data; offer to participate in joint inspection',
    leverage: 'Multiple consistent estimates are difficult to dispute',
    escalation: 'Invoke appraisal clause to have neutral umpire decide'
  },
  'Carrier Says: "This damage is pre-existing"': {
    response: 'Demand specific evidence of pre-existing condition; provide before photos, maintenance records, prior inspection reports; obtain expert report on causation',
    leverage: 'Insurer bears burden of proving exclusion; speculation is insufficient',
    escalation: 'Challenge denial in writing; cite burden of proof standards; involve attorney'
  },
  'Carrier Says: "We need more documentation"': {
    response: 'Ask for specific list of needed documents; provide all requested items with delivery confirmation; set deadline for decision after submission',
    leverage: 'Prevents indefinite delay; creates record of compliance',
    escalation: 'If requests are repetitive or unreasonable, cite bad faith delay; escalate to supervisor'
  },
  'Carrier Says: "This is our final offer"': {
    response: 'Reject if below valuation; provide detailed rebuttal; invoke appraisal or involve attorney; reference bad faith implications of unreasonable offer',
    leverage: '"Final offer" is negotiation tactic; carriers rarely litigate over reasonable gaps',
    escalation: 'Formal appraisal demand or attorney demand letter'
  },
  'Carrier Says: "This is not covered under your policy"': {
    response: 'Request denial in writing with specific policy language cited; obtain independent policy review; cite contra proferentem rule for ambiguous language',
    leverage: 'Ambiguous language favors insured; insurer must prove exclusion applies',
    escalation: 'Attorney review of denial; potential coverage litigation'
  },
  'Carrier Says: "You need to accept ACV now and RCV later"': {
    response: 'Review policy for RCV recovery terms; negotiate for higher ACV payment; document all repair costs for RCV recovery',
    leverage: 'ACV payment does not waive right to RCV; insurer cannot unreasonably delay RCV',
    escalation: 'If RCV withheld after repairs, demand payment with interest; cite bad faith delay'
  },
  'Carrier Says: "We will only pay for repair, not replacement"': {
    response: 'Cite replacement cost policy language; document that repair is inadequate or impossible; obtain contractor opinion that replacement is necessary',
    leverage: 'Replacement cost policies require replacement when repair is inadequate',
    escalation: 'Appraisal to determine whether repair or replacement is appropriate'
  },
  'Carrier Says: "We are still investigating"': {
    response: 'Request specific investigation tasks remaining and timeline; cite statutory investigation deadlines; set deadline for completion',
    leverage: 'Indefinite investigation is unreasonable delay',
    escalation: 'Send formal demand for decision; cite bad faith delay; file regulatory complaint'
  }
};

const SETTLEMENT_ZONE_ANALYSIS = {
  'Strong Position (Settlement 90-110% of valuation)': {
    indicators: [
      'Clear coverage (no legitimate disputes)',
      'Comprehensive documentation',
      'Multiple consistent estimates',
      'Expert opinions support claim',
      'Carrier has violated deadlines or engaged in bad faith conduct',
      'Attorney or public adjuster involved'
    ],
    strategy: 'Demand full valuation; minimal concessions; invoke appraisal or litigate if needed',
    concession_limit: '5-10% maximum'
  },
  'Moderate Position (Settlement 75-90% of valuation)': {
    indicators: [
      'Coverage is clear but amount disputed',
      'Good documentation but some gaps',
      'Single estimate or limited expert opinions',
      'Carrier is negotiating in good faith',
      'No significant bad faith conduct'
    ],
    strategy: 'Demand 125% of valuation; negotiate down to 80-90%; consider appraisal',
    concession_limit: '15-20% from initial demand'
  },
  'Weak Position (Settlement 60-75% of valuation)': {
    indicators: [
      'Coverage is disputed or ambiguous',
      'Documentation has gaps',
      'Carrier has reasonable basis for lower valuation',
      'Pre-existing conditions or maintenance issues',
      'Causation is unclear'
    ],
    strategy: 'Strengthen documentation; obtain expert opinions; negotiate for best achievable outcome',
    concession_limit: '25-35% from initial demand'
  },
  'Very Weak Position (Settlement <60% of valuation or denial)': {
    indicators: [
      'Legitimate coverage exclusion applies',
      'Insufficient evidence of covered loss',
      'Policy limits insufficient',
      'Insured contributed to loss (neglect, fraud)'
    ],
    strategy: 'Reassess claim viability; consider accepting reduced settlement; avoid litigation',
    concession_limit: 'Accept best available offer or withdraw claim'
  }
};

/**
 * Analyze negotiation position and recommend strategy
 * @param {Object} claimData - Claim financial and documentation data
 * @param {Object} carrierConduct - Carrier behavior and tactics
 * @param {string} jurisdiction - State
 * @returns {Object} Strategic analysis and recommendations
 */
function analyzeNegotiationPosition(claimData, carrierConduct, jurisdiction) {
  let positionStrength = 0;
  const strengths = [];
  const weaknesses = [];

  if (claimData.coverage_clear) {
    positionStrength += 25;
    strengths.push('Clear coverage with no legitimate exclusions');
  } else {
    weaknesses.push('Coverage is disputed or ambiguous');
  }

  if (claimData.documentation_score >= 80) {
    positionStrength += 20;
    strengths.push('Comprehensive documentation package');
  } else if (claimData.documentation_score >= 60) {
    positionStrength += 10;
    strengths.push('Adequate documentation with minor gaps');
  } else {
    weaknesses.push('Documentation has significant gaps');
  }

  if (claimData.independent_estimates >= 3) {
    positionStrength += 15;
    strengths.push('Multiple consistent independent estimates');
  } else if (claimData.independent_estimates >= 1) {
    positionStrength += 8;
    strengths.push('Independent estimate obtained');
  } else {
    weaknesses.push('No independent estimates');
  }

  if (claimData.expert_reports > 0) {
    positionStrength += 15;
    strengths.push('Expert opinions support claim');
  }

  if (carrierConduct.bad_faith_conduct) {
    positionStrength += 15;
    strengths.push('Carrier engaged in bad faith conduct (leverage for penalties/fees)');
  }

  if (carrierConduct.statutory_violations > 0) {
    positionStrength += 10;
    strengths.push('Carrier violated statutory deadlines or requirements');
  }

  if (claimData.attorney_involved) {
    positionStrength += 10;
    strengths.push('Attorney representation increases settlement leverage');
  }

  if (claimData.pre_existing_conditions) {
    positionStrength -= 15;
    weaknesses.push('Pre-existing conditions or maintenance issues');
  }

  if (claimData.causation_disputed) {
    positionStrength -= 20;
    weaknesses.push('Causation is disputed or unclear');
  }

  let positionCategory;
  if (positionStrength >= 80) {
    positionCategory = 'Strong Position (Settlement 90-110% of valuation)';
  } else if (positionStrength >= 60) {
    positionCategory = 'Moderate Position (Settlement 75-90% of valuation)';
  } else if (positionStrength >= 40) {
    positionCategory = 'Weak Position (Settlement 60-75% of valuation)';
  } else {
    positionCategory = 'Very Weak Position (Settlement <60% of valuation or denial)';
  }

  const positionDetails = SETTLEMENT_ZONE_ANALYSIS[positionCategory];

  return {
    position_strength: positionStrength,
    position_category: positionCategory,
    strengths: strengths,
    weaknesses: weaknesses,
    recommended_strategy: positionDetails.strategy,
    concession_limit: positionDetails.concession_limit,
    expected_settlement_range: positionCategory.match(/\d+-\d+%/)?.[0] || 'unknown',
    leverage_points: identifyLeveragePoints(claimData, carrierConduct),
    recommended_frameworks: recommendFrameworks(positionStrength, carrierConduct)
  };
}

/**
 * Identify specific leverage points
 * @param {Object} claimData - Claim data
 * @param {Object} carrierConduct - Carrier conduct
 * @returns {Array} Leverage points
 */
function identifyLeveragePoints(claimData, carrierConduct) {
  const leveragePoints = [];

  if (carrierConduct.statutory_violations > 0) {
    leveragePoints.push({
      ...LEVERAGE_POINTS['Statutory Violations'],
      specific_violations: carrierConduct.violations_list
    });
  }

  if (carrierConduct.bad_faith_conduct) {
    leveragePoints.push({
      ...LEVERAGE_POINTS['Bad Faith Conduct'],
      specific_conduct: carrierConduct.bad_faith_details
    });
  }

  if (claimData.expert_reports > 0) {
    leveragePoints.push(LEVERAGE_POINTS['Expert Opinions']);
  }

  if (claimData.independent_estimates >= 3) {
    leveragePoints.push(LEVERAGE_POINTS['Multiple Estimates']);
  }

  if (claimData.appraisal_available && !claimData.coverage_disputed) {
    leveragePoints.push(LEVERAGE_POINTS['Appraisal Clause']);
  }

  if (claimData.attorney_involved) {
    leveragePoints.push(LEVERAGE_POINTS['Attorney Involvement']);
  }

  return leveragePoints;
}

/**
 * Recommend negotiation frameworks
 * @param {number} positionStrength - Position strength score
 * @param {Object} carrierConduct - Carrier conduct
 * @returns {Array} Recommended frameworks
 */
function recommendFrameworks(positionStrength, carrierConduct) {
  const frameworks = [];

  frameworks.push(NEGOTIATION_FRAMEWORKS['Anchoring Strategy']);

  if (carrierConduct.delaying) {
    frameworks.push(NEGOTIATION_FRAMEWORKS['Deadline Pressure']);
  }

  if (positionStrength >= 60) {
    frameworks.push(NEGOTIATION_FRAMEWORKS['Evidence Overwhelming']);
  }

  if (carrierConduct.amount_disputed && !carrierConduct.coverage_disputed) {
    frameworks.push(NEGOTIATION_FRAMEWORKS['Appraisal Leverage']);
  }

  if (carrierConduct.bad_faith_conduct) {
    frameworks.push(NEGOTIATION_FRAMEWORKS['Bad Faith Threat']);
  }

  if (carrierConduct.statutory_violations > 0) {
    frameworks.push(NEGOTIATION_FRAMEWORKS['Regulatory Complaint']);
  }

  return frameworks;
}

/**
 * Calculate optimal demand amount
 * @param {number} actualValuation - True claim value
 * @param {Object} positionAnalysis - Position strength analysis
 * @returns {Object} Demand calculation
 */
function calculateOptimalDemand(actualValuation, positionAnalysis) {
  let multiplier = 1.25;

  if (positionAnalysis.position_strength >= 80) {
    multiplier = 1.15;
  } else if (positionAnalysis.position_strength >= 60) {
    multiplier = 1.25;
  } else if (positionAnalysis.position_strength >= 40) {
    multiplier = 1.35;
  } else {
    multiplier = 1.50;
  }

  const demandAmount = Math.round(actualValuation * multiplier);
  const minimumAcceptable = Math.round(actualValuation * 0.90);

  return {
    actual_valuation: actualValuation,
    recommended_demand: demandAmount,
    demand_multiplier: multiplier,
    minimum_acceptable: minimumAcceptable,
    negotiation_room: demandAmount - minimumAcceptable,
    rationale: `Demand set at ${(multiplier * 100).toFixed(0)}% of actual valuation based on position strength of ${positionAnalysis.position_strength}/100`
  };
}

/**
 * Generate tactical response to carrier communication
 * @param {string} carrierStatement - What carrier said
 * @param {Object} claimContext - Claim context
 * @returns {Object} Recommended response
 */
function generateTacticalResponse(carrierStatement, claimContext) {
  const normalizedStatement = carrierStatement.toLowerCase();
  
  for (const [carrierSays, response] of Object.entries(TACTICAL_RESPONSES)) {
    const key = carrierSays.replace('Carrier Says: "', '').replace('"', '').toLowerCase();
    if (normalizedStatement.includes(key.substring(0, 20))) {
      return {
        carrier_statement: carrierStatement,
        recommended_response: response.response,
        leverage_point: response.leverage,
        escalation_option: response.escalation,
        tone: claimContext.attorney_involved ? 'firm-professional' : 'professional-assertive'
      };
    }
  }

  return {
    carrier_statement: carrierStatement,
    recommended_response: 'Request clarification in writing; document statement; respond with evidence-based rebuttal',
    leverage_point: 'Maintain documentation of all communications',
    escalation_option: 'Escalate to supervisor if unreasonable',
    tone: 'professional-assertive'
  };
}

module.exports = {
  NEGOTIATION_FRAMEWORKS,
  SETTLEMENT_FORMULAS,
  LEVERAGE_POINTS,
  NEGOTIATION_PHASES,
  TACTICAL_RESPONSES,
  analyzeNegotiationPosition,
  calculateOptimalDemand,
  generateTacticalResponse
};
