'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, FileText, Download, Eye, Plus, Send } from 'lucide-react'
import Link from 'next/link'

interface Letter {
  id: string
  letter_type: string
  letter_title: string
  letter_content: string
  status: string
  pdf_url: string
  created_at: string
  sent_date: string
}

export default function LettersPage({ params }: { params: { claimId: string } }) {
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerator, setShowGenerator] = useState(false)

  useEffect(() => {
    loadLetters()
  }, [params.claimId])

  const loadLetters = async () => {
    try {
      const { data } = await supabase
        .from('generated_letters')
        .select('*')
        .eq('claim_id', params.claimId)
        .order('created_at', { ascending: false })

      setLetters(data || [])
    } catch (error) {
      console.error('Failed to load letters:', error)
    } finally {
      setLoading(false)
    }
  }

  const letterTypes = [
    { value: 'supplement_request', label: 'Supplement Request', description: 'Request additional payment for missing scope' },
    { value: 'dispute_letter', label: 'Dispute Letter', description: 'Dispute carrier decision or estimate' },
    { value: 'coverage_request', label: 'Coverage Request', description: 'Request application of specific coverage' },
    { value: 'escalation_letter', label: 'Escalation Letter', description: 'Escalate claim to supervisor or management' },
    { value: 'demand_letter', label: 'Demand Letter', description: 'Formal demand for payment' },
    { value: 'proof_of_loss', label: 'Proof of Loss', description: 'Sworn statement of loss' },
    { value: 'depreciation_request', label: 'Depreciation Request', description: 'Request release of withheld depreciation' },
    { value: 'appraisal_request', label: 'Appraisal Request', description: 'Request appraisal process' }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'ready': return 'bg-blue-100 text-blue-800'
      case 'sent': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-800'
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
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Letters & Documents</h1>
            <p className="text-gray-600">Generate professional claim correspondence</p>
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Letter
          </button>
        </div>

        {letters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {letters.map((letter) => (
              <div key={letter.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{letter.letter_title}</h3>
                      <p className="text-xs text-gray-500 capitalize">{letter.letter_type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(letter.status)}`}>
                    {letter.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {letter.letter_content.substring(0, 150)}...
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Created {new Date(letter.created_at).toLocaleDateString()}</span>
                  {letter.sent_date && (
                    <span className="text-green-600 font-semibold">
                      Sent {new Date(letter.sent_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 btn-secondary flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  {letter.pdf_url && (
                    <a
                      href={letter.pdf_url}
                      download
                      className="flex-1 btn-primary flex items-center justify-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Letters Generated Yet</h3>
            <p className="text-gray-600 mb-6">Generate your first professional claim letter</p>
            <button
              onClick={() => setShowGenerator(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate Letter
            </button>
          </div>
        )}

        {showGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Letter</h2>
              
              <div className="space-y-3">
                {letterTypes.map((type) => (
                  <Link
                    key={type.value}
                    href={`/documentation-builder?claimId=${params.claimId}&type=${type.value}`}
                    className="block p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
                  >
                    <h3 className="font-bold text-gray-900 mb-1">{type.label}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </Link>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowGenerator(false)}
                  className="w-full btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
