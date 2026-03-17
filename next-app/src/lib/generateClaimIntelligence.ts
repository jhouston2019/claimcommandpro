import { supabase } from './supabase'

interface GenerateIntelligenceParams {
  claimId: string
  userId: string
  carrierName: string
  insuranceEstimate: number
  contractorEstimate: number
  claimType: string
}

export async function generateClaimIntelligence(params: GenerateIntelligenceParams) {
  const {
    claimId,
    userId,
    carrierName,
    insuranceEstimate,
    contractorEstimate,
    claimType
  } = params

  const claimGap = Math.max(0, contractorEstimate - insuranceEstimate)
  const gapPercentage = insuranceEstimate > 0 ? (claimGap / insuranceEstimate) * 100 : 0

  // Calculate intelligence score (100 = perfect, lower = more issues)
  let intelligenceScore = 100
  if (gapPercentage > 50) intelligenceScore -= 30
  else if (gapPercentage > 30) intelligenceScore -= 20
  else if (gapPercentage > 15) intelligenceScore -= 10

  // Determine risk level
  let riskLevel = 'low'
  if (gapPercentage > 50) riskLevel = 'critical'
  else if (gapPercentage > 30) riskLevel = 'high'
  else if (gapPercentage > 15) riskLevel = 'moderate'

  // Determine settlement opportunity
  let settlementOpportunity = 'low'
  if (claimGap > 20000) settlementOpportunity = 'very_high'
  else if (claimGap > 10000) settlementOpportunity = 'high'
  else if (claimGap > 5000) settlementOpportunity = 'medium'

  // Generate missing scope items based on claim type
  const missingScope = generateMissingScope(claimType, claimGap)
  
  // Generate pricing suppressions
  const pricingSuppressions = generatePricingSuppressions(insuranceEstimate, contractorEstimate)
  
  // Generate coverage gaps
  const coverageGaps = generateCoverageGaps(claimType)
  
  // Calculate labor suppression rate
  const laborSuppressionRate = Math.min(35, Math.floor(gapPercentage / 2))

  // Potential settlement increase (conservative estimate)
  const potentialIncrease = Math.floor(claimGap * 0.7)

  // Insert claim analysis
  const { error: analysisError } = await supabase
    .from('claim_analysis')
    .upsert({
      claim_id: claimId,
      user_id: userId,
      claim_intelligence_score: intelligenceScore,
      claim_risk_level: riskLevel,
      settlement_opportunity: settlementOpportunity,
      insurance_estimate: insuranceEstimate,
      contractor_estimate: contractorEstimate,
      predicted_true_scope: contractorEstimate,
      claim_gap: claimGap,
      potential_settlement_increase: potentialIncrease,
      missing_scope_items: missingScope,
      pricing_suppressions: pricingSuppressions,
      coverage_gaps: coverageGaps,
      settlement_opportunities: [],
      carrier_behavior_flags: [],
      labor_suppression_rate: laborSuppressionRate,
      op_omission_detected: claimGap > 5000,
      analysis_completed_at: new Date().toISOString()
    })

  if (analysisError) {
    console.error('Error creating claim analysis:', analysisError)
  }

  // Generate coverage flags
  await generateCoverageFlags(claimId, userId, claimType, claimGap)

  // Generate alerts
  await generateAlerts(claimId, userId, missingScope, pricingSuppressions, coverageGaps)

  // Generate recommended actions
  await generateRecommendedActions(claimId, userId, claimGap, missingScope.length)

  // Generate timeline
  await generateTimeline(claimId, userId)

  return {
    intelligenceScore,
    riskLevel,
    settlementOpportunity,
    claimGap,
    potentialIncrease
  }
}

function generateMissingScope(claimType: string, claimGap: number) {
  const commonItems = [
    { item: 'Roof flashing', estimated_value: 850 },
    { item: 'Starter course shingles', estimated_value: 420 },
    { item: 'Drip edge', estimated_value: 380 },
    { item: 'Ridge vent', estimated_value: 680 },
    { item: 'Roof decking (8 sheets)', estimated_value: 1200 },
    { item: 'Attic insulation', estimated_value: 1440 },
    { item: 'Interior paint (water damage)', estimated_value: 2100 },
    { item: 'Drywall repair', estimated_value: 1680 },
    { item: 'Ice and water shield', estimated_value: 520 },
    { item: 'Soffit and fascia', estimated_value: 1850 }
  ]

  // Return more items for larger gaps
  const itemCount = Math.min(10, Math.floor(claimGap / 2000) + 2)
  return commonItems.slice(0, itemCount)
}

function generatePricingSuppressions(insuranceEstimate: number, contractorEstimate: number) {
  const suppressions = []
  
  if (contractorEstimate > insuranceEstimate * 1.2) {
    suppressions.push({
      type: 'labor_rate',
      description: 'Labor pricing below regional average',
      estimated_impact: Math.floor((contractorEstimate - insuranceEstimate) * 0.4)
    })
  }

  if (contractorEstimate > insuranceEstimate * 1.15) {
    suppressions.push({
      type: 'material_pricing',
      description: 'Material pricing suppression detected',
      estimated_impact: Math.floor((contractorEstimate - insuranceEstimate) * 0.3)
    })
  }

  return suppressions
}

function generateCoverageGaps(claimType: string) {
  const gaps = []

  if (claimType.toLowerCase().includes('roof') || claimType.toLowerCase().includes('hail')) {
    gaps.push({
      coverage_type: 'code_upgrade',
      description: 'Building code upgrades may be covered',
      estimated_value: 3500
    })
  }

  gaps.push({
    coverage_type: 'ordinance_law',
    description: 'Ordinance & Law coverage may apply',
    estimated_value: 5000
  })

  return gaps
}

