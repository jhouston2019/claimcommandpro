'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Lightbulb, Target, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function StrategyPage({ params }: { params: { claimId: string } }) {
  const [strategy, setStrategy] = useState<any>(null)
  const [actions, setActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStrategy()
  }, [params.claimId])

  const loadStrategy = async () => {
    try {
      const [strategyRes, actionsRes] = await Promise.all([
        supabase.from('claim_strategy').select('*').eq('claim_id', params.claimId).single(),
        supabase.from('recommended_actions').select('*').eq('claim_id', params.claimId).order('priority', { ascending: false })
      ])

      setStrategy(strategyRes.data)
      setActions(actionsRes.data || [])
    } catch (error) {
      console.error('Failed to load strategy:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteAction = async (actionId: string) => {
    try {
      await supabase
        .from('recommended_actions')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', actionId)

      loadStrategy()
    } catch (error) {
      console.error('Failed to complete action:', error)
    }
  }

  const phases = [
    { id: 'initial_review', label: 'Initial Review', description: 'Review claim and gather documents' },
    { id: 'gap_detection', label: 'Gap Detection', description: 'Identify missing scope and pricing issues' },
    { id: 'supplement_preparation', label: 'Supplement Prep', description: 'Prepare supplement request' },
    { id: 'negotiation', label: 'Negotiation', description: 'Negotiate with carrier' },
    { id: 'escalation', label: 'Escalation', description: 'Escalate if needed' },
    { id: 'settlement', label: 'Settlement', description: 'Finalize settlement' }
  ]

  const currentPhaseIndex = phases.findIndex(p => p.id === strategy?.current_phase) || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const pendingActions = actions.filter(a => !a.is_completed)
  const completedActions = actions.filter(a => a.is_completed)

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Strategy</h1>
        <p className="text-gray-600 mb-6">AI-powered recommendations to maximize your claim</p>

        {strategy && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Current Phase</h2>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                {phases.map((phase, idx) => (
                  <div key={phase.id} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 ${
                        idx < currentPhaseIndex ? 'bg-green-600 text-white' :
                        idx === currentPhaseIndex ? 'bg-blue-600 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {idx < currentPhaseIndex ? <CheckCircle className="w-6 h-6" /> : idx + 1}
                      </div>
                      <p className="text-xs font-semibold text-center">{phase.label}</p>
                      <p className="text-xs text-gray-500 text-center mt-1">{phase.description}</p>
                    </div>
                    {idx < phases.length - 1 && (
                      <div className={`absolute top-6 left-1/2 w-full h-1 ${
                        idx < currentPhaseIndex ? 'bg-green-600' : 'bg-gray-200'
                      }`} style={{ transform: 'translateY(-50%)' }}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {pendingActions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Recommended Next Actions ({pendingActions.length})
            </h2>
            <div className="space-y-4">
              {pendingActions.map((action) => (
                <div 
                  key={action.id}
                  className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                          Priority {action.priority}
                        </span>
                        {action.estimated_impact > 0 && (
                          <span className="text-sm font-bold text-green-600">
                            +${action.estimated_impact.toLocaleString()} potential impact
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{action.action_title}</h3>
                      <p className="text-sm text-gray-700 mb-4">{action.action_description}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {action.action_url && (
                      <Link 
                        href={action.action_url}
                        className="btn-primary flex items-center gap-2"
                      >
                        Start Action <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleCompleteAction(action.id)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {coverageFlags.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Hidden Coverage Opportunities
            </h2>
            <div className="space-y-3">
              {coverageFlags.map((flag) => (
                <div 
                  key={flag.id}
                  className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {flag.coverage_type.replace(/_/g, ' ')}
                    </h3>
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
          </div>
        )}

        {completedActions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Completed Actions ({completedActions.length})
            </h2>
            <div className="space-y-2">
              {completedActions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{action.action_title}</p>
                    <p className="text-xs text-gray-600">
                      Completed {new Date(action.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingActions.length === 0 && coverageFlags.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Strategy Recommendations Yet</h3>
            <p className="text-gray-600">Complete your claim analysis to receive strategic recommendations</p>
          </div>
        )}
      </div>
    </div>
  )
}
