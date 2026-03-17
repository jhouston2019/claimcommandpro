/**
 * EVIDENCE STANDARDS DATABASE
 * 
 * Documentation requirements, evidence quality standards, and proof requirements by jurisdiction
 * NO AI - Expert knowledge of insurance claim documentation standards
 * 
 * Defines what evidence is needed for different claim types and jurisdictions
 */

const EVIDENCE_REQUIREMENTS_BY_CLAIM_TYPE = {
  'Water Damage': {
    critical_evidence: [
      { item: 'Photos of water source', quality: 'Clear photos showing leak location, pipe damage, or water intrusion point', timing: 'Immediate (before cleanup)' },
      { item: 'Photos of all affected areas', quality: 'Wide shots and close-ups of damage', timing: 'Before and during mitigation' },
      { item: 'Moisture readings', quality: 'Moisture meter readings with dates and locations', timing: 'Initial and follow-up during drying' },
      { item: 'Plumber report', quality: 'Licensed plumber invoice and report identifying cause', timing: 'Within 7 days of loss' },
      { item: 'Mitigation invoice', quality: 'Detailed invoice from water mitigation company', timing: 'After mitigation complete' }
    ],
    supporting_evidence: [
      { item: 'Before photos of property', quality: 'Photos showing pre-loss condition', timing: 'If available' },
      { item: 'Maintenance records', quality: 'Plumbing maintenance or inspection records', timing: 'Historical' },
      { item: 'Weather reports', quality: 'If claiming rain ingress or freeze event', timing: 'Date of loss' }
    ],
    documentation_timeline: '7-14 days for initial documentation; 30 days for complete package',
    common_deficiencies: [
      'No photos of water source',
      'Cleanup before documentation',
      'No moisture readings',
      'No plumber report on cause'
    ]
  },
  'Fire Damage': {
    critical_evidence: [
      { item: 'Fire department report', quality: 'Official report with cause determination', timing: 'Obtain within 14 days' },
      { item: 'Photos of fire damage', quality: 'Comprehensive photos of all affected areas', timing: 'Immediate (before cleanup)' },
      { item: 'Contents inventory', quality: 'Detailed list with descriptions, values, photos', timing: 'Within 30 days' },
      { item: 'Structural engineer report', quality: 'If structural damage suspected', timing: 'Within 30 days' },
      { item: 'Smoke remediation estimate', quality: 'Professional estimate for cleaning/restoration', timing: 'Within 21 days' }
    ],
    supporting_evidence: [
      { item: 'Before photos of property', quality: 'Photos showing pre-loss condition', timing: 'If available' },
      { item: 'Receipts for contents', quality: 'Purchase receipts, appraisals, or valuations', timing: 'Historical' },
      { item: 'Electrical inspection records', quality: 'If electrical fire suspected', timing: 'Historical' }
    ],
    documentation_timeline: '14-30 days for initial documentation; 60 days for complete package',
    common_deficiencies: [
      'No fire department report',
      'Incomplete contents inventory',
      'No structural assessment',
      'Cleanup before documentation'
    ]
  },
  'Wind/Hail Damage': {
    critical_evidence: [
      { item: 'Storm date documentation', quality: 'Weather service reports, news articles, or neighbor claims', timing: 'Within 7 days' },
      { item: 'Roof inspection report', quality: 'Licensed roofer or inspector report with photos', timing: 'Within 14 days' },
      { item: 'Photos of damage', quality: 'Close-ups of damaged shingles, flashing, or siding', timing: 'Immediate' },
      { item: 'Interior damage photos', quality: 'If water intrusion occurred', timing: 'Immediate' },
      { item: 'Damage to other surfaces', quality: 'Photos of damaged gutters, AC unit, vehicles (corroborates storm)', timing: 'Within 7 days' }
    ],
    supporting_evidence: [
      { item: 'Before photos of roof', quality: 'Photos showing pre-storm condition', timing: 'If available' },
      { item: 'Roof age documentation', quality: 'Installation date or prior inspection reports', timing: 'Historical' },
      { item: 'Maintenance records', quality: 'Roof maintenance or repair history', timing: 'Historical' }
    ],
    documentation_timeline: '7-14 days for initial documentation; 21 days for complete package',
    common_deficiencies: [
      'No storm date documentation',
      'No professional roof inspection',
      'Insufficient photos of damage',
      'No before photos to rebut pre-existing claims'
    ]
  },
  'Theft': {
    critical_evidence: [
      { item: 'Police report', quality: 'Official police report with case number', timing: 'Within 24-48 hours of discovery' },
      { item: 'Photos of forced entry', quality: 'Clear photos of broken locks, windows, doors', timing: 'Immediate (before repair)' },
      { item: 'Stolen items inventory', quality: 'Detailed list with descriptions, serial numbers, values', timing: 'Within 14 days' },
      { item: 'Receipts or proof of ownership', quality: 'Purchase receipts, photos, appraisals', timing: 'Within 30 days' },
      { item: 'Security system logs', quality: 'If available, alarm or camera footage', timing: 'Immediate' }
    ],
    supporting_evidence: [
      { item: 'Before photos of property', quality: 'Photos showing stolen items in place', timing: 'If available' },
      { item: 'Witness statements', quality: 'Neighbor or witness accounts', timing: 'Within 7 days' }
    ],
    documentation_timeline: '7-14 days for initial documentation; 30 days for complete package',
    common_deficiencies: [
      'No police report',
      'No proof of forced entry',
      'Insufficient proof of ownership',
      'No serial numbers for electronics'
    ]
  },
  'Vandalism': {
    critical_evidence: [
      { item: 'Police report', quality: 'Official police report', timing: 'Within 24-48 hours' },
      { item: 'Photos of vandalism', quality: 'Comprehensive photos of all damage', timing: 'Immediate (before cleanup)' },
      { item: 'Repair estimates', quality: 'Licensed contractor estimates', timing: 'Within 14 days' },
      { item: 'Occupancy documentation', quality: 'Proof property was not vacant >60 days', timing: 'If questioned' }
    ],
    supporting_evidence: [
      { item: 'Security camera footage', quality: 'If available', timing: 'Immediate' },
      { item: 'Witness statements', quality: 'Neighbor or witness accounts', timing: 'Within 7 days' }
    ],
    documentation_timeline: '7 days for initial documentation; 21 days for complete package',
    common_deficiencies: [
      'No police report',
      'Cleanup before documentation',
      'Cannot prove occupancy status'
    ]
  }
};

