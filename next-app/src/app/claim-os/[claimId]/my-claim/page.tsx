'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Edit2, Save, X } from 'lucide-react'

export default function MyClaimPage({ params }: { params: { claimId: string } }) {
  const [claim, setClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    loadClaim()
  }, [params.claimId])

  const loadClaim = async () => {
    try {
      const { data } = await supabase
        .from('claims')
        .select('*')
        .eq('id', params.claimId)
        .single()

      setClaim(data)
      setFormData(data || {})
    } catch (error) {
      console.error('Failed to load claim:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase
        .from('claims')
        .update({
          claim_name: formData.claim_name,
          carrier_name: formData.carrier_name,
          claim_number: formData.claim_number,
          loss_date: formData.loss_date,
          claim_status: formData.claim_status,
          property_type: formData.property_type,
          claim_type: formData.claim_type,
          adjuster_name: formData.adjuster_name,
          adjuster_phone: formData.adjuster_phone,
          adjuster_email: formData.adjuster_email
        })
        .eq('id', params.claimId)

      setClaim(formData)
      setEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
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
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Claim</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false)
                  setFormData(claim)
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.claim_name || ''}
                  onChange={(e) => setFormData({ ...formData, claim_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{claim?.claim_name || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Status</label>
              {editing ? (
                <select
                  value={formData.claim_status || 'active'}
                  onChange={(e) => setFormData({ ...formData, claim_status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="settled">Settled</option>
                  <option value="disputed">Disputed</option>
                  <option value="closed">Closed</option>
                </select>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 capitalize">
                  {claim?.claim_status || 'active'}
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Carrier</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.carrier_name || ''}
                  onChange={(e) => setFormData({ ...formData, carrier_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{claim?.carrier_name || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Number</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.claim_number || ''}
                  onChange={(e) => setFormData({ ...formData, claim_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{claim?.claim_number || 'N/A'}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.property_type || ''}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{claim?.property_type || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Claim Type</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.claim_type || ''}
                  onChange={(e) => setFormData({ ...formData, claim_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{claim?.claim_type || 'N/A'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Loss</label>
            {editing ? (
              <input
                type="date"
                value={formData.loss_date || ''}
                onChange={(e) => setFormData({ ...formData, loss_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-900">
                {claim?.loss_date ? new Date(claim.loss_date).toLocaleDateString() : 'N/A'}
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Adjuster Information</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adjuster Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.adjuster_name || ''}
                    onChange={(e) => setFormData({ ...formData, adjuster_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{claim?.adjuster_name || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adjuster Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.adjuster_phone || ''}
                    onChange={(e) => setFormData({ ...formData, adjuster_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{claim?.adjuster_phone || 'N/A'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adjuster Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.adjuster_email || ''}
                    onChange={(e) => setFormData({ ...formData, adjuster_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{claim?.adjuster_email || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
