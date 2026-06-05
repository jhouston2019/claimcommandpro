/**
 * Estimate Comparison Engine — ERP-parity LINE_COMPARE pipeline
 * Deterministic: parse → match → reconcile → financial exposure → intelligence
 */

const { parseEstimate } = require('./estimate-parser');
const { matchLineItems } = require('./estimate-matcher');
const { reconcileEstimates } = require('./estimate-reconciler');
const { calculateExposure } = require('./financial-exposure-engine');
const LossExpectationEngine = require('./loss-expectation-engine');
const TradeCompletenessEngine = require('./trade-completeness-engine');
const EstimateEngine = require('../../../app/assets/js/intelligence/estimate-engine');

const GAP_CATEGORY_LABELS = {
  missing_item: 'Missing scope items',
  quantity_difference: 'Quantity / scope gaps',
  pricing_difference: 'Underpriced labor & materials',
  scope_omission: 'Scope omissions',
  material_difference: 'Material / specification gaps',
  unit_incompatible: 'Unit comparison issues',
  extra_item: 'Carrier-only items'
};

function fmtMoney(n) {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function lineAmount(item) {
  if (!item) return 0;
  return Number(item.rcv_total ?? item.total ?? item.line_total ?? 0) || 0;
}

function isBillableLine(item) {
  return item &&
    !item.is_tax &&
    !item.is_op &&
    !item.is_subtotal &&
    !item.is_total &&
    !item.is_summary_depreciation;
}

function sumEstimateTotal(items) {
  return (items || [])
    .filter(isBillableLine)
    .reduce((sum, item) => sum + lineAmount(item), 0);
}

function normalizeExternalLineItems(items, source = 'ai') {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => {
    const total = Number(item.total ?? item.line_total ?? item.amount ?? 0) || 0;
    const qty = item.quantity != null ? Number(item.quantity) : null;
    const unitPrice = item.unit_price != null ? Number(item.unit_price) : null;
    const description = (item.description || item.name || item.line_item || 'Line item').trim();
    return {
      line_number: index + 1,
      section: item.section || item.category || 'General',
      category: item.category || 'Other',
      description,
      description_normalized: description.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim(),
      quantity: qty,
      unit: item.unit || null,
      unit_price: unitPrice,
      total,
      rcv_total: total,
      acv_total: total,
      depreciation: 0,
      parsed_by: source,
      is_tax: false,
      is_op: false,
      is_subtotal: false,
      is_total: false
    };
  }).filter((item) => item.total > 0 || item.description.length > 2);
}

function buildComparisonRows(matches, unmatchedContractor, unmatchedCarrier) {
  const rows = [];

  for (const match of matches || []) {
    const contractorAmt = lineAmount(match.contractor);
    const carrierAmt = lineAmount(match.carrier);
    const variance = contractorAmt - carrierAmt;
    rows.push({
      description: match.contractor?.description || match.carrier?.description || '—',
      carrier_amount: carrierAmt,
      contractor_amount: contractorAmt,
      variance,
      status: statusForVariance(carrierAmt, contractorAmt, variance),
      match_method: match.match_method || null,
      match_confidence: match.match_confidence ?? null,
      discrepancy_type: Math.abs(variance) < 0.01 ? 'match' : null
    });
  }

  for (const item of unmatchedContractor || []) {
    const contractorAmt = lineAmount(item);
    rows.push({
      description: item.description,
      carrier_amount: 0,
      contractor_amount: contractorAmt,
      variance: contractorAmt,
      status: 'Missing from Carrier',
      discrepancy_type: 'missing_item'
    });
  }

  for (const item of unmatchedCarrier || []) {
    const carrierAmt = lineAmount(item);
    rows.push({
      description: item.description,
      carrier_amount: carrierAmt,
      contractor_amount: 0,
      variance: -carrierAmt,
      status: 'Extra in Carrier',
      discrepancy_type: 'extra_item'
    });
  }

  return rows.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
}

function statusForVariance(carrierAmt, contractorAmt, variance) {
  if (carrierAmt === 0 && contractorAmt > 0) return 'Missing from Carrier';
  if (Math.abs(variance) <= 100) return 'Match';
  if (contractorAmt > carrierAmt) return 'Undervalued';
  return 'Disputed';
}

