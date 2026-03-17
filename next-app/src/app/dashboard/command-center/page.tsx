'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  FileText, 
  CheckCircle, 
  Clock,
  DollarSign,
  Activity,
  Target,
  BarChart3,
  ArrowRight,
  AlertCircle,
  Calendar,
  Zap
} from 'lucide-react'

interface ClaimAnalysis {
  claim_intelligence_score: number
  claim_risk_level: string
  settlement_opportunity: string
  insurance_estimate: number
  contractor_estimate: number
  claim_gap: number
  potential_settlement_increase: number
  missing_scope_items: any[]
  pricing_suppressions: any[]
  coverage_gaps: any[]
  settlement_opportunities: any[]
  carrier_behavior_flags: any[]
  labor_suppression_rate: number
  op_omission_detected: boolean
}

interface CarrierPattern {
  carrier_name: string
  issue_type: string
  frequency: number
  avg_claim_gap: number
  common_missing_items: string[]
}

interface CoverageFlag {
  coverage_type: string
  coverage_alert: string
  alert_severity: string
  estimated_value: number
  description: string
}

interface ClaimAlert {
  alert_type: string
  alert_title: string
  alert_message: string
  alert_severity: string
  action_required: boolean
  action_url: string
}

interface RecommendedAction {
  action_type: string
  action_title: string
  action_description: string
  estimated_impact: number
  priority: number
  action_url: string
  is_completed: boolean
}

interface TimelineMilestone {
  milestone_type: string
  milestone_date: string
  milestone_status: string
  description: string
}

