/**
 * CARRIER TACTIC INTELLIGENCE DATABASE
 * 
 * Documented carrier delay tactics, denial strategies, and countermeasures
 * NO AI - Pure pattern recognition based on documented carrier behavior
 * 
 * Identifies common carrier tactics and provides specific countermeasures
 */

const CARRIER_TACTICS = {
  'Delay Tactics': [
    {
      tactic: 'Repeated Requests for Same Documentation',
      description: 'Adjuster repeatedly asks for documents already provided',
      severity: 'medium',
      red_flags: ['Multiple requests for same document', 'Claims not to have received items', 'Requests for unnecessary documentation'],
      countermeasure: 'Send all documents via certified mail or email with read receipts; maintain detailed log of all submissions with dates',
      legal_basis: 'Violates prompt payment statutes; may constitute bad faith delay'
    },
    {
      tactic: 'Slow-Walking Investigation',
      description: 'Adjuster delays scheduling inspections, returning calls, or making decisions',
      severity: 'high',
      red_flags: ['Weeks between communications', 'Missed appointments', 'Failure to return calls', 'No progress updates'],
      countermeasure: 'Document all delays; send written demand for action with deadline; cite state-specific claim handling deadlines',
      legal_basis: 'Violates prompt payment and investigation statutes'
    },
    {
      tactic: 'Adjuster Turnover',
      description: 'Claim repeatedly reassigned to new adjusters who restart investigation',
      severity: 'high',
      red_flags: ['Multiple adjuster changes', 'New adjuster requests previously provided documents', 'Investigation restarts'],
      countermeasure: 'Request supervisor involvement; demand continuity; escalate to claims manager',
      legal_basis: 'May constitute unreasonable delay; insurer responsible for internal inefficiencies'
    },
    {
      tactic: 'Unnecessary Independent Examinations',
      description: 'Insurer schedules multiple IMEs, EUOs, or inspections beyond what is reasonable',
      severity: 'medium',
      red_flags: ['Multiple IMEs for same injury', 'Repeated EUOs', 'Excessive documentation requests'],
      countermeasure: 'Comply with reasonable requests; object to duplicative or harassing examinations in writing',
      legal_basis: 'Insured must cooperate, but insurer cannot abuse examination rights'
    },
    {
      tactic: 'Appraisal Avoidance',
      description: 'Insurer refuses or delays invoking appraisal despite amount of loss dispute',
      severity: 'medium',
      red_flags: ['Refuses appraisal demand', 'Claims coverage issues preclude appraisal', 'Delays selecting appraiser'],
      countermeasure: 'File motion to compel appraisal; cite policy language requiring appraisal for amount disputes',
      legal_basis: 'Appraisal is contractual right; insurer cannot unreasonably refuse'
    }
  ],
  'Denial Tactics': [
    {
      tactic: 'Pre-Existing Condition Claim',
      description: 'Insurer claims damage existed before covered event',
      severity: 'high',
      red_flags: ['No inspection before denial', 'Vague "pre-existing" claims', 'Ignores evidence of new damage'],
      countermeasure: 'Provide before/after photos, maintenance records, prior inspection reports; demand specific evidence of pre-existing condition',
      legal_basis: 'Insurer bears burden of proving exclusion applies'
    },
    {
      tactic: 'Causation Dispute',
      description: 'Insurer claims damage caused by excluded peril (e.g., flood instead of rain, wear-and-tear instead of wind)',
      severity: 'critical',
      red_flags: ['Mischaracterizes damage cause', 'Ignores expert opinions', 'Applies wrong exclusion'],
      countermeasure: 'Obtain independent expert report; cite efficient proximate cause doctrine (if applicable); document covered peril evidence',
      legal_basis: 'Insurer must prove excluded peril was sole or predominant cause'
    },
    {
      tactic: 'Policy Language Misrepresentation',
      description: 'Insurer misquotes or misinterprets policy language to deny coverage',
      severity: 'critical',
      red_flags: ['Denial cites non-existent exclusion', 'Ignores favorable policy language', 'Misapplies endorsements'],
      countermeasure: 'Quote exact policy language; cite contra proferentem rule; obtain independent policy review',
      legal_basis: 'Ambiguous language construed in favor of insured; misrepresentation may be bad faith'
    },
    {
      tactic: 'Neglect/Maintenance Exclusion',
      description: 'Insurer claims damage resulted from lack of maintenance or neglect',
      severity: 'high',
      red_flags: ['Claims "wear and tear" without evidence', 'Ignores sudden damage', 'No proof of neglect'],
      countermeasure: 'Provide maintenance records; document sudden nature of damage; distinguish between cause and condition',
      legal_basis: 'Insurer must prove neglect caused loss; pre-existing condition does not bar coverage if covered peril caused damage'
    },
    {
      tactic: 'Concurrent Causation Exclusion',
      description: 'Insurer applies anti-concurrent causation clause to deny entire claim',
      severity: 'critical',
      red_flags: ['Denies entire loss due to partial excluded cause', 'Ignores covered peril contribution', 'Misapplies ACC clause'],
      countermeasure: 'Separate covered and excluded damage; demand payment for covered portion; challenge ACC clause applicability',
      legal_basis: 'ACC clauses are enforceable but must be properly applied; covered damage should be paid'
    }
  ],
  'Lowball Tactics': [
    {
      tactic: 'Aggressive Depreciation',
      description: 'Insurer applies excessive depreciation to reduce payout',
      severity: 'high',
      red_flags: ['Depreciation >50% on repairable items', 'Arbitrary useful life assumptions', 'Ignores replacement cost coverage'],
      countermeasure: 'Cite replacement cost policy language; provide market pricing for new materials; dispute depreciation schedule',
      legal_basis: 'Replacement cost policies require payment without depreciation (after repairs)'
    },
    {
      tactic: 'Scope Reduction',
      description: 'Insurer estimate excludes necessary repairs or uses inadequate pricing',
      severity: 'high',
      red_flags: ['Estimate missing obvious damage', 'Below-market pricing', 'Excludes code upgrades', 'Ignores hidden damage'],
      countermeasure: 'Obtain independent estimate; document all damage with photos; cite specific line-item discrepancies',
      legal_basis: 'Insurer must pay reasonable cost to repair; lowball estimates may be bad faith'
    },
    {
      tactic: 'Actual Cash Value Trap',
      description: 'Insurer pays ACV and withholds recoverable depreciation indefinitely',
      severity: 'medium',
      red_flags: ['Demands completed repairs before RCV payment', 'Unclear RCV recovery process', 'Disputes completed work quality'],
      countermeasure: 'Review policy for RCV recovery terms; document repair completion; demand timely RCV payment',
      legal_basis: 'Policy terms govern RCV recovery; unreasonable delay in RCV payment may be bad faith'
    },
    {
      tactic: 'Betterment Deduction',
      description: 'Insurer deducts for alleged "betterment" or "upgrade" when replacing damaged items',
      severity: 'medium',
      red_flags: ['Deducts for code-required upgrades', 'Claims new materials are "better"', 'Reduces payment for unavailable materials'],
      countermeasure: 'Cite "like kind and quality" policy language; document that replacements are equivalent, not upgrades',
      legal_basis: 'Replacement cost means like kind and quality; insurer cannot deduct for unavoidable improvements'
    },
    {
      tactic: 'Matching Limitation',
      description: 'Insurer refuses to replace undamaged items to achieve uniform appearance',
      severity: 'medium',
      red_flags: ['Refuses to match flooring/roofing/siding', 'Claims matching not required', 'Offers partial replacement'],
      countermeasure: 'Document unavailability of matching materials; cite policy requirement for "like kind and quality"; demand full replacement',
      legal_basis: 'Many policies require matching; if materials unavailable, insurer may owe full replacement'
    }
  ],
  'Documentation Traps': [
    {
      tactic: 'Recorded Statement Traps',
      description: 'Adjuster asks leading questions to elicit damaging admissions',
      severity: 'high',
      red_flags: ['Asks about pre-existing conditions', 'Questions maintenance history', 'Seeks admissions of fault'],
      countermeasure: 'Prepare before recorded statement; answer only what is asked; correct misstatements immediately; consider attorney representation',
      legal_basis: 'Insured must cooperate but can clarify or correct statements'
    },
    {
      tactic: 'Proof of Loss Trap',
      description: 'Insurer demands sworn proof of loss, then uses it to dispute claim',
      severity: 'medium',
      red_flags: ['Demands detailed POL early in process', 'Uses POL estimates against insured', 'Claims POL is binding'],
      countermeasure: 'Include "subject to supplementation" language; avoid premature damage estimates; reserve right to amend',
      legal_basis: 'Proof of loss can be supplemented as investigation continues'
    },
    {
      tactic: 'Social Media Surveillance',
      description: 'Insurer monitors insured social media for contradictory evidence',
      severity: 'low',
      red_flags: ['Questions about social media posts', 'References to photos/activities not disclosed'],
      countermeasure: 'Advise insured to limit social media activity during claim; review privacy settings; avoid contradictory posts',
      legal_basis: 'Public social media is discoverable; contradictory posts can undermine credibility'
    }
  ]
};

