/**
 * LEGAL PRECEDENT DATABASE
 * 
 * Case law, legal standards, and jurisdiction-specific rules for insurance claims
 * NO AI - Pure legal knowledge base with citation tracking
 * 
 * Provides legal precedents, bad faith standards, and jurisdiction-specific claim handling rules
 */

const LEGAL_STANDARDS_BY_JURISDICTION = {
  'California': {
    state_code: 'CA',
    bad_faith_standard: 'Implied covenant of good faith and fair dealing',
    key_statutes: [
      { code: 'Cal. Ins. Code § 790.03', description: 'Unfair Claims Settlement Practices Act', key_provisions: 'Prohibits misrepresenting policy provisions, failing to acknowledge claims promptly, not attempting good faith settlement' },
      { code: 'Cal. Civ. Code § 3294', description: 'Punitive Damages', key_provisions: 'Available for oppression, fraud, or malice; requires clear and convincing evidence' },
      { code: 'Cal. Ins. Code § 2071', description: 'Appraisal Process', key_provisions: 'Either party may demand appraisal for amount of loss disputes' }
    ],
    claim_handling_deadlines: {
      acknowledgment: '15 calendar days',
      investigation_decision: '40 calendar days (most claims), 85 days (if proof of loss required)',
      payment_after_agreement: '30 calendar days'
    },
    bad_faith_triggers: [
      'Unreasonable delay in investigation',
      'Failure to conduct adequate investigation',
      'Denial without reasonable basis',
      'Lowball settlement offers',
      'Failure to explain denial reasons',
      'Misrepresenting policy language'
    ],
    key_cases: [
      {
        citation: 'Egan v. Mutual of Omaha Ins. Co., 24 Cal.3d 809 (1979)',
        holding: 'Insurer must give at least as much consideration to insured\'s interests as its own',
        application: 'Foundation for bad faith claims; duty of good faith and fair dealing'
      },
      {
        citation: 'Comunale v. Traders & General Ins. Co., 50 Cal.2d 654 (1958)',
        holding: 'Insurer has duty to accept reasonable settlement within policy limits',
        application: 'Failure to settle within limits may expose insurer to excess judgment'
      },
      {
        citation: 'Wilson v. 21st Century Ins. Co., 42 Cal.4th 713 (2007)',
        holding: 'Insured must prove genuine dispute to avoid bad faith liability',
        application: 'Reasonable basis for denial is defense to bad faith'
      }
    ],
    attorney_fee_recovery: 'Available under Brandt v. Superior Court (1985) - insured can recover attorney fees in bad faith cases'
  },
  'Texas': {
    state_code: 'TX',
    bad_faith_standard: 'Statutory bad faith (no common law bad faith)',
    key_statutes: [
      { code: 'Tex. Ins. Code § 541.060', description: 'Unfair Settlement Practices', key_provisions: 'Prohibits misrepresenting facts, failing to acknowledge claims, not attempting good faith settlement' },
      { code: 'Tex. Ins. Code § 542.003', description: 'Prompt Payment of Claims', key_provisions: 'Requires acknowledgment within 15 days, decision within 15 days of receiving all materials' },
      { code: 'Tex. Ins. Code § 542.060', description: 'Penalty and Interest', key_provisions: '18% annual interest + 18% penalty for unreasonable delay' }
    ],
    claim_handling_deadlines: {
      acknowledgment: '15 calendar days',
      investigation_decision: '15 business days after receiving all materials',
      payment_after_agreement: '5 business days'
    },
    bad_faith_triggers: [
      'Delay beyond statutory deadlines',
      'Failure to conduct reasonable investigation',
      'Denial without reasonable basis',
      'Misrepresenting policy provisions',
      'Refusing to pay without conducting reasonable investigation'
    ],
    key_cases: [
      {
        citation: 'USAA Texas Lloyds Co. v. Menchaca, 545 S.W.3d 479 (Tex. 2018)',
        holding: 'Policy ambiguities construed in favor of insured',
        application: 'Contra proferentem rule - ambiguous policy language favors coverage'
      },
      {
        citation: 'State Farm Lloyds v. Polasek, 847 S.W.2d 279 (Tex. App. 1992)',
        holding: 'Insurer must conduct reasonable investigation before denying claim',
        application: 'Failure to investigate is basis for bad faith penalty'
      },
      {
        citation: 'Vail v. Texas Farm Bureau Mut. Ins. Co., 754 S.W.2d 129 (Tex. 1988)',
        holding: 'Insured can recover policy benefits, statutory penalty, attorney fees, and prejudgment interest',
        application: 'Damages available for prompt payment violations'
      }
    ],
    attorney_fee_recovery: 'Available under Tex. Civ. Prac. & Rem. Code § 38.001 for breach of contract claims'
  },
  'Florida': {
    state_code: 'FL',
    bad_faith_standard: 'Statutory bad faith (Fla. Stat. § 624.155)',
    key_statutes: [
      { code: 'Fla. Stat. § 624.155', description: 'Civil Remedy for Bad Faith', key_provisions: 'Requires civil remedy notice 60 days before filing suit; insurer has 60 days to cure' },
      { code: 'Fla. Stat. § 627.70131', description: 'Property Insurance Claim Handling', key_provisions: 'Requires acknowledgment within 14 days, investigation within 90 days, payment within 90 days' },
      { code: 'Fla. Stat. § 627.428', description: 'Attorney Fees', key_provisions: 'Insured can recover attorney fees if insurer loses coverage dispute' }
    ],
    claim_handling_deadlines: {
      acknowledgment: '14 calendar days',
      investigation_decision: '90 calendar days',
      payment_after_agreement: '90 calendar days (or 20 days after proof of loss)'
    },
    bad_faith_triggers: [
      'Failure to pay within 90 days without reasonable basis',
      'Not attempting good faith settlement',
      'Misrepresenting policy provisions',
      'Failing to conduct adequate investigation',
      'Refusing to pay without reasonable investigation'
    ],
    key_cases: [
      {
        citation: 'Berges v. Infinity Ins. Co., 896 So.2d 665 (Fla. 2004)',
        holding: 'Bad faith requires showing insurer had no reasonable basis for denial and knew or recklessly disregarded lack of basis',
        application: 'Two-prong test for statutory bad faith'
      },
      {
        citation: 'Vest v. Travelers Ins. Co., 753 So.2d 1270 (Fla. 2000)',
        holding: 'Insured must give insurer opportunity to cure via civil remedy notice',
        application: 'Pre-suit notice requirement for bad faith claims'
      },
      {
        citation: 'QBE Ins. Corp. v. Chalfonte Condo. Apt. Assoc., 94 So.3d 541 (Fla. 2012)',
        holding: 'Appraisal determines amount of loss, not coverage or causation',
        application: 'Appraisal scope limitations'
      }
    ],
    attorney_fee_recovery: 'Available under Fla. Stat. § 627.428 if insured prevails on coverage dispute'
  },
  'New York': {
    state_code: 'NY',
    bad_faith_standard: 'Common law bad faith (limited) + statutory violations',
    key_statutes: [
      { code: 'N.Y. Ins. Law § 2601', description: 'Unfair Claim Settlement Practices', key_provisions: 'Prohibits misrepresenting facts, failing to acknowledge claims, not attempting good faith settlement' },
      { code: '11 NYCRR 216', description: 'Claims Settlement Regulations', key_provisions: 'Requires prompt investigation, reasonable settlement offers, clear denial explanations' },
      { code: 'N.Y. Ins. Law § 3420', description: 'Proof of Loss', key_provisions: 'Insured must provide proof of loss within 60 days; insurer may require sworn proof' }
    ],
    claim_handling_deadlines: {
      acknowledgment: '15 business days',
      investigation_decision: '30 calendar days (may extend with notice)',
      payment_after_agreement: '30 calendar days'
    },
    bad_faith_triggers: [
      'Unreasonable delay in payment',
      'Failure to conduct adequate investigation',
      'Denial without reasonable explanation',
      'Misrepresenting policy terms',
      'Refusing to negotiate in good faith'
    ],
    key_cases: [
      {
        citation: 'Rocanova v. Equitable Life Assurance Society, 83 N.Y.2d 603 (1994)',
        holding: 'No separate tort for bad faith in New York; remedies limited to breach of contract',
        application: 'Insureds cannot sue for bad faith tort; must pursue breach of contract and statutory violations'
      },
      {
        citation: 'Bi-Economy Market, Inc. v. Harleysville Ins. Co., 10 N.Y.3d 187 (2008)',
        holding: 'Insurer must prove exclusion applies; insured need only prove covered loss occurred',
        application: 'Burden of proof for exclusions is on insurer'
      }
    ],
    attorney_fee_recovery: 'Generally not available unless specific statute or policy provision allows'
  },
  'Illinois': {
    state_code: 'IL',
    bad_faith_standard: 'Common law bad faith (vexatious and unreasonable conduct)',
    key_statutes: [
      { code: '215 ILCS 5/154.6', description: 'Unfair Claims Settlement Practices', key_provisions: 'Prohibits misrepresenting facts, failing to acknowledge claims, not attempting good faith settlement' },
      { code: '215 ILCS 5/155', description: 'Vexatious and Unreasonable Delay', key_provisions: 'Allows damages and attorney fees for vexatious and unreasonable delay or denial' },
      { code: '50 Ill. Admin. Code 919', description: 'Claims Settlement Practices', key_provisions: 'Requires prompt acknowledgment, reasonable investigation, timely payment' }
    ],
    claim_handling_deadlines: {
      acknowledgment: '15 working days',
      investigation_decision: 'Reasonable time (no specific deadline)',
      payment_after_agreement: '30 calendar days'
    },
    bad_faith_triggers: [
      'Vexatious delay in payment',
      'Unreasonable denial',
      'Failure to investigate',
      'Lowball settlement offers',
      'Misrepresenting policy language'
    ],
    key_cases: [
      {
        citation: 'Cramer v. Insurance Exchange Agency, 174 Ill.2d 513 (1996)',
        holding: 'Insured must prove: (1) insurer lacked reasonable basis for denial, (2) insurer knew or recklessly disregarded lack of basis',
        application: 'Two-prong test for vexatious and unreasonable conduct'
      },
      {
        citation: 'Crum & Forster Managers Corp. v. Resolution Trust Corp., 156 Ill.2d 384 (1993)',
        holding: 'Insurer has duty to settle within policy limits when liability is clear',
        application: 'Failure to settle may expose insurer to excess judgment'
      }
    ],
    attorney_fee_recovery: 'Available under 215 ILCS 5/155 for vexatious and unreasonable delay'
  }
};