const EVIDENCE_QUALITY_STANDARDS = {
  'Photography': {
    minimum_standard: '3-5 photos per damaged area',
    best_practice: '10-20 photos per damaged area from multiple angles',
    requirements: [
      'Wide shots showing context and location',
      'Close-ups showing specific damage',
      'Measurements or scale references in frame',
      'Good lighting (natural light or flash)',
      'Date/time stamps enabled',
      'Before and after photos (if available)'
    ],
    common_mistakes: [
      'Too few photos',
      'Poor lighting or blurry images',
      'No context shots',
      'No scale reference',
      'Cleanup before photographing'
    ]
  },
  'Video Documentation': {
    minimum_standard: '2-5 minute walkthrough video',
    best_practice: '10-15 minute comprehensive video with narration',
    requirements: [
      'Slow pan of all affected areas',
      'Verbal narration describing damage',
      'Date/time stamp',
      'Show entire room/area for context',
      'Close-ups of specific damage',
      'Show water source or damage cause if visible'
    ],
    common_mistakes: [
      'Too fast (shaky or unclear)',
      'No narration',
      'Incomplete coverage of damage',
      'Poor lighting'
    ]
  },
  'Written Documentation': {
    minimum_standard: 'Detailed written description of damage',
    best_practice: 'Comprehensive damage report with timeline, cause, scope, and impact',
    requirements: [
      'Date and time of loss',
      'Cause of damage (as known)',
      'Discovery details',
      'Immediate actions taken',
      'All affected areas listed',
      'Estimated scope of damage',
      'Mitigation actions taken'
    ],
    common_mistakes: [
      'Vague descriptions',
      'No timeline',
      'Omits affected areas',
      'No mention of mitigation'
    ]
  },
  'Expert Reports': {
    minimum_standard: 'Report from licensed professional',
    best_practice: 'Detailed report with credentials, methodology, findings, and opinions',
    requirements: [
      'Professional credentials and license number',
      'Inspection date',
      'Methodology used',
      'Findings and observations',
      'Opinions on causation, scope, or cost',
      'Photos or diagrams',
      'Signature and certification'
    ],
    common_mistakes: [
      'Unlicensed or unqualified expert',
      'Vague or conclusory opinions',
      'No supporting methodology',
      'Insufficient detail'
    ]
  }
};