const CARRIER_PROFILES = {
  'State Farm': {
    claim_philosophy: 'Conservative; emphasizes depreciation and scope reduction',
    common_tactics: ['Aggressive depreciation', 'Roof age limitations', 'ACV settlement strategy', 'Pre-existing condition claims'],
    negotiation_leverage: 'Large carrier with significant resources; responds to attorney involvement',
    average_settlement_rate: '65-75% of initial demand',
    appraisal_stance: 'Generally willing to participate in appraisal',
    litigation_stance: 'Will litigate if significant amount in dispute'
  },
  'Allstate': {
    claim_philosophy: 'Aggressive cost control; frequent lowball offers',
    common_tactics: ['Colossus software (algorithmic valuation)', 'Lowball initial offers', 'Scope reduction', 'Depreciation'],
    negotiation_leverage: 'Responds to well-documented demands and attorney involvement',
    average_settlement_rate: '60-70% of initial demand',
    appraisal_stance: 'May resist appraisal; prefers negotiation',
    litigation_stance: 'Willing to litigate; has significant legal resources'
  },
  'USAA': {
    claim_philosophy: 'Generally fair but thorough; strong documentation requirements',
    common_tactics: ['Requires multiple estimates', 'Thorough investigation', 'May dispute scope'],
    negotiation_leverage: 'Reputation-conscious; responds to reasonable demands with evidence',
    average_settlement_rate: '75-85% of initial demand',
    appraisal_stance: 'Willing to participate in appraisal',
    litigation_stance: 'Prefers settlement; less likely to litigate than other carriers'
  },
  'Liberty Mutual': {
    claim_philosophy: 'Moderate; case-by-case approach',
    common_tactics: ['Depreciation on personal property', 'Causation disputes', 'Documentation requirements'],
    negotiation_leverage: 'Responds to detailed documentation and expert opinions',
    average_settlement_rate: '70-80% of initial demand',
    appraisal_stance: 'Generally willing to participate in appraisal',
    litigation_stance: 'Moderate litigation tendency'
  },
  'Farmers': {
    claim_philosophy: 'Conservative; emphasizes policy limitations',
    common_tactics: ['Sublimit enforcement', 'Depreciation', 'Matching limitations', 'Scope reduction'],
    negotiation_leverage: 'Responds to attorney involvement and regulatory complaints',
    average_settlement_rate: '65-75% of initial demand',
    appraisal_stance: 'May resist appraisal initially',
    litigation_stance: 'Willing to litigate'
  }
};