const LEGAL_DOCTRINES = {
  'Reasonable Expectations': {
    description: 'Policy should be interpreted to match reasonable expectations of average insured',
    jurisdictions: ['California', 'New Jersey', 'Montana', 'Washington'],
    application: 'Ambiguous policy language construed in favor of coverage',
    insured_advantage: 'high'
  },
  'Contra Proferentem': {
    description: 'Ambiguous policy language construed against drafter (insurer)',
    jurisdictions: ['All states'],
    application: 'When policy language has multiple reasonable interpretations, choose interpretation favoring insured',
    insured_advantage: 'high'
  },
  'Efficient Proximate Cause': {
    description: 'Coverage determined by predominant cause in chain of causation',
    jurisdictions: ['California', 'Washington', 'North Dakota'],
    application: 'If covered peril is predominant cause, loss is covered even if excluded peril contributed',
    insured_advantage: 'high'
  },
  'Concurrent Causation': {
    description: 'If covered and excluded perils act concurrently, loss is covered',
    jurisdictions: ['California (pre-1984, limited application)'],
    application: 'When multiple perils act together, covered peril triggers coverage',
    insured_advantage: 'high'
  },
  'Anti-Concurrent Causation Clause': {
    description: 'Excludes loss if excluded peril contributes in any sequence',
    jurisdictions: ['Most states (policy-dependent)'],
    application: 'Defeats efficient proximate cause doctrine; if excluded peril contributes at all, no coverage',
    insured_advantage: 'low'
  },
  'Duty to Defend': {
    description: 'Insurer must defend insured in lawsuits if any allegation potentially covered',
    jurisdictions: ['All states (liability policies)'],
    application: 'Duty to defend is broader than duty to indemnify',
    insured_advantage: 'high'
  }
};