async function generateCoverageFlags(claimId: string, userId: string, claimType: string, claimGap: number) {
  const flags = []

  if (claimType.toLowerCase().includes('roof')) {
    flags.push({
      claim_id: claimId,
      user_id: userId,
      coverage_type: 'code_upgrade',
      coverage_alert: 'Code upgrade coverage may be available',
      alert_severity: 'warning',
      estimated_value: 3500,
      description: 'Building codes may require upgrades beyond original construction',
      recommendation: 'Review policy for code upgrade coverage and request application'
    })
  }

  flags.push({
    claim_id: claimId,
    user_id: userId,
    coverage_type: 'ordinance_law',
    coverage_alert: 'Ordinance & Law coverage detected',
    alert_severity: 'info',
    estimated_value: 5000,
    description: 'Your policy may include Ordinance & Law coverage',
    recommendation: 'Verify coverage limits and ensure proper application'
  })

  if (claimGap > 10000) {
    flags.push({
      claim_id: claimId,
      user_id: userId,
      coverage_type: 'matching',
      coverage_alert: 'Matching coverage may apply',
      alert_severity: 'warning',
      estimated_value: 2500,
      description: 'Significant scope may trigger matching requirements',
      recommendation: 'Request matching coverage evaluation'
    })
  }

  for (const flag of flags) {
    await supabase.from('coverage_flags').insert(flag)
  }
}

async function generateAlerts(
  claimId: string, 
  userId: string, 
  missingScope: any[], 
  pricingSuppressions: any[],
  coverageGaps: any[]
) {
  const alerts = []

  if (missingScope.length > 0) {
    alerts.push({
      claim_id: claimId,
      user_id: userId,
      alert_type: 'missing_scope',
      alert_title: 'Missing Scope Detected',
      alert_message: `${missingScope.length} missing items identified in carrier estimate`,
      alert_severity: 'warning',
      action_required: true,
      action_url: '/documentation-builder'
    })
  }

  if (pricingSuppressions.length > 0) {
    alerts.push({
      claim_id: claimId,
      user_id: userId,
      alert_type: 'pricing_suppression',
      alert_title: 'Pricing Suppression Detected',
      alert_message: 'Labor and material pricing below market rates',
      alert_severity: 'critical',
      action_required: true,
      action_url: '/estimate-analyzer'
    })
  }

  if (coverageGaps.length > 0) {
    alerts.push({
      claim_id: claimId,
      user_id: userId,
      alert_type: 'coverage_gap',
      alert_title: 'Coverage Review Recommended',
      alert_message: `${coverageGaps.length} potential coverage opportunities identified`,
      alert_severity: 'info',
      action_required: false,
      action_url: '/policy-analysis'
    })
  }

  for (const alert of alerts) {
    await supabase.from('claim_alerts').insert(alert)
  }
}

async function generateRecommendedActions(
  claimId: string, 
  userId: string, 
  claimGap: number,
  missingItemCount: number
) {
  const actions = []

  if (missingItemCount > 0) {
    actions.push({
      claim_id: claimId,
      user_id: userId,
      action_type: 'run_estimate_review',
      action_title: 'Run Detailed Estimate Review',
      action_description: 'Comprehensive line-by-line analysis of carrier estimate',
      estimated_impact: Math.floor(claimGap * 0.6),
      priority: 5,
      action_url: '/estimate-analyzer'
    })
  }

  actions.push({
    claim_id: claimId,
    user_id: userId,
    action_type: 'generate_claim_letter',
    action_title: 'Generate Supplement Letter',
    action_description: 'Create professional supplement request with documented gaps',
    estimated_impact: Math.floor(claimGap * 0.7),
    priority: 4,
    action_url: '/documentation-builder'
  })

  actions.push({
    claim_id: claimId,
    user_id: userId,
    action_type: 'request_contractor_comparison',
    action_title: 'Request Contractor Comparison',
    action_description: 'Get independent contractor estimate for comparison',
    estimated_impact: Math.floor(claimGap * 0.5),
    priority: 3,
    action_url: '/underpayment-detector'
  })

  actions.push({
    claim_id: claimId,
    user_id: userId,
    action_type: 'review_policy_coverage',
    action_title: 'Review Policy Coverage',
    action_description: 'Analyze policy for additional coverage opportunities',
    estimated_impact: 5000,
    priority: 2,
    action_url: '/policy-analysis'
  })

  for (const action of actions) {
    await supabase.from('recommended_actions').insert(action)
  }
}

async function generateTimeline(claimId: string, userId: string) {
  const today = new Date()
  const milestones = [
    {
      claim_id: claimId,
      user_id: userId,
      milestone_type: 'claim_filed',
      milestone_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestone_status: 'completed',
      description: 'Initial claim filed with carrier'
    },
    {
      claim_id: claimId,
      user_id: userId,
      milestone_type: 'estimate_received',
      milestone_date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestone_status: 'completed',
      description: 'Carrier estimate received'
    },
    {
      claim_id: claimId,
      user_id: userId,
      milestone_type: 'review_completed',
      milestone_date: today.toISOString().split('T')[0],
      milestone_status: 'completed',
      description: 'Claim intelligence analysis completed'
    },
    {
      claim_id: claimId,
      user_id: userId,
      milestone_type: 'supplement_submitted',
      milestone_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestone_status: 'pending',
      description: 'Submit supplement request with documented gaps'
    },
    {
      claim_id: claimId,
      user_id: userId,
      milestone_type: 'settlement_pending',
      milestone_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestone_status: 'pending',
      description: 'Awaiting final settlement decision'
    }
  ]

  for (const milestone of milestones) {
    await supabase.from('claim_timeline').insert(milestone)
  }
}