/**
 * Detect carrier tactics in claim handling
 * @param {Object} claimHistory - Claim communication and action history
 * @param {string} carrierName - Insurance carrier name
 * @returns {Object} Detected tactics and countermeasures
 */
function detectCarrierTactics(claimHistory, carrierName) {
  const detectedTactics = [];
  
  const allTactics = [
    ...CARRIER_TACTICS['Delay Tactics'],
    ...CARRIER_TACTICS['Denial Tactics'],
    ...CARRIER_TACTICS['Lowball Tactics'],
    ...CARRIER_TACTICS['Documentation Traps']
  ];

  for (const tactic of allTactics) {
    let matched = false;
    const matchedFlags = [];

    for (const flag of tactic.red_flags) {
      if (claimHistory.events?.some(event => 
        event.description?.toLowerCase().includes(flag.toLowerCase()) ||
        event.type?.toLowerCase().includes(flag.toLowerCase())
      )) {
        matched = true;
        matchedFlags.push(flag);
      }
    }

    if (claimHistory.days_since_claim > 60 && tactic.tactic === 'Slow-Walking Investigation') {
      matched = true;
      matchedFlags.push('Excessive delay');
    }

    if (claimHistory.offer_percentage < 60 && tactic.tactic === 'Scope Reduction') {
      matched = true;
      matchedFlags.push('Below-market offer');
    }

    if (matched) {
      detectedTactics.push({
        tactic: tactic.tactic,
        description: tactic.description,
        severity: tactic.severity,
        evidence: matchedFlags,
        countermeasure: tactic.countermeasure,
        legal_basis: tactic.legal_basis
      });
    }
  }

  const carrierProfile = CARRIER_PROFILES[carrierName] || null;

  return {
    carrier: carrierName,
    carrier_profile: carrierProfile,
    detected_tactics: detectedTactics,
    overall_severity: detectedTactics.some(t => t.severity === 'critical') ? 'critical' :
                      detectedTactics.some(t => t.severity === 'high') ? 'high' :
                      detectedTactics.length > 0 ? 'medium' : 'low',
    recommended_strategy: generateCounterStrategy(detectedTactics, carrierProfile)
  };
}