const PROOF_OF_LOSS_STANDARDS = {
  'Required Elements': [
    'Insured name and policy number',
    'Date and time of loss',
    'Cause of loss',
    'Location of loss',
    'Description of damaged property',
    'Amount of loss claimed',
    'Insured signature and date',
    'Sworn statement (if required by policy)'
  ],
  'Best Practices': [
    'Include "subject to supplementation" language',
    'Attach supporting documentation',
    'Be specific but avoid premature damage estimates',
    'Reserve right to amend as investigation continues',
    'Review with attorney before signing if complex claim'
  ],
  'Common Traps': [
    'Premature damage estimates (used against insured later)',
    'Admissions of pre-existing conditions',
    'Statements about maintenance (used to claim neglect)',
    'Overly detailed statements without evidence'
  ]
};

/**
 * Assess evidence completeness for claim type
 * @param {Object} submittedEvidence - Evidence submitted by insured
 * @param {string} claimType - Type of claim
 * @returns {Object} Completeness assessment
 */
function assessEvidenceCompleteness(submittedEvidence, claimType) {
  const requirements = EVIDENCE_REQUIREMENTS_BY_CLAIM_TYPE[claimType];
  if (!requirements) {
    return {
      completeness: 'unknown',
      reason: 'Claim type not in database'
    };
  }

  const criticalMissing = [];
  const criticalPresent = [];
  const supportingMissing = [];
  const supportingPresent = [];

  for (const req of requirements.critical_evidence) {
    const hasEvidence = submittedEvidence.items?.some(item => 
      item.type?.toLowerCase().includes(req.item.toLowerCase()) ||
      item.description?.toLowerCase().includes(req.item.toLowerCase())
    );

    if (hasEvidence) {
      criticalPresent.push(req.item);
    } else {
      criticalMissing.push(req);
    }
  }

  for (const req of requirements.supporting_evidence) {
    const hasEvidence = submittedEvidence.items?.some(item => 
      item.type?.toLowerCase().includes(req.item.toLowerCase()) ||
      item.description?.toLowerCase().includes(req.item.toLowerCase())
    );

    if (hasEvidence) {
      supportingPresent.push(req.item);
    } else {
      supportingMissing.push(req);
    }
  }

  const completenessScore = (criticalPresent.length / requirements.critical_evidence.length) * 100;

  let completenessLevel;
  if (completenessScore === 100) completenessLevel = 'complete';
  else if (completenessScore >= 80) completenessLevel = 'mostly complete';
  else if (completenessScore >= 60) completenessLevel = 'adequate';
  else if (completenessScore >= 40) completenessLevel = 'incomplete';
  else completenessLevel = 'severely deficient';

  return {
    claim_type: claimType,
    completeness_level: completenessLevel,
    completeness_score: Math.round(completenessScore),
    critical_evidence_present: criticalPresent,
    critical_evidence_missing: criticalMissing,
    supporting_evidence_present: supportingPresent,
    supporting_evidence_missing: supportingMissing,
    priority_actions: criticalMissing.map(req => ({
      action: `Obtain ${req.item}`,
      quality_standard: req.quality,
      deadline: req.timing
    })),
    claim_strength_impact: completenessScore >= 80 ? 'Strong documentation supports claim' :
                           completenessScore >= 60 ? 'Adequate documentation; strengthen with missing items' :
                           'Weak documentation; claim at risk of denial or lowball offer'
  };
}

/**
 * Generate evidence collection checklist
 * @param {string} claimType - Type of claim
 * @param {string} jurisdiction - State
 * @returns {Object} Evidence checklist
 */
function generateEvidenceChecklist(claimType, jurisdiction) {
  const requirements = EVIDENCE_REQUIREMENTS_BY_CLAIM_TYPE[claimType];
  if (!requirements) {
    return {
      available: false,
      reason: 'Claim type not in database'
    };
  }

  const checklist = {
    claim_type: claimType,
    jurisdiction: jurisdiction,
    critical_items: requirements.critical_evidence.map(req => ({
      item: req.item,
      quality_standard: req.quality,
      timing: req.timing,
      priority: 'critical'
    })),
    supporting_items: requirements.supporting_evidence.map(req => ({
      item: req.item,
      quality_standard: req.quality,
      timing: req.timing,
      priority: 'supporting'
    })),
    documentation_deadline: requirements.documentation_timeline,
    quality_standards: {
      photography: EVIDENCE_QUALITY_STANDARDS['Photography'],
      video: EVIDENCE_QUALITY_STANDARDS['Video Documentation'],
      written: EVIDENCE_QUALITY_STANDARDS['Written Documentation'],
      expert_reports: EVIDENCE_QUALITY_STANDARDS['Expert Reports']
    },
    common_deficiencies: requirements.common_deficiencies
  };

  return checklist;
}

/**
 * Validate evidence quality
 * @param {Object} evidence - Evidence item
 * @param {string} evidenceType - Type of evidence
 * @returns {Object} Quality assessment
 */