function buildGapCategories(reconciliation, exposure) {
  const categories = [];
  const typeTotals = {};

  for (const disc of reconciliation.discrepancies || []) {
    const diff = Number(disc.difference_amount) || 0;
    if (diff <= 0) continue;
    const key = disc.discrepancy_type || 'other';
    typeTotals[key] = (typeTotals[key] || 0) + diff;
  }

  for (const [type, amount] of Object.entries(typeTotals)) {
    if (amount <= 0) continue;
    categories.push({
      category: GAP_CATEGORY_LABELS[type] || 'Other gaps',
      amount: parseFloat(amount.toFixed(2)),
      description: `Identified from ${type.replace(/_/g, ' ')} analysis`
    });
  }

  if (exposure.opExposure?.opAmount > 0) {
    categories.push({
      category: 'Missing or underpaid O&P',
      amount: exposure.opExposure.opAmount,
      description: exposure.opExposure.reason || 'Overhead and profit gap'
    });
  }

  if (exposure.recoverableDepreciationTotal > 0) {
    categories.push({
      category: 'Improper depreciation',
      amount: exposure.recoverableDepreciationTotal,
      description: 'Recoverable depreciation not reflected in carrier estimate'
    });
  }

  const breakdown = reconciliation.categoryBreakdown || {};
  if (categories.length === 0) {
    for (const [name, data] of Object.entries(breakdown)) {
      if ((data.underpayment || 0) > 0) {
        categories.push({
          category: name,
          amount: parseFloat(Number(data.underpayment).toFixed(2)),
          description: `${data.missing_items || 0} missing, ${data.pricing_issues || 0} pricing, ${data.quantity_issues || 0} quantity issues`
        });
      }
    }
  }

  return categories;
}

function buildGapSummary(reconciliation, exposure, contractorTotal, carrierTotal) {
  const gap = Math.max(0, contractorTotal - carrierTotal);
  const stats = reconciliation.stats || {};
  const parts = [];

  if (stats.missing_items) parts.push(`${stats.missing_items} missing scope item(s)`);
  if (stats.pricing_differences) parts.push(`${stats.pricing_differences} underpriced line(s)`);
  if (stats.quantity_differences) parts.push(`${stats.quantity_differences} quantity mismatch(es)`);
  if (exposure.opExposure?.opAmount > 0) parts.push(`O&P gap of ${fmtMoney(exposure.opExposure.opAmount)}`);

  const detail = parts.length ? parts.join('; ') + '.' : 'Line-by-line comparison completed.';
  return `Total documented gap of ${fmtMoney(gap)} between contractor (${fmtMoney(contractorTotal)}) and carrier (${fmtMoney(carrierTotal)}). ${detail}`;
}

function runIntelligenceLayer(contractorItems, carrierItems, carrierText, claimType) {
  const intelligence = {
    loss_expectation: null,
    trade_completeness: null,
    carrier_tactics: null,
    carrier_scope_analysis: null
  };

  try {
    const contractorTotal = sumEstimateTotal(contractorItems);
    intelligence.loss_expectation = LossExpectationEngine.analyzeLossExpectation({
      lineItems: contractorItems.filter(isBillableLine).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total: lineAmount(item),
        category: item.category
      })),
      totalCost: contractorTotal,
      metadata: { claim_type: claimType }
    });
  } catch (err) {
    console.warn('Loss expectation engine:', err.message);
  }

  try {
    intelligence.trade_completeness = TradeCompletenessEngine.analyzeTradeCompleteness({
      lineItems: contractorItems.filter(isBillableLine).map((item) => ({
        description: item.description,
        category: item.category,
        total: lineAmount(item)
      })),
      metadata: {}
    });
  } catch (err) {
    console.warn('Trade completeness engine:', err.message);
  }

  try {
    if (carrierText && carrierText.length >= 50) {
      const scopeResult = EstimateEngine.analyzeEstimate({
        estimateText: carrierText.slice(0, 12000),
        lineItems: [],
        userInput: '',
        metadata: { mode: 'scope-review' }
      });
      if (scopeResult.success) {
        intelligence.carrier_scope_analysis = {
          classification: scopeResult.classification,
          analysis: scopeResult.analysis,
          report: scopeResult.report
        };
      }
    }
  } catch (err) {
    console.warn('Carrier intelligence:', err.message);
  }

  return intelligence;
}

/**
 * Full deterministic LINE_COMPARE (ERP parity)
 */
