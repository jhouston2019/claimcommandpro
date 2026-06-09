function fmtMoney(n) {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function lineItemStatus(i) {
  const ca = i.carrier_amount != null ? i.carrier_amount : (i.carrier || 0);
  const co = i.contractor_amount != null ? i.contractor_amount : (i.contractor || 0);
  if ((co || 0) > (ca || 0)) return 'Undervalued';
  if ((ca || 0) === 0 && co > 0) return 'Missing';
  return 'Match';
}

function lineItemVariance(i) {
  const ca = i.carrier_amount != null ? i.carrier_amount : (i.carrier || 0);
  const co = i.contractor_amount != null ? i.contractor_amount : (i.contractor || 0);
  const variance = co - ca;
  if (variance === 0) return '$0';
  return (variance > 0 ? '+' : '-') + fmtMoney(Math.abs(variance));
}

function buildGapAnalysisContent(claimData) {
  const s = claimData.structure || {};
  const carrier = s.insurerEstimate || 0;
  const user = s.userEstimate || 0;
  const gap = Math.max(0, user - carrier);
  const cA = s.carrierAnalysis || {};
  const cats = cA.gap_categories || [];
  const lineItems = cA.line_items || [];

  const catTableBody = cats.length > 0
    ? cats.map(c => [
        c.category,
        fmtMoney(c.amount),
        gap > 0 ? Math.round((c.amount / gap) * 100) + '%' : '—',
        c.description || ''
      ]).concat([['TOTAL GAP', fmtMoney(gap), '100%', 'Total documented underpayment']])
    : [['No category data', '—', '—', 'Upload and analyze carrier estimate for category breakdown']];

  const lineTableBody = lineItems.length > 0
    ? lineItems.map(i => {
        const ca = i.carrier_amount != null ? i.carrier_amount : (i.carrier || 0);
        const co = i.contractor_amount != null ? i.contractor_amount : (i.contractor || 0);
        return [
          i.description || i.name || '—',
          ca > 0 ? fmtMoney(ca) : '$0',
          co > 0 ? fmtMoney(co) : '—',
          lineItemVariance(i),
          lineItemStatus(i)
        ];
      })
    : [['No line items available', '—', '—', '—', 'Upload carrier estimate']];

  const summaryParts = [cA.summary, cA.gap_summary].filter(Boolean);

  return {
    title: 'Estimate Gap Analysis',
    subtitle: 'Documented underpayment breakdown by category',
    sections: [
      {
        heading: 'Key Figures',
        body: [
          `Carrier Estimate: ${fmtMoney(carrier)}`,
          `Your Documented Value: ${fmtMoney(user)}`,
          `Total Gap Identified: ${fmtMoney(gap)}`
        ].join('\n')
      },
      {
        heading: 'Gap Breakdown by Category',
        table: {
          head: ['Category', 'Amount', '% of Gap', 'Description'],
          body: catTableBody
        }
      },
      {
        heading: 'Line-Item Comparison Summary',
        table: {
          head: ['Line Item', 'Carrier Amount', 'Contractor Amount', 'Variance', 'Status'],
          body: lineTableBody
        }
      },
      ...(summaryParts.length
        ? [{ heading: 'Analysis Summary', body: summaryParts.join('\n\n') }]
        : [])
    ]
  };
}

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
          ? flagged.map(l => {
              const desc = l.description || l.carrierItem || l.name || l.trade || '—';
              const ca = l.carrier_amount ?? l.carrierAmount ?? l.carrier ?? 0;
              const co = l.contractor_amount ?? l.contractorAmount ?? l.contractor ?? 0;
              return `• ${desc}: Carrier ${fmtMoney(ca)} vs Market ${fmtMoney(co)} — ${l.reason || 'Undervalued'}`;
            }).join('\n')
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
  buildGapAnalysisContent,
  buildNegotiationLetterContent,
  buildPushbackLetterContent,
  buildAppraisalDemandContent,
  buildFullReportContent
};

if (typeof window !== 'undefined') {
  window.EstimateExportTemplates = {
    buildGapAnalysisContent,
    buildNegotiationLetterContent,
    buildPushbackLetterContent,
    buildAppraisalDemandContent,
    buildFullReportContent
  };
}