const BAD_FAITH_ELEMENTS = {
  'California': {
    elements: [
      'Benefits due under policy',
      'Insurer withheld benefits',
      'Insurer acted unreasonably or without proper cause'
    ],
    damages_available: [
      'Policy benefits',
      'Consequential damages (emotional distress, economic loss)',
      'Punitive damages (if malice, oppression, or fraud)'
    ],
    burden_of_proof: 'Preponderance of evidence (punitive damages require clear and convincing evidence)',
    statute_of_limitations: '2 years (breach of contract), 4 years (bad faith tort)'
  },
  'Texas': {
    elements: [
      'Insurer had no reasonable basis for denial or delay',
      'Insurer knew or should have known there was no reasonable basis'
    ],
    damages_available: [
      'Policy benefits',
      '18% interest per annum',
      '18% penalty on amount of claim',
      'Attorney fees',
      'Consequential damages (if separate tort)'
    ],
    burden_of_proof: 'Preponderance of evidence',
    statute_of_limitations: '4 years (breach of contract), 2 years (statutory violations)'
  },
  'Florida': {
    elements: [
      'Insurer had no reasonable basis for denial or delay',
      'Insurer knew of or recklessly disregarded lack of reasonable basis',
      'Civil remedy notice given 60 days prior',
      'Insurer failed to cure within 60 days'
    ],
    damages_available: [
      'Policy benefits',
      'Consequential damages',
      'Punitive damages (if intentional misconduct)',
      'Attorney fees and costs'
    ],
    burden_of_proof: 'Preponderance of evidence',
    statute_of_limitations: '5 years (breach of contract), 4 years (bad faith)'
  },
  'New York': {
    elements: [
      'No separate tort for bad faith',
      'Must prove breach of contract',
      'May pursue statutory violations under N.Y. Ins. Law § 2601'
    ],
    damages_available: [
      'Policy benefits',
      'Consequential damages (limited)',
      'Statutory penalties (if applicable)',
      'Attorney fees (rarely available)'
    ],
    burden_of_proof: 'Preponderance of evidence',
    statute_of_limitations: '6 years (breach of contract)'
  },
  'Illinois': {
    elements: [
      'Insurer lacked reasonable basis for denial',
      'Insurer knew or recklessly disregarded lack of reasonable basis',
      'Conduct was vexatious and unreasonable'
    ],
    damages_available: [
      'Policy benefits',
      'Damages for vexatious and unreasonable conduct',
      'Attorney fees',
      'Costs of litigation'
    ],
    burden_of_proof: 'Preponderance of evidence',
    statute_of_limitations: '5 years (breach of contract), 2 years (bad faith tort)'
  }
};