/**
 * Generate counter-strategy based on detected tactics
 * @param {Array} tactics - Detected tactics
 * @param {Object} profile - Carrier profile
 * @returns {Object} Strategic recommendations
 */
function generateCounterStrategy(tactics, profile) {
  const strategy = {
    immediate_actions: [],
    documentation_needed: [],
    escalation_path: [],
    negotiation_approach: ''
  };

  if (tactics.some(t => t.severity === 'critical' || t.severity === 'high')) {
    strategy.immediate_actions.push('Consider retaining insurance attorney');
    strategy.immediate_actions.push('Document all carrier conduct in detailed timeline');
  }

  if (tactics.some(t => t.tactic.includes('Delay'))) {
    strategy.immediate_actions.push('Send written demand citing state-specific claim handling deadlines');
    strategy.documentation_needed.push('Timeline of all delays with dates and communications');
    strategy.escalation_path.push('Escalate to claims supervisor/manager');
    strategy.escalation_path.push('File complaint with state Department of Insurance');
  }

  if (tactics.some(t => t.tactic.includes('Lowball') || t.tactic.includes('Scope Reduction'))) {
    strategy.immediate_actions.push('Obtain independent appraisal or contractor estimate');
    strategy.documentation_needed.push('Detailed estimate with line-item pricing');
    strategy.documentation_needed.push('Photos of all damage');
    strategy.escalation_path.push('Invoke appraisal clause if amount of loss dispute');
  }

  if (tactics.some(t => t.tactic.includes('Pre-Existing') || t.tactic.includes('Causation'))) {
    strategy.immediate_actions.push('Obtain expert report on causation');
    strategy.documentation_needed.push('Before/after photos or videos');
    strategy.documentation_needed.push('Maintenance records');
    strategy.documentation_needed.push('Weather reports or incident documentation');
  }

  if (profile) {
    if (profile.average_settlement_rate) {
      strategy.negotiation_approach = `Expect settlement at ${profile.average_settlement_rate} of demand. ${profile.negotiation_leverage}`;
    }
    
    if (profile.appraisal_stance.includes('resist')) {
      strategy.escalation_path.push('Be prepared to compel appraisal via court motion');
    }
  }

  return strategy;
}

/**
 * Get carrier-specific negotiation intelligence
 * @param {string} carrierName - Carrier name
 * @returns {Object} Carrier profile and tactics
 */
function getCarrierIntelligence(carrierName) {
  const profile = CARRIER_PROFILES[carrierName];
  if (!profile) {
    return {
      carrier: carrierName,
      profile: null,
      note: 'Carrier not in database; apply general negotiation strategies'
    };
  }

  return {
    carrier: carrierName,
    profile: profile,
    common_tactics: profile.common_tactics,
    recommended_approach: {
      documentation_emphasis: profile.claim_philosophy.includes('thorough') ? 'high' : 'medium',
      attorney_involvement_timing: profile.claim_philosophy.includes('Aggressive') ? 'early' : 'if_negotiation_fails',
      appraisal_timing: profile.appraisal_stance.includes('willing') ? 'available_option' : 'may_need_to_compel',
      settlement_expectations: profile.average_settlement_rate
    }
  };
}

module.exports = {
  CARRIER_TACTICS,
  CARRIER_PROFILES,
  detectCarrierTactics,
  getCarrierIntelligence
};
