function buildNegotiationLetterContent(claimData) {
  const s = claimData.structure || {};
  const strategy = s.negotiationStrategy || {};
  const strategyLabels = {
    FULL_SUPPLEMENT_DEMAND: 'Full Supplement Demand',
    PARTIAL_DISPUTE: 'Partial Dispute',
    DEMAND_REINSPECTION: 'Demand Re-Inspection',
    INVOKE_APPRAISAL: 'Invoke Appraisal Clause'
  };
  return {
    title: 'Negotiation Letter — Supplement Demand',
    sections: [
      {
        heading: 'Claim Information',
        body: [
          `Insured: ${claimData.initial?.insuredName || '[Insured Name]'}`,
          `Claim Number: ${claimData.initial?.claimNumber || '[Claim Number]'}`,
          `Insurance Company: ${claimData.initial?.insurer || '[Insurer]'}`,
          `Date of Loss: ${claimData.initial?.dateOfLoss || '[Date]'}`
        ].join('\n')
      },
      {
        heading: 'Dispute Summary',
        body: [
          `Carrier Estimate: $${(s.insurerEstimate || 0).toLocaleString()}`,
          `Independent Estimate: $${(s.userEstimate || 0).toLocaleString()}`,
          `Documented Gap: $${(s.gap || 0).toLocaleString()}`,
          `Selected Strategy: ${strategyLabels[strategy.recommendedStrategy] || 'Not set'}`
        ].join('\n')
      },
      {
        heading: 'Basis for Dispute',
        body: strategy.rationale || 'See attached estimate comparison for line-item detail.'
      },
      {
        heading: 'Demand',
        body: `Based on the attached independent contractor estimate and line-item comparison, we respectfully demand payment of the documented gap amount of $${(s.gap || 0).toLocaleString()} within the time period required by your state's claim handling regulations.`
      }
    ]
  };
}

function buildPushbackLetterContent(claimData) {
  const s = claimData.structure || {};
  const lineItems = s.carrierAnalysis?.line_items || [];
  const flagged = lineItems.filter(l => l.flagged);
  return {
    title: 'Pushback Letter — Line-Item Dispute',
    sections: [
      {
        heading: 'Claim Information',
        body: [
          `Insured: ${claimData.initial?.insuredName || '[Insured Name]'}`,
          `Claim Number: ${claimData.initial?.claimNumber || '[Claim Number]'}`
        ].join('\n')
      },
      {
        heading: 'Disputed Line Items',
        body: flagged.length > 0
          ? flagged.map(l =>
              `• ${l.carrierItem || l.trade}: Carrier $${(l.carrierAmount || 0).toLocaleString()} vs Market $${(l.contractorAmount || 0).toLocaleString()} — ${l.reason || 'Undervalued'}`
            ).join('\n')
          : 'No flagged line items found. Run carrier estimate analysis first.'
      },
      {
        heading: 'Requested Action',
        body: 'Please review the above line items and issue a revised estimate reflecting current market labor and material rates.'
      }
    ]
  };
}

function buildAppraisalDemandContent(claimData) {
  return {
    title: 'Appraisal Demand Letter',
    sections: [
      {
        heading: 'Claim Information',
        body: [
          `Insured: ${claimData.initial?.insuredName || '[Insured Name]'}`,
          `Claim Number: ${claimData.initial?.claimNumber || '[Claim Number]'}`,
          `Insurance Company: ${claimData.initial?.insurer || '[Insurer]'}`
        ].join('\n')
      },
      {
        heading: 'Demand for Appraisal',
        body: 'Pursuant to the appraisal clause in the above-referenced policy, the insured hereby demands appraisal of the disputed loss. The insured will select a competent, independent appraiser and requests that the insurer do the same within the time period specified in the policy.'
      },
      {
        heading: 'Disputed Amount',
        body: `The insured's documented loss is $${((claimData.structure?.userEstimate) || 0).toLocaleString()}. The carrier's current estimate is $${((claimData.structure?.insurerEstimate) || 0).toLocaleString()}. The disputed amount is $${((claimData.structure?.gap) || 0).toLocaleString()}.`
      }
    ]
  };
}

function buildFullReportContent(claimData) {
  const neg = buildNegotiationLetterContent(claimData);
  const push = buildPushbackLetterContent(claimData);
  return {
    title: 'Full Claim Analysis Report',
    sections: [
      ...neg.sections,
      { heading: '---', body: '' },
      ...push.sections
    ]
  };
}

module.exports = {
  buildNegotiationLetterContent,
  buildPushbackLetterContent,
  buildAppraisalDemandContent,
  buildFullReportContent
};

if (typeof window !== 'undefined') {
  window.EstimateExportTemplates = {
    buildNegotiationLetterContent,
    buildPushbackLetterContent,
    buildAppraisalDemandContent,
    buildFullReportContent
  };
}
