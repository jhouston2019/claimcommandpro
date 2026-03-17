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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Claim Intelligence Dashboard</h1>
              <p className="text-blue-200">Real-time claim analysis and carrier behavior intelligence</p>
            </div>
            <Link href="/dashboard" className="text-blue-200 hover:text-white flex items-center gap-2">
              <ArrowRight className="w-5 h-5 rotate-180" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* CLAIM OVERVIEW PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
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
          
          {/* ESTIMATE REVIEW ENGINE */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Estimate Review
            </h2>

            {analysis.missing_scope_items && analysis.missing_scope_items.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded">
                  <p className="font-semibold text-orange-900 mb-2">
                    Missing Repair Items Detected ({analysis.missing_scope_items.length})
                  </p>
                  <ul className="space-y-1 text-sm text-orange-800">
                    {analysis.missing_scope_items.slice(0, 5).map((item: any, idx: number) => (
                      <li key={idx}>• {item.item || item}</li>
                    ))}
                  </ul>
                </div>

                {analysis.pricing_suppressions && analysis.pricing_suppressions.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                    <p className="font-semibold text-red-900 mb-2">Pricing Suppression Detected</p>
                    <ul className="space-y-1 text-sm text-red-800">
                      {analysis.pricing_suppressions.slice(0, 3).map((item: any, idx: number) => (
                        <li key={idx}>• {item.description || item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.labor_suppression_rate && analysis.labor_suppression_rate > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
                    <p className="font-semibold text-yellow-900">
                      Labor pricing {analysis.labor_suppression_rate}% below regional average
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No estimate issues detected</p>
            )}
          </div>

          {/* COVERAGE GAP DETECTION */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Coverage Analysis
            </h2>

            {coverageFlags.length > 0 ? (
              <div className="space-y-3">
                {coverageFlags.map((flag, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      flag.alert_severity === 'critical' ? 'bg-red-50 border-red-600' :
                      flag.alert_severity === 'warning' ? 'bg-yellow-50 border-yellow-600' :
                      'bg-blue-50 border-blue-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900 capitalize">
                        {flag.coverage_type.replace(/_/g, ' ')}
                      </p>
                      {flag.estimated_value > 0 && (
                        <span className="text-sm font-bold text-green-600">
                          +${flag.estimated_value.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{flag.coverage_alert}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No coverage gaps detected</p>
            )}
          </div>
        </div>

        {/* CARRIER BEHAVIOR INTELLIGENCE */}
        {carrierPatterns.length > 0 && (
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl shadow-lg p-6 text-white mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Carrier Behavior Intelligence: {carrierName}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {carrierPatterns.slice(0, 3).map((pattern, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <p className="text-sm text-blue-200 mb-1 capitalize">
                    {pattern.issue_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-3xl font-bold mb-2">{pattern.frequency}</p>
                  <p className="text-sm text-blue-200">
                    Avg Gap: ${Math.round(pattern.avg_claim_gap).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {carrierPatterns[0]?.common_missing_items && carrierPatterns[0].common_missing_items.length > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                <p className="font-semibold mb-3">Common Missing Scope Items:</p>
                <div className="flex flex-wrap gap-2">
                  {carrierPatterns[0].common_missing_items.map((item: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* CLAIM TIMELINE */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Claim Timeline
            </h2>

            {timeline.length > 0 ? (
              <div className="space-y-3">
                {timeline.map((milestone, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                      milestone.milestone_status === 'completed' ? 'bg-green-600' :
                      milestone.milestone_status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 capitalize">
                          {milestone.milestone_type.replace(/_/g, ' ')}
                        </p>
                        <span className="text-sm text-gray-500">
                          {new Date(milestone.milestone_date).toLocaleDateString()}
                        </span>
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No timeline data available</p>
            )}
          </div>

          {/* ALERTS PANEL */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Active Alerts
            </h2>

            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border ${getSeverityBadge(alert.alert_severity)}`}
                  >
                    <p className="font-semibold mb-1">{alert.alert_title}</p>
                    <p className="text-sm mb-2">{alert.alert_message}</p>
                    {alert.action_required && alert.action_url && (
                      <Link 
                        href={alert.action_url}
                        className="text-sm font-semibold flex items-center gap-1 hover:underline"
                      >
                        Take Action <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No active alerts</p>
            )}
          </div>
        </div>

        {/* ACTION CENTER */}
        {actions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-600" />
              Recommended Next Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actions.map((action, idx) => (
                <div 
                  key={idx}
                  className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{action.action_title}</h3>
                    {action.estimated_impact > 0 && (
                      <span className="text-sm font-bold text-green-600 whitespace-nowrap ml-2">
                        +${action.estimated_impact.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-4">{action.action_description}</p>
                  {action.action_url && (
                    <Link 
                      href={action.action_url}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Start Action <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