function compareEstimates(options = {}) {
  const {
    contractorText = '',
    carrierText = '',
    contractorLineItems = null,
    contractorTotalOverride = null,
    carrierTotalOverride = null,
    claimType = 'property-claim'
  } = options;

  const contractorParsed = contractorText.length >= 30
    ? parseEstimate(contractorText, 'contractor')
    : { lineItems: [], metadata: {} };

  const carrierParsed = carrierText.length >= 30
    ? parseEstimate(carrierText, 'carrier')
    : { lineItems: [], metadata: {} };

  let contractorItems = contractorParsed.lineItems.filter(isBillableLine);
  let carrierItems = carrierParsed.lineItems.filter(isBillableLine);

  if (Array.isArray(contractorLineItems) && contractorLineItems.length > 0) {
    const normalized = normalizeExternalLineItems(contractorLineItems, 'hybrid');
    if (normalized.length >= contractorItems.length) {
      contractorItems = normalized;
    } else if (contractorItems.length === 0) {
      contractorItems = normalized;
    }
  }

  const contractorTotal = Number(contractorTotalOverride) > 0
    ? Number(contractorTotalOverride)
    : (sumEstimateTotal(contractorItems) || Number(contractorTotalOverride) || 0);

  const carrierTotal = Number(carrierTotalOverride) > 0
    ? Number(carrierTotalOverride)
    : (sumEstimateTotal(carrierItems) || Number(carrierTotalOverride) || 0);

  const matchResult = matchLineItems(contractorItems, carrierItems);
  const reconciliation = reconcileEstimates(
    matchResult.matches,
    matchResult.unmatchedContractor,
    matchResult.unmatchedCarrier,
    contractorItems,
    carrierItems
  );

  const exposure = calculateExposure(reconciliation, contractorItems, carrierItems);
  const line_items = buildComparisonRows(
    matchResult.matches,
    matchResult.unmatchedContractor,
    matchResult.unmatchedCarrier
  );
  const gap_categories = buildGapCategories(reconciliation, exposure);
  const gapAmount = Math.max(0, contractorTotal - carrierTotal);
  const intelligence = runIntelligenceLayer(contractorItems, carrierItems, carrierText, claimType);

  return {
    analysis_method: 'deterministic',
    carrier_total: carrierTotal,
    contractor_total: contractorTotal,
    gap_amount: gapAmount,
    line_items,
    gap_categories,
    gap_summary: buildGapSummary(reconciliation, exposure, contractorTotal, carrierTotal),
    summary: `Deterministic comparison: carrier ${fmtMoney(carrierTotal)} vs contractor ${fmtMoney(contractorTotal)} — gap ${fmtMoney(gapAmount)}.`,
    reconciliation,
    exposure,
    intelligence,
    parse_metadata: {
      contractor: contractorParsed.metadata,
      carrier: carrierParsed.metadata,
      match_stats: matchResult.stats
    },
    total_projected_recovery: exposure.totalProjectedRecovery,
    rcv_delta_total: exposure.rcvDeltaTotal,
    recoverable_depreciation: exposure.recoverableDepreciationTotal,
    op_exposure: exposure.opExposure
  };
}

function shouldUseDeterministicResult(result) {
  if (!result) return false;
  const hasLines = result.line_items.length >= 2;
  const contractorParsed = (result.parse_metadata?.contractor?.lines_with_quantities || 0) >= 2;
  const carrierParsed = (result.parse_metadata?.carrier?.lines_with_quantities || 0) >= 2;
  return hasLines && (contractorParsed || carrierParsed);
}

function mergeWithAI(deterministic, aiResult) {
  if (!aiResult) return deterministic;
  const merged = { ...deterministic };

  if (!shouldUseDeterministicResult(deterministic) && aiResult.line_items?.length) {
    merged.analysis_method = 'ai';
    merged.line_items = aiResult.line_items;
    merged.gap_categories = aiResult.gap_categories?.length ? aiResult.gap_categories : merged.gap_categories;
    merged.gap_summary = aiResult.gap_summary || merged.gap_summary;
    merged.summary = aiResult.summary || merged.summary;
    if (aiResult.carrier_total > 0) merged.carrier_total = aiResult.carrier_total;
  } else {
    merged.analysis_method = 'deterministic+ai_summary';
    if (aiResult.gap_summary && deterministic.line_items.length >= 2) {
      merged.gap_summary = aiResult.gap_summary;
    }
    if (aiResult.summary) {
      merged.summary = `${deterministic.summary} ${aiResult.summary}`.trim();
    }
  }

  merged.gap_amount = Math.max(0, (merged.contractor_total || 0) - (merged.carrier_total || 0));
  return merged;
}

module.exports = {
  compareEstimates,
  shouldUseDeterministicResult,
  mergeWithAI,
  normalizeExternalLineItems,
  sumEstimateTotal,
  buildComparisonRows,
  buildGapCategories
};
