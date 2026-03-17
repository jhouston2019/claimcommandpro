'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Upload, ArrowRight, FileText, Shield } from 'lucide-react'

export default function CreateClaimPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    claimName: '',
    propertyType: '',
    claimType: '',
    carrierName: '',
    claimNumber: '',
    lossDate: '',
    insuranceEstimate: ''
  })

  const [files, setFiles] = useState<{
    estimate: File | null
    policy: File | null
  }>({
    estimate: null,
    policy: null
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (type: 'estimate' | 'policy', file: File | null) => {
    setFiles({
      ...files,
      [type]: file
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert({
          user_id: user.id,
          claim_name: formData.claimName,
          property_type: formData.propertyType,
          claim_type: formData.claimType,
          carrier_name: formData.carrierName,
          claim_number: formData.claimNumber || null,
          loss_date: formData.lossDate || null,
          claim_status: 'active',
          claim_workspace_active: true
        })
        .select()
        .single()

      if (claimError) throw claimError

      await supabase.rpc('initialize_claim_workspace', {
        p_claim_id: claim.id,
        p_user_id: user.id,
        p_claim_name: formData.claimName
      })

      if (files.estimate) {
        const estimatePath = `${user.id}/${claim.id}/estimate_${Date.now()}_${files.estimate.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('claim-documents')
          .upload(estimatePath, files.estimate)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('claim-documents')
            .getPublicUrl(estimatePath)

          await supabase.from('documents').insert({
            claim_id: claim.id,
            user_id: user.id,
            file_name: files.estimate.name,
            file_url: publicUrl,
            file_type: 'estimate_carrier',
            file_category: 'estimates',
            storage_path: estimatePath,
            file_size: files.estimate.size,
            mime_type: files.estimate.type
          })
        }
      }

      if (files.policy) {
        const policyPath = `${user.id}/${claim.id}/policy_${Date.now()}_${files.policy.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('claim-documents')
          .upload(policyPath, files.policy)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('claim-documents')
            .getPublicUrl(policyPath)

          await supabase.from('documents').insert({
            claim_id: claim.id,
            user_id: user.id,
            file_name: files.policy.name,
            file_url: publicUrl,
            file_type: 'policy',
            file_category: 'policy',
            storage_path: policyPath,
            file_size: files.policy.size,
            mime_type: files.policy.type
          })
        }
      }

      if (formData.insuranceEstimate) {
        await supabase.from('claim_analysis').insert({
          claim_id: claim.id,
          user_id: user.id,
          insurance_estimate: parseFloat(formData.insuranceEstimate),
          contractor_estimate: 0,
          claim_gap: 0,
          claim_intelligence_score: 50
        })
      }

      router.push(`/claim-os/${claim.id}`)

    } catch (error: any) {
      console.error('Error creating claim:', error)
      alert('Failed to create claim: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Claim Workspace</h1>
          <p className="text-lg text-gray-600">Set up your claim operating system in minutes</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="text-sm font-medium">Claim Details</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Upload Files</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Claim Name *
                  </label>
                  <input
                    type="text"
                    name="claimName"
                    value={formData.claimName}
                    onChange={handleInputChange}
                    placeholder="e.g., Roof Hail Damage - 123 Main St"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Property Type *
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select property type</option>
                      <option value="Single Family Home">Single Family Home</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Condo">Condo</option>
                      <option value="Multi-Family">Multi-Family</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Claim Type *
                    </label>
                    <select
                      name="claimType"
                      value={formData.claimType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select claim type</option>
                      <option value="Roof Hail Damage">Roof Hail Damage</option>
                      <option value="Wind Damage">Wind Damage</option>
                      <option value="Water Damage">Water Damage</option>
                      <option value="Fire Damage">Fire Damage</option>
                      <option value="Storm Damage">Storm Damage</option>
                      <option value="Theft">Theft</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Insurance Carrier *
                  </label>
                  <select
                    name="carrierName"
                    value={formData.carrierName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select carrier</option>
                    <option value="State Farm">State Farm</option>
                    <option value="Allstate">Allstate</option>
                    <option value="USAA">USAA</option>
                    <option value="Farmers">Farmers</option>
                    <option value="Liberty Mutual">Liberty Mutual</option>
                    <option value="Progressive">Progressive</option>
                    <option value="Nationwide">Nationwide</option>
                    <option value="American Family">American Family</option>
                    <option value="Travelers">Travelers</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Claim Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="claimNumber"
                      value={formData.claimNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 12345678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Loss *
                    </label>
                    <input
                      type="date"
                      name="lossDate"
                      value={formData.lossDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Insurance Estimate Amount (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      name="insuranceEstimate"
                      value={formData.insuranceEstimate}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter the total from your insurance estimate if you have it</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-primary flex items-center gap-2"
                  >
                    Continue to File Upload
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    <strong>Optional:</strong> Upload your estimate and policy now, or add them later from your claim workspace.
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                        Upload Insurance Estimate
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('estimate', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG</p>
                    {files.estimate && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        ✓ {files.estimate.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                        Upload Insurance Policy
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('policy', e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG</p>
                    {files.policy && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        ✓ {files.policy.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating Workspace...
                      </>
                    ) : (
                      <>
                        Create Claim Workspace
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Cancel and return to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