const APPRAISAL_STANDARDS = {
  'California': {
    trigger: 'Either party may demand appraisal for amount of loss disputes',
    scope: 'Amount of loss only (not coverage or causation)',
    process: 'Each party selects appraiser; appraisers select umpire; award by 2 of 3 is binding',
    binding: true,
    appealable: 'Limited grounds (fraud, misconduct, manifest error)',
    cost_allocation: 'Each party pays own appraiser; umpire cost split equally'
  },
  'Texas': {
    trigger: 'Either party may invoke appraisal per policy terms',
    scope: 'Amount of loss only (not coverage or causation)',
    process: 'Each party selects appraiser; appraisers select umpire; award by 2 of 3 is binding',
    binding: true,
    appealable: 'Limited grounds (fraud, misconduct, manifest error)',
    cost_allocation: 'Each party pays own appraiser; umpire cost split equally'
  },
  'Florida': {
    trigger: 'Either party may demand appraisal for amount of loss disputes',
    scope: 'Amount of loss only (not coverage or causation)',
    process: 'Each party selects appraiser; appraisers select umpire; award by 2 of 3 is binding',
    binding: true,
    appealable: 'Limited grounds (fraud, misconduct, manifest error)',
    cost_allocation: 'Each party pays own appraiser; umpire cost split equally',
    special_notes: 'Appraisal frequently used; some carriers attempt to avoid via litigation'
  }
};

