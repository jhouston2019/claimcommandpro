'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, AlertTriangle, TrendingDown, FileText } from 'lucide-react'
import Link from 'next/link'

export default function EstimateReviewPage({ params }: { params: { claimId: string } }) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [discrepancies, setDiscrepancies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEstimateReview()
  }, [params.claimId])

  const loadEstimateReview = async () => {
    try {
      const [analysisRes, discrepanciesRes] = await Promise.all([
        supabase.from('claim_analysis').select('*').eq('claim_id', params.claimId).single(),
        supabase.from('claim_estimate_discrepancies').select('*').eq('claim_id', params.claimId).eq('resolved', false)
      ])

      setAnalysis(analysisRes.data)
      setDiscrepancies(discrepanciesRes.data || [])
    } catch (error) {
      console.error('Failed to load estimate review:', error)
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

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Estimate Review</h1>

        {analysis && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Estimate Comparison
              </h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Insurance Estimate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${(analysis.insurance_estimate || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Contractor Estimate</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ${(analysis.contractor_estimate || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <p className="text-sm text-gray-600 mb-2">Potential Gap</p>
                  <p className="text-3xl font-bold text-red-600">
                    ${(analysis.claim_gap || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Insurance Estimate</span>
                    <span className="font-semibold">${(analysis.insurance_estimate || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gray-600 h-4 rounded-full"
                      style={{ width: `${analysis.contractor_estimate > 0 ? (analysis.insurance_estimate / analysis.contractor_estimate) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Contractor Estimate</span>
                    <span className="font-semibold">${(analysis.contractor_estimate || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-blue-600 h-4 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {analysis.missing_scope_items && analysis.missing_scope_items.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Missing Scope Items ({analysis.missing_scope_items.length})
                </h2>
                <div className="space-y-2">
                  {analysis.missing_scope_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 border-l-4 border-orange-600 rounded">
                      <span className="text-sm font-medium text-gray-900">{item.item}</span>
                      {item.estimated_value && (
                        <span className="text-sm font-bold text-orange-600">
                          ${item.estimated_value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.pricing_suppressions && analysis.pricing_suppressions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Pricing Suppressions Detected
                </h2>
                <div className="space-y-3">
                  {analysis.pricing_suppressions.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 bg-red-50 border-l-4 border-red-600 rounded">
                      <p className="font-semibold text-red-900 mb-1">{item.description}</p>
                      {item.estimated_impact && (
                        <p className="text-sm text-red-700">
                          Estimated impact: ${item.estimated_impact.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {discrepancies.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Line Item Discrepancies</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contractor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {discrepancies.map((disc) => (
                        <tr key={disc.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{disc.line_item_description}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">{disc.discrepancy_type.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">${(disc.contractor_total || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">${(disc.carrier_total || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-600">${(disc.difference_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!analysis && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Estimate Analysis Yet</h3>
            <p className="text-gray-600 mb-6">Upload your estimate to get started with analysis</p>
            <Link href={`/claim-os/${params.claimId}/documents?upload=true`} className="btn-primary">
              Upload Estimate
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
