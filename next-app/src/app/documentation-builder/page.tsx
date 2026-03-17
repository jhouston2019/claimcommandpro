'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Download, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DocumentationBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoFilling, setAutoFilling] = useState(false)
  const [formData, setFormData] = useState({
    claimNumber: '',
    carrier: '',
    claimType: '',
    dateOfLoss: '',
    scopeDocumentation: '',
    evidenceChecklist: [] as string[],
    disputeLetter: '',
    proofOfLoss: '',
  })
  const [newChecklistItem, setNewChecklistItem] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && searchParams.get('autoFill') === 'true' && searchParams.get('claimId')) {
      autoFillFromAnalysis(searchParams.get('claimId')!)
    }
  }, [user, searchParams])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/documentation-builder')
      return
    }
    setUser(user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_paid')
      .eq('id', user.id)
      .single()

    setIsPaid(profile?.is_paid || false)
  }

  const autoFillFromAnalysis = async (claimId: string) => {
    setAutoFilling(true)
    try {
      const [claimRes, analysisRes, coverageRes] = await Promise.all([
        supabase.from('claims').select('*').eq('id', claimId).single(),
        supabase.from('claim_analysis').select('*').eq('claim_id', claimId).single(),
        supabase.from('coverage_flags').select('*').eq('claim_id', claimId).eq('is_resolved', false)
      ])

      const claim = claimRes.data
      const analysis = analysisRes.data
      const coverage = coverageRes.data || []

      let scopeDoc = 'MISSING SCOPE ITEMS DETECTED:\n\n'
      if (analysis?.missing_scope_items && analysis.missing_scope_items.length > 0) {
        analysis.missing_scope_items.forEach((item: any) => {
          scopeDoc += `• ${item.item || item}`
          if (item.estimated_value) {
            scopeDoc += ` - Estimated value: $${item.estimated_value.toLocaleString()}`
          }
          scopeDoc += '\n'
        })
      }

      scopeDoc += '\n\nPRICING DISCREPANCIES:\n\n'
      if (analysis?.pricing_suppressions && analysis.pricing_suppressions.length > 0) {
        analysis.pricing_suppressions.forEach((issue: any) => {
          scopeDoc += `• ${issue.description || issue}`
          if (issue.estimated_impact) {
            scopeDoc += ` - Impact: $${issue.estimated_impact.toLocaleString()}`
          }
          scopeDoc += '\n'
        })
      }

      scopeDoc += '\n\nCOVERAGE ISSUES:\n\n'
      coverage.forEach((flag: any) => {
        scopeDoc += `• ${flag.coverage_alert}`
        if (flag.estimated_value > 0) {
          scopeDoc += ` - Value: $${flag.estimated_value.toLocaleString()}`
        }
        scopeDoc += '\n'
      })

      const disputeTemplate = `Dear ${claim?.carrier_name || 'Insurance Carrier'},

RE: Claim #${claim?.claim_number || '[CLAIM NUMBER]'} - Dispute of Estimate

I am writing to formally dispute the estimate provided for my claim. My analysis has identified significant discrepancies totaling $${analysis?.claim_gap.toLocaleString() || '0'}.

MISSING SCOPE ITEMS:
${analysis?.missing_scope_items?.map((item: any) => `• ${item.item || item}`).join('\n') || '• [Items to be listed]'}

COVERAGE NOT APPLIED:
${coverage.map((flag: any) => `• ${flag.coverage_type.replace(/_/g, ' ')} - ${flag.coverage_alert}`).join('\n') || '• [Coverage items to be listed]'}

PRICING DISCREPANCIES:
${analysis?.pricing_suppressions?.map((issue: any) => `• ${issue.description || issue}`).join('\n') || '• [Pricing issues to be listed]'}

I request a full review of this estimate and application of all applicable coverage.

Sincerely,
[Your Name]`

      const evidenceItems = [
        'Insurance estimate',
        'Contractor estimate',
        'Photographs of damage',
        'Policy declarations page',
        ...analysis?.missing_scope_items?.map((item: any) => `Documentation for ${item.item || item}`) || []
      ]

      setFormData({
        claimNumber: claim?.claim_number || '',
        carrier: claim?.carrier_name || '',
        claimType: claim?.claim_type || '',
        dateOfLoss: claim?.loss_date || '',
        scopeDocumentation: scopeDoc,
        evidenceChecklist: evidenceItems.slice(0, 10),
        disputeLetter: disputeTemplate,
        proofOfLoss: 'Proof of Loss documentation based on detected gaps and coverage issues.'
      })

    } catch (error) {
      console.error('Auto-fill failed:', error)
    } finally {
      setAutoFilling(false)
    }
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData({
        ...formData,
        evidenceChecklist: [...formData.evidenceChecklist, newChecklistItem.trim()],
      })
      setNewChecklistItem('')
    }
  }

  const removeChecklistItem = (index: number) => {
    setFormData({
      ...formData,
      evidenceChecklist: formData.evidenceChecklist.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/documentation-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to generate packet')

      const data = await response.json()
      router.push(`/documentation-builder/results?id=${data.packetId}`)
    } catch (error) {
      console.error('Failed to generate packet:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !isPaid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            Upgrade to access the documentation packet builder.
          </p>
          <button onClick={() => router.push('/pricing')} className="btn-primary">
            Upgrade Now - $299
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          
          {autoFilling && (
            <div className="bg-teal-50 border-2 border-teal-500 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                <p className="text-teal-900 font-semibold">
                  Auto-filling letter with detected gaps and coverage issues...
                </p>
              </div>
            </div>
          )}

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Recovery Letter Generator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional claim letter pre-filled with your detected gaps and missing coverage.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Claim Information */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Claim Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Number
                  </label>
                  <input
                    type="text"
                    value={formData.claimNumber}
                    onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Carrier
                  </label>
                  <input
                    type="text"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Type
                  </label>
                  <input
                    type="text"
                    value={formData.claimType}
                    onChange={(e) => setFormData({ ...formData, claimType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Wind/Hail, Fire, Water"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Loss
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfLoss}
                    onChange={(e) => setFormData({ ...formData, dateOfLoss: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Scope Documentation */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Scope Documentation</h2>
              <textarea
                value={formData.scopeDocumentation}
                onChange={(e) => setFormData({ ...formData, scopeDocumentation: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the full scope of damage and required repairs..."
              />
            </div>

            {/* Evidence Checklist */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Evidence Checklist</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Add evidence item..."
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-2">
                {formData.evidenceChecklist.map((item, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dispute Letter */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Dispute Letter Template</h2>
              <textarea
                value={formData.disputeLetter}
                onChange={(e) => setFormData({ ...formData, disputeLetter: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Draft your dispute letter..."
              />
            </div>

            {/* Proof of Loss */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Proof of Loss Structure</h2>
              <textarea
                value={formData.proofOfLoss}
                onChange={(e) => setFormData({ ...formData, proofOfLoss: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Outline your proof of loss documentation..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Packet...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Documentation Packet
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