const EVIDENCE_STANDARDS = {
  'Burden of Proof': {
    insured_burden: 'Prove covered loss occurred (prima facie case)',
    insurer_burden: 'Prove exclusion applies (affirmative defense)',
    standard: 'Preponderance of evidence (more likely than not)'
  },
  'Documentation Requirements': {
    'Proof of Loss': {
      description: 'Sworn statement of loss details, damages, and claim amount',
      deadline: '60 days from insurer request (may be extended)',
      consequences_of_failure: 'Claim denial for failure to cooperate'
    },
    'Examination Under Oath (EUO)': {
      description: 'Sworn testimony about claim circumstances',
      when_required: 'Insurer discretion (usually for suspected fraud or large claims)',
      consequences_of_failure: 'Claim denial for breach of policy conditions'
    },
    'Independent Medical Examination (IME)': {
      description: 'Medical exam by insurer-selected physician',
      when_required: 'Bodily injury claims',
      consequences_of_failure: 'Claim denial for failure to cooperate'
    }
  }
};

/**
 * Get legal standards for specific jurisdiction
 * @param {string} jurisdiction - State name or code
 * @returns {Object} Legal standards
 */
function getLegalStandards(jurisdiction) {
  const state = jurisdiction.toUpperCase();
  
  for (const [stateName, standards] of Object.entries(LEGAL_STANDARDS_BY_JURISDICTION)) {
    if (stateName.toUpperCase() === state || standards.state_code === state) {
      return standards;
    }
  }
  
  return null;
}

/**
 * Analyze bad faith potential based on insurer conduct
 * @param {Object} conduct - Insurer conduct details
 * @param {string} jurisdiction - State
 * @returns {Object} Bad faith analysis
 */
