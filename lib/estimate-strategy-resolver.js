const STRATEGY_CODES = {
  FULL_SUPPLEMENT_DEMAND: 'FULL_SUPPLEMENT_DEMAND',
  PARTIAL_DISPUTE: 'PARTIAL_DISPUTE',
  DEMAND_REINSPECTION: 'DEMAND_REINSPECTION',
  INVOKE_APPRAISAL: 'INVOKE_APPRAISAL'
};

function buildStrategyContext(claimData) {
  const s = claimData.structure || {};
  const ca = s.carrierAnalysis || {};
  const lineItems = ca.line_items || [];

  return {
    carrierAmount: s.insurerEstimate || ca.carrier_total || 0,
    contractorAmount: s.userEstimate || 0,
    gap: s.gap || 0,
    compare_mode: ca.compare_mode || 'LINE_COMPARE',
    flagged_line_count: lineItems.filter(l => l.flagged).length,
    gap_categories: ca.gap_categories || [],
    has_contractor_text: !!(s.contractorEstimateText && s.contractorEstimateText.length >= 100),
    recon_path: ca.recon_path || null
  };
}

function resolveStrategy(ctx) {
  if (ctx.gap >= 5000 || ctx.flagged_line_count >= 3) {
    return {
      recommendedStrategy: STRATEGY_CODES.FULL_SUPPLEMENT_DEMAND,
      availableStrategies: [
        STRATEGY_CODES.FULL_SUPPLEMENT_DEMAND,
        STRATEGY_CODES.PARTIAL_DISPUTE,
        STRATEGY_CODES.INVOKE_APPRAISAL
      ],
      rationale: `Gap of $${ctx.gap.toLocaleString()} with ${ctx.flagged_line_count} flagged line item(s) supports a full supplement demand. Carrier pricing is materially below documented market rates.`,
      riskLevel: ctx.gap >= 10000 || ctx.flagged_line_count >= 5 ? 'high' : 'moderate'
    };
  }

  if (ctx.compare_mode === 'RECON_VS_CARRIER' && !ctx.has_contractor_text) {
    return {
      recommendedStrategy: STRATEGY_CODES.PARTIAL_DISPUTE,
      availableStrategies: [
        STRATEGY_CODES.PARTIAL_DISPUTE,
        STRATEGY_CODES.FULL_SUPPLEMENT_DEMAND,
        STRATEGY_CODES.INVOKE_APPRAISAL
      ],
      rationale: `No contractor estimate is available. Reconstruction analysis suggests undervaluation. A partial dispute letter requesting re-inspection is recommended until an independent estimate is obtained.`,
      riskLevel: 'moderate'
    };
  }

  if (ctx.gap > 0 && ctx.gap < 5000) {
    return {
      recommendedStrategy: STRATEGY_CODES.PARTIAL_DISPUTE,
      availableStrategies: [
        STRATEGY_CODES.PARTIAL_DISPUTE,
        STRATEGY_CODES.FULL_SUPPLEMENT_DEMAND,
        STRATEGY_CODES.INVOKE_APPRAISAL
      ],
      rationale: `Gap of $${ctx.gap.toLocaleString()} with ${ctx.flagged_line_count} flagged line item(s). A targeted partial dispute addressing specific undervalued items is appropriate.`,
      riskLevel: 'low'
    };
  }

  return {
    recommendedStrategy: STRATEGY_CODES.DEMAND_REINSPECTION,
    availableStrategies: [
      STRATEGY_CODES.DEMAND_REINSPECTION,
      STRATEGY_CODES.PARTIAL_DISPUTE,
      STRATEGY_CODES.INVOKE_APPRAISAL
    ],
    rationale: `No material gap detected from available data. Recommend requesting a formal re-inspection to verify scope completeness before accepting settlement.`,
    riskLevel: 'low'
  };
}

module.exports = { buildStrategyContext, resolveStrategy, STRATEGY_CODES };

if (typeof window !== 'undefined') {
  window.EstimateStrategyResolver = { buildStrategyContext, resolveStrategy, STRATEGY_CODES };
}