function validateEvidenceQuality(evidence, evidenceType) {
  const standards = EVIDENCE_QUALITY_STANDARDS[evidenceType];
  if (!standards) {
    return {
      valid: 'unknown',
      reason: 'Evidence type not in database'
    };
  }

  const qualityIssues = [];
  let qualityScore = 100;

  if (evidenceType === 'Photography') {
    if (!evidence.photo_count || evidence.photo_count < 3) {
      qualityIssues.push('Insufficient number of photos (minimum 3-5 per area)');
      qualityScore -= 30;
    }
    if (!evidence.includes_wide_shots) {
      qualityIssues.push('Missing wide context shots');
      qualityScore -= 15;
    }
    if (!evidence.includes_closeups) {
      qualityIssues.push('Missing close-up detail shots');
      qualityScore -= 15;
    }
    if (!evidence.has_timestamps) {
      qualityIssues.push('Photos lack date/time stamps');
      qualityScore -= 10;
    }
    if (evidence.poor_lighting) {
      qualityIssues.push('Poor lighting or blurry images');
      qualityScore -= 20;
    }
  }

  if (evidenceType === 'Expert Reports') {
    if (!evidence.professional_licensed) {
      qualityIssues.push('Expert is not licensed or credentials not verified');
      qualityScore -= 40;
    }
    if (!evidence.includes_methodology) {
      qualityIssues.push('Report lacks methodology or basis for opinions');
      qualityScore -= 25;
    }
    if (!evidence.includes_photos) {
      qualityIssues.push('Report lacks supporting photos or diagrams');
      qualityScore -= 15;
    }
    if (!evidence.signed_and_certified) {
      qualityIssues.push('Report not signed or certified');
      qualityScore -= 20;
    }
  }

  if (evidenceType === 'Written Documentation') {
    if (!evidence.includes_timeline) {
      qualityIssues.push('Missing timeline of events');
      qualityScore -= 20;
    }
    if (!evidence.describes_cause) {
      qualityIssues.push('Does not describe cause of damage');
      qualityScore -= 25;
    }
    if (!evidence.lists_affected_areas) {
      qualityIssues.push('Does not list all affected areas');
      qualityScore -= 20;
    }
    if (evidence.too_vague) {
      qualityIssues.push('Descriptions are vague or lack detail');
      qualityScore -= 25;
    }
  }

  return {
    evidence_type: evidenceType,
    quality_score: Math.max(0, qualityScore),
    quality_level: qualityScore >= 90 ? 'excellent' :
                   qualityScore >= 75 ? 'good' :
                   qualityScore >= 60 ? 'adequate' :
                   qualityScore >= 40 ? 'poor' : 'unacceptable',
    quality_issues: qualityIssues,
    meets_minimum_standard: qualityScore >= 60,
    improvement_recommendations: qualityIssues.length > 0 
      ? qualityIssues.map(issue => issue.replace('Missing', 'Add').replace('Does not', 'Include').replace('lacks', 'should include'))
      : ['Evidence meets quality standards']
  };
}

/**
 * Generate proof of loss guidance
 * @param {Object} claimData - Claim details
 * @returns {Object} Proof of loss guidance
 */
function generateProofOfLossGuidance(claimData) {
  return {
    required_elements: PROOF_OF_LOSS_STANDARDS['Required Elements'],
    best_practices: PROOF_OF_LOSS_STANDARDS['Best Practices'],
    common_traps: PROOF_OF_LOSS_STANDARDS['Common Traps'],
    recommended_language: {
      supplementation_clause: 'This Proof of Loss is submitted based on information currently available and is subject to supplementation as the claim investigation continues and additional damage is discovered.',
      reservation_of_rights: 'The insured reserves all rights under the policy and applicable law, including the right to amend this Proof of Loss as additional information becomes available.',
      good_faith_statement: 'This Proof of Loss is submitted in good faith based on the insured\'s current knowledge and belief. The insured has made reasonable efforts to identify and document all damage.'
    },
    timing_guidance: 'Submit within 60 days of insurer request, but include supplementation language to allow updates',
    attorney_review_recommended: claimData.claim_value > 50000 || claimData.coverage_disputed
  };
}

module.exports = {
  EVIDENCE_REQUIREMENTS_BY_CLAIM_TYPE,
  EVIDENCE_QUALITY_STANDARDS,
  PROOF_OF_LOSS_STANDARDS,
  assessEvidenceCompleteness,
  generateEvidenceChecklist,
  validateEvidenceQuality,
  generateProofOfLossGuidance
};