function analyzeBadFaithPotential(conduct, jurisdiction) {
  const standards = getLegalStandards(jurisdiction);
  if (!standards) {
    return { potential: 'unknown', reason: 'Jurisdiction not in database' };
  }

  const triggers = [];
  let severity = 'low';

  if (conduct.days_since_acknowledgment > parseInt(standards.claim_handling_deadlines.acknowledgment)) {
    triggers.push({
      trigger: 'Late acknowledgment',
      severity: 'medium',
      deadline: standards.claim_handling_deadlines.acknowledgment,
      actual: `${conduct.days_since_acknowledgment} days`,
      statute: standards.key_statutes.find(s => s.description.includes('Claims') || s.description.includes('Prompt Payment'))?.code
    });
    severity = 'medium';
  }

  if (conduct.days_since_claim > parseInt(standards.claim_handling_deadlines.investigation_decision)) {
    triggers.push({
      trigger: 'Unreasonable delay in investigation/decision',
      severity: 'high',
      deadline: standards.claim_handling_deadlines.investigation_decision,
      actual: `${conduct.days_since_claim} days`,
      statute: standards.key_statutes.find(s => s.description.includes('Prompt Payment') || s.description.includes('Settlement'))?.code
    });
    severity = 'high';
  }

  if (conduct.lowball_offer && conduct.offer_percentage < 50) {
    triggers.push({
      trigger: 'Lowball settlement offer',
      severity: 'high',
      offer_amount: conduct.offer_amount,
      valuation: conduct.valuation,
      offer_percentage: `${conduct.offer_percentage}%`,
      statute: standards.key_statutes.find(s => s.description.includes('Unfair'))?.code
    });
    severity = 'high';
  }

  if (conduct.inadequate_investigation) {
    triggers.push({
      trigger: 'Inadequate investigation',
      severity: 'critical',
      details: conduct.investigation_deficiencies,
      statute: standards.key_statutes.find(s => s.description.includes('Unfair') || s.description.includes('Settlement'))?.code
    });
    severity = 'critical';
  }

  if (conduct.denial_without_explanation) {
    triggers.push({
      trigger: 'Denial without adequate explanation',
      severity: 'critical',
      statute: standards.key_statutes.find(s => s.description.includes('Unfair'))?.code
    });
    severity = 'critical';
  }

  const badFaithElements = BAD_FAITH_ELEMENTS[jurisdiction];

  return {
    jurisdiction: jurisdiction,
    bad_faith_potential: severity,
    triggers: triggers,
    legal_elements: badFaithElements?.elements || [],
    available_damages: badFaithElements?.damages_available || [],
    recommended_actions: generateBadFaithRecommendations(triggers, standards, badFaithElements),
    relevant_cases: standards.key_cases.filter(c => 
      triggers.some(t => c.holding.toLowerCase().includes(t.trigger.toLowerCase().split(' ')[0]))
    )
  };
}

/**
 * Generate recommendations for bad faith claim
 * @param {Array} triggers - Identified triggers
 * @param {Object} standards - Legal standards
 * @param {Object} elements - Bad faith elements
 * @returns {Array} Recommendations
 */
function generateBadFaithRecommendations(triggers, standards, elements) {
  const recommendations = [];

  if (triggers.length === 0) {
    return ['Continue documenting all insurer communications and delays'];
  }

  if (triggers.some(t => t.severity === 'critical')) {
    recommendations.push('Consult with insurance bad faith attorney immediately');
    recommendations.push('Document all communications, delays, and inadequate investigation details');
  }

  if (standards.state_code === 'FL' && triggers.length > 0) {
    recommendations.push('Prepare Civil Remedy Notice per Fla. Stat. § 624.155 (required 60 days before suit)');
  }

  if (standards.state_code === 'TX' && triggers.some(t => t.trigger.includes('delay'))) {
    recommendations.push('Calculate 18% penalty and interest under Tex. Ins. Code § 542.060');
  }

  if (triggers.some(t => t.trigger.includes('Lowball'))) {
    recommendations.push('Obtain independent appraisal to establish reasonable settlement value');
    recommendations.push('Consider invoking appraisal clause to establish amount of loss');
  }

  if (triggers.some(t => t.trigger.includes('investigation'))) {
    recommendations.push('Document all investigation deficiencies (failure to inspect, interview, review evidence)');
    recommendations.push('Prepare detailed timeline of insurer conduct');
  }

  recommendations.push(`Review ${elements?.statute_of_limitations || 'statute of limitations'} for timely filing`);

  return recommendations;
}

/**
 * Get appraisal guidance for jurisdiction
 * @param {string} jurisdiction - State
 * @returns {Object} Appraisal standards
 */
function getAppraisalGuidance(jurisdiction) {
  return APPRAISAL_STANDARDS[jurisdiction] || {
    trigger: 'Check policy for appraisal clause',
    scope: 'Typically amount of loss only',
    binding: true,
    note: 'Specific standards not in database for this jurisdiction'
  };
}

module.exports = {
  LEGAL_STANDARDS_BY_JURISDICTION,
  LEGAL_DOCTRINES,
  BAD_FAITH_ELEMENTS,
  APPRAISAL_STANDARDS,
  EVIDENCE_STANDARDS,
  getLegalStandards,
  analyzeBadFaithPotential,
  getAppraisalGuidance
};