export default function ClaimIntelligenceDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [claimId, setClaimId] = useState<string | null>(null)
  const [carrierName, setCarrierName] = useState<string>('')
  
  const [analysis, setAnalysis] = useState<ClaimAnalysis | null>(null)
  const [carrierPatterns, setCarrierPatterns] = useState<CarrierPattern[]>([])
  const [coverageFlags, setCoverageFlags] = useState<CoverageFlag[]>([])
  const [alerts, setAlerts] = useState<ClaimAlert[]>([])
  const [actions, setActions] = useState<RecommendedAction[]>([])
  const [timeline, setTimeline] = useState<TimelineMilestone[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get the most recent claim for this user
      const { data: claims } = await supabase
        .from('claims')
        .select('id, carrier_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!claims || claims.length === 0) {
        setLoading(false)
        return
      }

      const claim = claims[0]
      setClaimId(claim.id)
      setCarrierName(claim.carrier_name || 'Unknown Carrier')

      // Load all dashboard data in parallel
      const [
        analysisRes,
        patternsRes,
        flagsRes,
        alertsRes,
        actionsRes,
        timelineRes
      ] = await Promise.all([
        supabase.from('claim_analysis').select('*').eq('claim_id', claim.id).single(),
        supabase.from('carrier_patterns').select('*').eq('carrier_name', claim.carrier_name).limit(5),
        supabase.from('coverage_flags').select('*').eq('claim_id', claim.id).eq('is_resolved', false),
        supabase.from('claim_alerts').select('*').eq('claim_id', claim.id).eq('is_dismissed', false).order('created_at', { ascending: false }).limit(5),
        supabase.from('recommended_actions').select('*').eq('claim_id', claim.id).eq('is_completed', false).order('priority', { ascending: false }).limit(4),
        supabase.from('claim_timeline').select('*').eq('claim_id', claim.id).order('milestone_date', { ascending: true })
      ])

      setAnalysis(analysisRes.data)
      setCarrierPatterns(patternsRes.data || [])
      setCoverageFlags(flagsRes.data || [])
      setAlerts(alertsRes.data || [])
      setActions(actionsRes.data || [])
      setTimeline(timelineRes.data || [])

    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getOpportunityColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-gray-600 bg-gray-50'
      case 'medium': return 'text-blue-600 bg-blue-50'
      case 'high': return 'text-green-600 bg-green-50'
      case 'very_high': return 'text-emerald-600 bg-emerald-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!claimId || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Claim Data</h2>
          <p className="text-gray-600 mb-6">Start by analyzing your claim to see intelligence insights</p>
          <Link href="/underpayment-detector" className="btn-primary">
            Start Claim Analysis
          </Link>
        </div>
      </div>
    )
  }

  const coverageIssueCount = coverageFlags.length
  const estimateIssueCount = (analysis.missing_scope_items?.length || 0) + (analysis.pricing_suppressions?.length || 0)
  const confidenceLevel = analysis.claim_intelligence_score >= 75 ? 'High' : analysis.claim_intelligence_score >= 50 ? 'Medium' : 'Low'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 border-b border-teal-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Claim Intelligence Command Center</h1>
              <p className="text-teal-300 text-sm">Financial Recovery Control Panel</p>
            </div>
            <Link href="/dashboard" className="text-teal-300 hover:text-teal-200 flex items-center gap-2 text-sm">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* CLAIM GAP DOMINANCE - ABOVE THE FOLD */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 mb-8 border-2 border-teal-500/50">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Claim Gap Detected</h2>
            <div className="mb-4">
              <span className="text-7xl md:text-8xl font-black text-teal-400">
                ${analysis.claim_gap.toLocaleString()}
              </span>
            </div>
            <p className="text-xl text-teal-300 font-semibold mb-1">Potentially Missing</p>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              Based on estimate analysis, coverage review, and scope comparison
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-teal-500/30">
              <p className="text-3xl font-bold text-teal-400">{coverageIssueCount}</p>
              <p className="text-sm text-gray-400 mt-1">Coverage Issues</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-teal-500/30">
              <p className="text-3xl font-bold text-teal-400">{estimateIssueCount}</p>
              <p className="text-sm text-gray-400 mt-1">Estimate Issues</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-teal-500/30">
              <p className="text-3xl font-bold text-teal-400">{confidenceLevel}</p>
              <p className="text-sm text-gray-400 mt-1">Confidence</p>
            </div>
          </div>
        </div>

        {/* ACTION PANEL - HIGH VISIBILITY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link 
            href="/documentation-builder"
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-6 px-6 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
          >
            <FileText className="w-6 h-6" />
            Generate Claim Letter
          </Link>
          <button 
            onClick={() => window.print()}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-6 px-6 rounded-xl shadow-xl border-2 border-teal-500/50 transition-all hover:scale-105 flex items-center justify-center gap-3"
          >
            <BarChart3 className="w-6 h-6" />
            Export Gap Report
          </button>
          <Link 
            href="/strategy-advisor"
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-6 px-6 rounded-xl shadow-xl border-2 border-teal-500/50 transition-all hover:scale-105 flex items-center justify-center gap-3"
          >
            <Target className="w-6 h-6" />
            View Recovery Plan
          </Link>
        </div>

        {/* RECOVERY CONFIDENCE METER */}
        {analysis.claim_intelligence_score > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 mb-8 border border-teal-500/30">
            <h2 className="text-xl font-bold text-white mb-4">Recovery Confidence Meter</h2>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Estimated Recovery Likelihood</span>
                  <span className="text-teal-400 font-bold text-lg">{confidenceLevel}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all ${
                      analysis.claim_intelligence_score >= 75 ? 'bg-teal-500' :
                      analysis.claim_intelligence_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.claim_intelligence_score}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-teal-400">{analysis.claim_intelligence_score}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Claim Intelligence Score */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Intelligence Score</h3>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(analysis.claim_intelligence_score)}`}>
                  {analysis.claim_intelligence_score}
                </span>
                <span className="text-2xl text-gray-400 font-medium">/100</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  analysis.claim_intelligence_score >= 80 ? 'bg-green-600' :
                  analysis.claim_intelligence_score >= 60 ? 'bg-yellow-600' :
                  analysis.claim_intelligence_score >= 40 ? 'bg-orange-600' : 'bg-red-600'
                }`}
                style={{ width: `${analysis.claim_intelligence_score}%` }}
              ></div>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              {analysis.missing_scope_items?.length > 0 && (
                <p>• {analysis.missing_scope_items.length} missing scope items</p>
              )}
              {analysis.coverage_gaps?.length > 0 && (
                <p>• {analysis.coverage_gaps.length} coverage gaps detected</p>
              )}
              {analysis.pricing_suppressions?.length > 0 && (
                <p>• Pricing suppression detected</p>
              )}
            </div>
          </div>

          {/* Claim Gap Estimate */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Potential Claim Gap</h3>
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div className="mb-2">
              <span className="text-5xl font-bold text-red-600">
                ${analysis.claim_gap.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 mt-4">
              <div className="flex justify-between">
                <span>Insurance Estimate:</span>
                <span className="font-semibold">${analysis.insurance_estimate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Contractor Estimate:</span>
                <span className="font-semibold">${analysis.contractor_estimate.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Claim Risk Level */}
          <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getRiskColor(analysis.claim_risk_level)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Risk Level</h3>
              <AlertTriangle className={`w-5 h-5 ${analysis.claim_risk_level === 'critical' ? 'text-red-600' : analysis.claim_risk_level === 'high' ? 'text-orange-600' : 'text-yellow-600'}`} />
            </div>
            <div className="mb-4">
              <span className={`text-3xl font-bold capitalize ${
                analysis.claim_risk_level === 'critical' ? 'text-red-600' :
                analysis.claim_risk_level === 'high' ? 'text-orange-600' :
                analysis.claim_risk_level === 'moderate' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {analysis.claim_risk_level}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {analysis.claim_risk_level === 'critical' && 'Immediate action required'}
              {analysis.claim_risk_level === 'high' && 'High priority attention needed'}
              {analysis.claim_risk_level === 'moderate' && 'Monitor and review regularly'}
              {analysis.claim_risk_level === 'low' && 'Claim progressing normally'}
            </p>
          </div>

          {/* Settlement Opportunity */}
          <div className={`bg-white rounded-xl shadow-lg p-6 border-2 border-green-100`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Settlement Opportunity</h3>
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div className="mb-2">
              <span className={`text-3xl font-bold capitalize ${getOpportunityColor(analysis.settlement_opportunity)}`}>
                {analysis.settlement_opportunity.replace('_', ' ')}
              </span>
            </div>
            {analysis.potential_settlement_increase > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Potential Increase:</p>
                <p className="text-2xl font-bold text-green-600">
                  +${analysis.potential_settlement_increase.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CLAIM GAP ENGINE */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Claim Gap Analysis
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Insurance Estimate</p>
              <p className="text-3xl font-bold text-gray-900">${analysis.insurance_estimate.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Contractor Estimate</p>
              <p className="text-3xl font-bold text-blue-600">${analysis.contractor_estimate.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <p className="text-sm text-gray-600 mb-2">Potential Gap</p>
              <p className="text-3xl font-bold text-red-600">${analysis.claim_gap.toLocaleString()}</p>
            </div>
          </div>

          {/* Visual Bar Comparison */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Insurance Estimate</span>
                <span className="font-semibold">${analysis.insurance_estimate.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gray-600 h-4 rounded-full"
                  style={{ width: `${(analysis.insurance_estimate / analysis.contractor_estimate) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Contractor Estimate</span>
                <span className="font-semibold">${analysis.contractor_estimate.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-blue-600 h-4 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* UNCLAIMED COVERAGE DETECTED */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border-2 border-red-500/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-400" />
              Unclaimed Coverage Detected
            </h2>

            {coverageFlags.length > 0 ? (
              <div className="space-y-3">
                {coverageFlags.map((flag, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-teal-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-white capitalize">
                        {flag.coverage_type.replace(/_/g, ' ')} not applied
                      </p>
                      {flag.estimated_value > 0 && (
                        <span className="text-lg font-black text-teal-400">
                          +${flag.estimated_value.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{flag.coverage_alert}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-400">All coverage properly applied</p>
              </div>
            )}
          </div>

          {/* ESTIMATE ISSUES DETECTED */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border-2 border-orange-500/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              Estimate Issues Detected
            </h2>

            {(analysis.missing_scope_items?.length > 0 || analysis.pricing_suppressions?.length > 0) ? (
              <div className="space-y-3">
                {analysis.pricing_suppressions && analysis.pricing_suppressions.length > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-red-500">
                    <p className="font-bold text-white mb-1">Material pricing below market</p>
                    <p className="text-sm text-gray-300">
                      {analysis.pricing_suppressions[0]?.description || 'Pricing suppression detected'}
                    </p>
                    {analysis.pricing_suppressions[0]?.estimated_impact && (
                      <p className="text-teal-400 font-bold mt-2">
                        ${analysis.pricing_suppressions[0].estimated_impact.toLocaleString()} impact
                      </p>
                    )}
                  </div>
                )}

                {analysis.missing_scope_items && analysis.missing_scope_items.length > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-orange-500">
                    <p className="font-bold text-white mb-2">Missing line items</p>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {analysis.missing_scope_items.slice(0, 4).map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between">
                          <span>• {item.item || item}</span>
                          {item.estimated_value && (
                            <span className="text-teal-400 font-bold ml-3">
                              ${item.estimated_value.toLocaleString()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.labor_suppression_rate && analysis.labor_suppression_rate > 0 && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-yellow-500">
                    <p className="font-bold text-white">Labor undercalculated</p>
                    <p className="text-sm text-gray-300 mt-1">
                      {analysis.labor_suppression_rate}% below regional average
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-400">No estimate issues detected</p>
              </div>
            )}
          </div>
        </div>

        {/* CARRIER BEHAVIOR DETECTED - HIGH VALUE */}
        {carrierPatterns.length > 0 && (
          <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl shadow-2xl p-6 text-white mb-8 border-2 border-red-500/50">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-300" />
              Carrier Behavior Detected
            </h2>
            <p className="text-red-200 mb-6">Carrier: <span className="font-bold">{carrierName}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {carrierPatterns.find(p => p.issue_type === 'labor_suppression') && (
                <div className="bg-red-950/50 backdrop-blur rounded-lg p-4 border border-red-500/30">
                  <p className="text-sm text-red-200 mb-2">Labor suppression:</p>
                  <p className="text-4xl font-black text-teal-400">High</p>
                  <p className="text-xs text-red-300 mt-2">
                    {carrierPatterns.find(p => p.issue_type === 'labor_suppression')?.frequency} cases
                  </p>
                </div>
              )}

              {carrierPatterns.find(p => p.issue_type === 'op_omission') && (
                <div className="bg-red-950/50 backdrop-blur rounded-lg p-4 border border-red-500/30">
                  <p className="text-sm text-red-200 mb-2">O&P omission:</p>
                  <p className="text-4xl font-black text-teal-400">Likely</p>
                  <p className="text-xs text-red-300 mt-2">
                    {carrierPatterns.find(p => p.issue_type === 'op_omission')?.frequency} cases
                  </p>
                </div>
              )}

              <div className="bg-red-950/50 backdrop-blur rounded-lg p-4 border border-red-500/30">
                <p className="text-sm text-red-200 mb-2">Avg underpayment pattern:</p>
                <p className="text-4xl font-black text-teal-400">
                  ${Math.round(carrierPatterns.reduce((sum, p) => sum + p.avg_claim_gap, 0) / carrierPatterns.length).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-red-950/30 rounded-lg p-3 border border-red-500/30">
              <p className="text-xs text-red-200">Based on historical claim patterns</p>
            </div>
          </div>
        )}

        {/* CLAIM GAP BREAKDOWN - DETAILED VIEW */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 mb-8 border border-teal-500/30">
          <h2 className="text-2xl font-bold text-white mb-6">Claim Gap Breakdown</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-400 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-gray-400 uppercase">Insurance Paid</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-gray-400 uppercase">Actual Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-teal-400 uppercase">Missing</th>
                </tr>
              </thead>
              <tbody>
                {analysis.missing_scope_items && analysis.missing_scope_items.length > 0 ? (
                  analysis.missing_scope_items.slice(0, 5).map((item: any, idx: number) => {
                    const insurancePaid = item.insurance_value || Math.round(analysis.insurance_estimate * 0.3)
                    const actualCost = item.estimated_value || Math.round(analysis.contractor_estimate * 0.3)
                    const missing = actualCost - insurancePaid
                    
                    return (
                      <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                        <td className="py-4 px-4 text-white font-medium">{item.item || 'Roofing'}</td>
                        <td className="py-4 px-4 text-right text-gray-300">${insurancePaid.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-white font-semibold">${actualCost.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-teal-400 font-black text-lg">${missing.toLocaleString()}</td>
                      </tr>
                    )
                  })
                ) : (
                  <>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-4 px-4 text-white font-medium">Roofing</td>
                      <td className="py-4 px-4 text-right text-gray-300">${Math.round(analysis.insurance_estimate * 0.45).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-white font-semibold">${Math.round(analysis.contractor_estimate * 0.45).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-teal-400 font-black text-lg">${Math.round(analysis.claim_gap * 0.45).toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-4 px-4 text-white font-medium">Interior</td>
                      <td className="py-4 px-4 text-right text-gray-300">${Math.round(analysis.insurance_estimate * 0.25).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-white font-semibold">${Math.round(analysis.contractor_estimate * 0.25).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-teal-400 font-black text-lg">${Math.round(analysis.claim_gap * 0.25).toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-4 px-4 text-white font-medium">Exterior</td>
                      <td className="py-4 px-4 text-right text-gray-300">${Math.round(analysis.insurance_estimate * 0.20).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-white font-semibold">${Math.round(analysis.contractor_estimate * 0.20).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-teal-400 font-black text-lg">${Math.round(analysis.claim_gap * 0.20).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 text-white font-medium">Other</td>
                      <td className="py-4 px-4 text-right text-gray-300">${Math.round(analysis.insurance_estimate * 0.10).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-white font-semibold">${Math.round(analysis.contractor_estimate * 0.10).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-teal-400 font-black text-lg">${Math.round(analysis.claim_gap * 0.10).toLocaleString()}</td>
                    </tr>
                  </>
                )}
                <tr className="border-t-2 border-teal-500">
                  <td className="py-4 px-4 text-white font-black text-lg">TOTAL</td>
                  <td className="py-4 px-4 text-right text-gray-300 font-bold">${analysis.insurance_estimate.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right text-white font-bold">${analysis.contractor_estimate.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right text-teal-400 font-black text-2xl">${analysis.claim_gap.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
