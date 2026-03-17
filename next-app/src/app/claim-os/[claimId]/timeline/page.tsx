'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react'

interface TimelineMilestone {
  id: string
  milestone_type: string
  milestone_date: string
  milestone_status: string
  description: string
  notes: string
}

export default function TimelinePage({ params }: { params: { claimId: string } }) {
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
  }, [params.claimId])

  const loadTimeline = async () => {
    try {
      const [milestonesRes, eventsRes] = await Promise.all([
        supabase.from('claim_timeline').select('*').eq('claim_id', params.claimId).order('milestone_date', { ascending: true }),
        supabase.from('claim_events_log').select('*').eq('claim_id', params.claimId).order('created_at', { ascending: false }).limit(20)
      ])

      setMilestones(milestonesRes.data || [])
      setEvents(eventsRes.data || [])
    } catch (error) {
      console.error('Failed to load timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'pending': return <Circle className="w-6 h-6 text-yellow-600" />
      case 'overdue': return <AlertCircle className="w-6 h-6 text-red-600" />
      default: return <Circle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200'
      case 'pending': return 'bg-yellow-50 border-yellow-200'
      case 'overdue': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Timeline</h1>
        <p className="text-gray-600 mb-6">Track your claim progress and key milestones</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Key Milestones
            </h2>

            {milestones.length > 0 ? (
              <div className="space-y-4">
                {milestones.map((milestone, idx) => (
                  <div key={milestone.id} className="relative">
                    {idx < milestones.length - 1 && (
                      <div className="absolute left-3 top-12 w-0.5 h-full bg-gray-200"></div>
                    )}
                    <div className={`p-4 rounded-lg border-2 ${getStatusColor(milestone.milestone_status)}`}>
                      <div className="flex items-start gap-3">
                        {getStatusIcon(milestone.milestone_status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-900 capitalize">
                              {milestone.milestone_type.replace(/_/g, ' ')}
                            </h3>
                            <span className="text-sm text-gray-600">
                              {new Date(milestone.milestone_date).toLocaleDateString()}
                            </span>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-gray-700">{milestone.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">No milestones tracked yet</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>

            {events.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{event.event_title}</p>
                        {event.event_description && (
                          <p className="text-xs text-gray-600 mt-1">{event.event_description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
