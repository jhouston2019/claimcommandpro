'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Activity,
  DollarSign,
  AlertTriangle,
  Target,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface DashboardData {
  claim: any
  analysis: any
  alerts: any[]
  actions: any[]
  recentEvents: any[]
  documentCount: number
  paymentTotal: number
}

export default function ClaimOSDashboard({ params }: { params: { claimId: string } }) {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [params.claimId])

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [claimRes, analysisRes, alertsRes, actionsRes, eventsRes, docsRes, paymentsRes] = await Promise.all([
        supabase.from('claims').select('*').eq('id', params.claimId).eq('user_id', user.id).single(),
        supabase.from('claim_analysis').select('*').eq('claim_id', params.claimId).single(),
        supabase.from('claim_alerts').select('*').eq('claim_id', params.claimId).eq('is_dismissed', false).order('created_at', { ascending: false }).limit(5),
        supabase.from('recommended_actions').select('*').eq('claim_id', params.claimId).eq('is_completed', false).order('priority', { ascending: false }).limit(4),
        supabase.from('claim_events_log').select('*').eq('claim_id', params.claimId).order('created_at', { ascending: false }).limit(10),
        supabase.from('documents').select('id', { count: 'exact' }).eq('claim_id', params.claimId),
        supabase.from('payments').select('amount').eq('claim_id', params.claimId)
      ])

      const paymentTotal = paymentsRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      setData({
        claim: claimRes.data,
        analysis: analysisRes.data,
        alerts: alertsRes.data || [],
        actions: actionsRes.data || [],
        recentEvents: eventsRes.data || [],
        documentCount: docsRes.count || 0,
        paymentTotal
      })

    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Failed to load claim workspace</p>
          <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const { claim, analysis, alerts, actions, recentEvents, documentCount, paymentTotal } = data

  return (
    <div className="p-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Intelligence Score</h3>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-bold text-blue-600">
              {analysis?.claim_intelligence_score || 0}
            </span>
            <span className="text-2xl text-gray-400 font-medium">/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${analysis?.claim_intelligence_score || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Claim Gap</h3>
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <div className="mb-2">
            <span className="text-5xl font-bold text-red-600">
              ${(analysis?.claim_gap || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Potential missing value
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Risk Level</h3>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-yellow-600 capitalize">
              {analysis?.claim_risk_level || 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Claim risk assessment
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Settlement Opportunity</h3>
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-green-600 capitalize">
              {analysis?.settlement_opportunity || 'Unknown'}
            </span>
          </div>
          {analysis?.potential_settlement_increase > 0 && (
            <p className="text-sm text-green-600 font-semibold">
              +${analysis.potential_settlement_increase.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="bg-blue-100 rounded-lg p-3">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{documentCount}</p>
            <p className="text-sm text-gray-600">Documents</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="bg-green-100 rounded-lg p-3">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">${paymentTotal.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Payments Received</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="bg-orange-100 rounded-lg p-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            <p className="text-sm text-gray-600">Active Alerts</p>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Active Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.alert_severity === 'critical' ? 'bg-red-50 border-red-600' :
                  alert.alert_severity === 'warning' ? 'bg-yellow-50 border-yellow-600' :
                  'bg-blue-50 border-blue-600'
                }`}
              >
                <p className="font-semibold text-gray-900 mb-1">{alert.alert_title}</p>
                <p className="text-sm text-gray-700">{alert.alert_message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Recommended Next Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action) => (
              <div 
                key={action.id}
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

      {recentEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{event.event_title}</p>
                  {event.event_description && (
                    <p className="text-sm text-gray-600 mt-1">{event.event_description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
