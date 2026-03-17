'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Shield, AlertTriangle, BarChart3 } from 'lucide-react'

export default function CarrierIntelPage({ params }: { params: { claimId: string } }) {
  const [carrierName, setCarrierName] = useState<string>('')
  const [patterns, setPatterns] = useState<any[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCarrierIntel()
  }, [params.claimId])

  const loadCarrierIntel = async () => {
    try {
      const { data: claim } = await supabase
        .from('claims')
        .select('carrier_name')
        .eq('id', params.claimId)
        .single()

      if (!claim) return

      setCarrierName(claim.carrier_name)

      const [patternsRes, analysisRes] = await Promise.all([
        supabase.from('carrier_patterns').select('*').eq('carrier_name', claim.carrier_name),
        supabase.from('claim_analysis').select('*').eq('claim_id', params.claimId).single()
      ])

      setPatterns(patternsRes.data || [])
      setAnalysis(analysisRes.data)
    } catch (error) {
      console.error('Failed to load carrier intel:', error)
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

  const laborSuppressionPattern = patterns.find(p => p.issue_type === 'labor_suppression')
  const opOmissionPattern = patterns.find(p => p.issue_type === 'op_omission')
  const avgGap = patterns.reduce((sum, p) => sum + (p.avg_claim_gap || 0), 0) / (patterns.length || 1)

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carrier Intelligence</h1>
        <p className="text-gray-600 mb-6">Behavior patterns and insights for {carrierName}</p>

        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl shadow-lg p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            {carrierName} Behavior Patterns
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="text-sm text-blue-200 mb-1">Labor Suppression Rate</p>
              <p className="text-4xl font-bold mb-2">
                {laborSuppressionPattern ? `${Math.round((laborSuppressionPattern.frequency / 500) * 100)}%` : 'N/A'}
              </p>
              <p className="text-sm text-blue-200">
                {laborSuppressionPattern?.frequency || 0} cases detected
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="text-sm text-blue-200 mb-1">O&P Omission Rate</p>
              <p className="text-4xl font-bold mb-2">
                {opOmissionPattern ? `${Math.round((opOmissionPattern.frequency / 500) * 100)}%` : 'N/A'}
              </p>
              <p className="text-sm text-blue-200">
                {opOmissionPattern?.frequency || 0} cases detected
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="text-sm text-blue-200 mb-1">Avg Claim Gap</p>
              <p className="text-4xl font-bold mb-2">
                ${Math.round(avgGap).toLocaleString()}
              </p>
              <p className="text-sm text-blue-200">
                Across {patterns.length} pattern types
              </p>
            </div>
          </div>

          {laborSuppressionPattern?.common_missing_items && laborSuppressionPattern.common_missing_items.length > 0 && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <p className="font-semibold mb-3">Common Missing Scope Items:</p>
              <div className="flex flex-wrap gap-2">
                {laborSuppressionPattern.common_missing_items.map((item: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {patterns.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Detected Patterns
            </h2>
            <div className="space-y-3">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 capitalize">
                      {pattern.issue_type.replace(/_/g, ' ')}
                    </h3>
                    <span className="text-sm font-semibold text-blue-600">
                      {pattern.frequency} cases
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Average gap detected:</span>
                    <span className="font-bold text-red-600">
                      ${Math.round(pattern.avg_claim_gap).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Your Claim vs {carrierName} Patterns
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Your Claim Gap:</span>
                  <span className="text-2xl font-bold text-red-600">
                    ${(analysis.claim_gap || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{carrierName} Average Gap:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${Math.round(avgGap).toLocaleString()}
                  </span>
                </div>
              </div>

              {analysis.claim_gap > avgGap && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-900">
                    ⚠️ Your claim gap is {Math.round(((analysis.claim_gap - avgGap) / avgGap) * 100)}% higher than average
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    This suggests significant underpayment that should be challenged
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {patterns.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Intelligence Data Available</h3>
            <p className="text-gray-600">Carrier pattern data will appear as more claims are analyzed</p>
          </div>
        )}
      </div>
    </div>
  )
}
