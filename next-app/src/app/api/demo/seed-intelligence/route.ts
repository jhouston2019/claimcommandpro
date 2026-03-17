import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { claimId, userId } = await request.json()

    if (!claimId || !userId) {
      return NextResponse.json(
        { error: 'claimId and userId are required' },
        { status: 400 }
      )
    }

    // Get claim details
    const { data: claim } = await supabase
      .from('claims')
      .select('carrier_name, claim_type')
      .eq('id', claimId)
      .single()

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    const carrierName = claim.carrier_name || 'State Farm'
    const claimType = claim.claim_type || 'Roof Hail Damage'

    // Sample data
    const insuranceEstimate = 18200
    const contractorEstimate = 36750
    const claimGap = contractorEstimate - insuranceEstimate

    // 1. Create Claim Analysis
    await supabase.from('claim_analysis').upsert({
      claim_id: claimId,
      user_id: userId,
      claim_intelligence_score: 72,
      claim_risk_level: 'moderate',
      settlement_opportunity: 'high',
      insurance_estimate: insuranceEstimate,
      contractor_estimate: contractorEstimate,
      predicted_true_scope: contractorEstimate,
      claim_gap: claimGap,
      potential_settlement_increase: 12800,
      missing_scope_items: [
        { item: 'Roof flashing', estimated_value: 850 },
        { item: 'Starter course shingles', estimated_value: 420 },
        { item: 'Drip edge', estimated_value: 380 },
        { item: 'Ridge vent', estimated_value: 680 },
        { item: 'Roof decking (8 sheets)', estimated_value: 1200 },
        { item: 'Attic insulation', estimated_value: 1440 },
        { item: 'Interior paint', estimated_value: 2100 }
      ],
      pricing_suppressions: [
        {
          type: 'labor_rate',
          description: 'Labor pricing 31% below regional average',
          estimated_impact: 7420
        },
        {
          type: 'material_pricing',
          description: 'Material pricing suppression detected',
          estimated_impact: 5530
        }
      ],
      coverage_gaps: [
        {
          coverage_type: 'code_upgrade',
          description: 'Building code upgrades may be covered',
          estimated_value: 3500
        },
        {
          coverage_type: 'ordinance_law',
          description: 'Ordinance & Law coverage may apply',
          estimated_value: 5000
        }
      ],
      settlement_opportunities: [
        { type: 'supplement', description: 'Submit supplement for missing scope', estimated_value: 8650 },
        { type: 'code_upgrade', description: 'Request code upgrade coverage', estimated_value: 3500 }
      ],
      carrier_behavior_flags: [
        'labor_suppression',
        'missing_scope',
        'op_omission'
      ],
      labor_suppression_rate: 31,
      op_omission_detected: true,
      analysis_completed_at: new Date().toISOString()
    })

    // 2. Create Coverage Flags
    const coverageFlags = [
      {
        claim_id: claimId,
        user_id: userId,
        coverage_type: 'ordinance_law',
        coverage_alert: 'Ordinance & Law coverage may apply to this claim',
        alert_severity: 'warning',
        estimated_value: 5000,
        description: 'Your policy includes Ordinance & Law coverage that may cover code upgrades',
        recommendation: 'Request application of Ordinance & Law coverage for required code upgrades'
      },
      {
        claim_id: claimId,
        user_id: userId,
        coverage_type: 'code_upgrade',
        coverage_alert: 'Code upgrade coverage available',
        alert_severity: 'info',
        estimated_value: 3500,
        description: 'Building codes may require upgrades beyond original construction',
        recommendation: 'Document required code upgrades and submit for coverage consideration'
      },
      {
        claim_id: claimId,
        user_id: userId,
        coverage_type: 'additional_living_expense',
        coverage_alert: 'Additional living expense coverage detected',
        alert_severity: 'info',
        estimated_value: 0,
        description: 'Your policy includes ALE coverage if repairs require temporary relocation',
        recommendation: 'Track all additional living expenses during repair period'
      }
    ]

    for (const flag of coverageFlags) {
      await supabase.from('coverage_flags').insert(flag)
    }

    // 3. Create Alerts
    const alerts = [
      {
        claim_id: claimId,
        user_id: userId,
        alert_type: 'missing_scope',
        alert_title: 'Missing Scope Detected',
        alert_message: '7 missing repair items identified in carrier estimate',
        alert_severity: 'warning',
        action_required: true,
        action_url: '/documentation-builder'
      },
      {
        claim_id: claimId,
        user_id: userId,
        alert_type: 'pricing_suppression',
        alert_title: 'Estimate Pricing Suppression Detected',
        alert_message: 'Labor rates 31% below regional average - potential underpayment of $7,420',
        alert_severity: 'critical',
        action_required: true,
        action_url: '/estimate-analyzer'
      },
      {
        claim_id: claimId,
        user_id: userId,
        alert_type: 'coverage_gap',
        alert_title: 'Coverage Review Recommended',
        alert_message: 'Ordinance & Law coverage may add $5,000 to claim value',
        alert_severity: 'info',
        action_required: false,
        action_url: '/policy-analysis'
      }
    ]

    for (const alert of alerts) {
      await supabase.from('claim_alerts').insert(alert)
    }

    // 4. Create Recommended Actions
    const actions = [
      {
        claim_id: claimId,
        user_id: userId,
        action_type: 'run_estimate_review',
        action_title: 'Run Estimate Review',
        action_description: 'Comprehensive line-by-line analysis of carrier estimate to identify all missing items and pricing discrepancies',
        estimated_impact: 11100,
        priority: 5,
        action_url: '/estimate-analyzer'
      },
      {
        claim_id: claimId,
        user_id: userId,
        action_type: 'generate_claim_letter',
        action_title: 'Generate Claim Letter',
        action_description: 'Create professional supplement request letter documenting all missing scope and pricing issues',
        estimated_impact: 12800,
        priority: 4,
        action_url: '/documentation-builder'
      },
      {
        claim_id: claimId,
        user_id: userId,
        action_type: 'request_contractor_comparison',
        action_title: 'Request Contractor Comparison',
        action_description: 'Get independent contractor estimate to validate claim gap and strengthen negotiation position',
        estimated_impact: 9275,
        priority: 3,
        action_url: '/underpayment-detector'
      },
      {
        claim_id: claimId,
        user_id: userId,
        action_type: 'review_policy_coverage',
        action_title: 'Review Policy Coverage',
        action_description: 'Analyze policy for Ordinance & Law, code upgrade, and other additional coverage opportunities',
        estimated_impact: 8500,
        priority: 2,
        action_url: '/policy-analysis'
      }
    ]

    for (const action of actions) {
      await supabase.from('recommended_actions').insert(action)
    }

    // 5. Create Timeline
    const today = new Date()
    const timeline = [
      {
        claim_id: claimId,
        user_id: userId,
        milestone_type: 'claim_filed',
        milestone_date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestone_status: 'completed',
        description: 'Initial claim filed with carrier'
      },
      {
        claim_id: claimId,
        user_id: userId,
        milestone_type: 'estimate_received',
        milestone_date: new Date(today.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestone_status: 'completed',
        description: 'Carrier estimate received - $18,200'
      },
      {
        claim_id: claimId,
        user_id: userId,
        milestone_type: 'review_completed',
        milestone_date: today.toISOString().split('T')[0],
        milestone_status: 'completed',
        description: 'Claim intelligence analysis completed - Gap detected: $18,550'
      },
      {
        claim_id: claimId,
        user_id: userId,
        milestone_type: 'supplement_submitted',
        milestone_date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestone_status: 'pending',
        description: 'Submit supplement request with documented gaps'
      },
      {
        claim_id: claimId,
        user_id: userId,
        milestone_type: 'settlement_pending',
        milestone_date: new Date(today.getTime() + 38 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestone_status: 'pending',
        description: 'Awaiting final settlement decision'
      }
    ]

    for (const milestone of timeline) {
      await supabase.from('claim_timeline').insert(milestone)
    }

    return NextResponse.json({
      success: true,
      message: 'Intelligence data seeded successfully',
      data: {
        claim_intelligence_score: 72,
        claim_gap: claimGap,
        potential_settlement_increase: 12800
      }
    })

  } catch (error: any) {
    console.error('Seed intelligence error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed intelligence data' },
      { status: 500 }
    )
  }
}
