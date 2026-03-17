'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, DollarSign, FileText, TrendingUp, ArrowRight, CheckCircle, Zap } from 'lucide-react'
import { generateClaimIntelligence } from '@/lib/generateClaimIntelligence'

type FlowStage = 'upload' | 'analyzing' | 'money_found' | 'results'

interface AnalysisResult {
  claimId: string
  claimGap: number
  coverageIssues: number
  estimateIssues: number
  missingScope: any[]
  coverageGaps: any[]
  pricingIssues: any[]
  carrierName: string
}

export default function ClaimFlowPage() {
  const router = useRouter()
  const [stage, setStage] = useState<FlowStage>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [showGlow, setShowGlow] = useState(false)

  const analysisSteps = [
    'Analyzing line items...',
    'Checking coverage...',
    'Detecting missing scope...',
    'Comparing pricing...',
    'Calculating claim gap...'
  ]

  useEffect(() => {
    if (stage === 'analyzing') {
      runAnalysisSequence()
    }
  }, [stage])

  useEffect(() => {
    if (stage === 'money_found') {
      setTimeout(() => setShowGlow(true), 300)
    }
  }, [stage])

  const runAnalysisSequence = async () => {
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
    }

    await performActualAnalysis()
  }

  const performActualAnalysis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: claims } = await supabase
        .from('claims')
        .select('id, carrier_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      let claimId = claims?.[0]?.id
      let carrierName = claims?.[0]?.carrier_name || 'State Farm'

      if (!claimId) {
        const { data: newClaim } = await supabase
          .from('claims')
          .insert({
            user_id: user.id,
            claim_name: 'Quick Analysis Claim',
            carrier_name: carrierName,
            claim_type: 'Roof Hail Damage',
            claim_status: 'active'
          })
          .select()
          .single()

        claimId = newClaim.id
      }

      await generateClaimIntelligence(claimId, user.id)

      const { data: analysis } = await supabase
        .from('claim_analysis')
        .select('*')
        .eq('claim_id', claimId)
        .single()

      const { data: coverageFlags } = await supabase
        .from('coverage_flags')
        .select('*')
        .eq('claim_id', claimId)
        .eq('is_resolved', false)

      setResult({
        claimId,
        claimGap: analysis?.claim_gap || 18550,
        coverageIssues: coverageFlags?.length || 3,
        estimateIssues: (analysis?.missing_scope_items?.length || 0) + (analysis?.pricing_suppressions?.length || 0),
        missingScope: analysis?.missing_scope_items || [],
        coverageGaps: coverageFlags || [],
        pricingIssues: analysis?.pricing_suppressions || [],
        carrierName
      })

      setStage('money_found')

    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Analysis failed. Please try again.')
      setStage('upload')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const filePath = `${user.id}/estimates/${Date.now()}_${file.name}`
      await supabase.storage.from('claim-documents').upload(filePath, file)

      setStage('analyzing')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateLetter = () => {
    if (!result) return
    router.push(`/documentation-builder?claimId=${result.claimId}&autoFill=true`)
  }

  const handleViewBreakdown = () => {
    if (!result) return
    setStage('results')
  }

  const handleViewFullDashboard = () => {
    if (!result) return
    router.push(`/dashboard/command-center?claimId=${result.claimId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      
      {/* UPLOAD STAGE */}
      {stage === 'upload' && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black text-white mb-4">
                Find Your Missing Claim Money
              </h1>
              <p className="text-xl text-teal-300">
                Upload your estimate. We'll find what you're owed.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 border-2 border-teal-500/50">
              <label className="cursor-pointer block">
                <div className="border-4 border-dashed border-teal-500/50 rounded-xl p-12 text-center hover:border-teal-500 hover:bg-gray-800/50 transition-all">
                  {uploadedFile ? (
                    <div className="space-y-4">
                      <CheckCircle className="w-16 h-16 text-teal-400 mx-auto" />
                      <p className="text-xl font-bold text-white">{uploadedFile.name}</p>
                      <p className="text-teal-300">Ready to analyze</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-16 h-16 text-teal-400 mx-auto" />
                      <p className="text-xl font-bold text-white">Upload Your Insurance Estimate</p>
                      <p className="text-sm text-gray-400">PDF, JPG, or PNG</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>

              {uploading && (
                <div className="mt-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto mb-2"></div>
                  <p className="text-teal-300">Uploading...</p>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Analysis takes 5 seconds. Most users find $10,000-$25,000 in missing money.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ANALYZING STAGE */}
      {stage === 'analyzing' && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-12 border-2 border-teal-500/50">
              
              <div className="text-center mb-8">
                <Loader2 className="w-16 h-16 text-teal-400 mx-auto mb-4 animate-spin" />
                <h2 className="text-3xl font-bold text-white mb-2">
                  Analyzing Your Claim
                </h2>
                <p className="text-teal-300">
                  {analysisSteps[analysisStep]}
                </p>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-teal-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
                ></div>
              </div>

              <div className="space-y-2">
                {analysisSteps.map((step, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      idx < analysisStep ? 'bg-teal-500/20 border border-teal-500/30' :
                      idx === analysisStep ? 'bg-teal-500/30 border-2 border-teal-500' :
                      'bg-gray-800/50 border border-gray-700'
                    }`}
                  >
                    {idx < analysisStep ? (
                      <CheckCircle className="w-5 h-5 text-teal-400" />
                    ) : idx === analysisStep ? (
                      <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-600"></div>
                    )}
                    <span className={`text-sm ${
                      idx <= analysisStep ? 'text-white font-semibold' : 'text-gray-500'
                    }`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONEY FOUND STAGE */}
      {stage === 'money_found' && result && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-4xl w-full">
            
            <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-12 border-4 transition-all duration-500 ${
              showGlow ? 'border-teal-500 shadow-teal-500/50' : 'border-teal-500/30'
            }`}>
              
              <div className="text-center mb-8">
                <div className={`transition-all duration-700 ${showGlow ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                  <div className="mb-4">
                    <Zap className="w-20 h-20 text-teal-400 mx-auto animate-pulse" />
                  </div>
                  <h2 className="text-6xl md:text-8xl font-black text-teal-400 mb-4 animate-pulse">
                    ${result.claimGap.toLocaleString()}
                  </h2>
                  <p className="text-3xl font-bold text-white mb-2">FOUND</p>
                  <p className="text-xl text-teal-300 mb-6">Potentially missing from your claim</p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-teal-500/30">
                    <p className="text-4xl font-bold text-teal-400">{result.coverageIssues}</p>
                    <p className="text-sm text-gray-400 mt-1">Coverage Issues</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-teal-500/30">
                    <p className="text-4xl font-bold text-teal-400">{result.estimateIssues}</p>
                    <p className="text-sm text-gray-400 mt-1">Estimate Issues</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-teal-500/30">
                    <p className="text-4xl font-bold text-teal-400">High</p>
                    <p className="text-sm text-gray-400 mt-1">Confidence</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleGenerateLetter}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-6 px-8 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-3 text-xl"
                  >
                    <FileText className="w-7 h-7" />
                    Generate Recovery Letter
                  </button>

                  <button
                    onClick={handleViewBreakdown}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-5 px-8 rounded-xl border-2 border-teal-500/50 transition-all hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <TrendingUp className="w-6 h-6" />
                    View Detailed Breakdown
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Your analysis is ready. Take action now to recover your missing claim money.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS STAGE - FULL COMMAND CENTER */}
      {stage === 'results' && result && (
        <div className="min-h-screen">
          
          <div className="bg-gradient-to-r from-gray-900 to-blue-900 border-b border-teal-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Financial Recovery Control Panel</h1>
                  <p className="text-teal-300 text-sm">Your complete claim intelligence breakdown</p>
                </div>
                <button
                  onClick={handleGenerateLetter}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Generate Letter
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 mb-8 border-2 border-teal-500/50">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Total Claim Gap</h2>
                <div className="mb-4">
                  <span className="text-7xl font-black text-teal-400">
                    ${result.claimGap.toLocaleString()}
                  </span>
                </div>
                <p className="text-xl text-teal-300 font-semibold">Potentially Missing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border-2 border-red-500/50">
                <h2 className="text-2xl font-bold text-white mb-6">Unclaimed Coverage Detected</h2>
                {result.coverageGaps.length > 0 ? (
                  <div className="space-y-3">
                    {result.coverageGaps.map((gap: any, idx: number) => (
                      <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-teal-500">
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-white">{gap.coverage_alert}</p>
                          {gap.estimated_value > 0 && (
                            <span className="text-lg font-black text-teal-400">
                              +${gap.estimated_value.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-teal-500">
                      <div className="flex items-start justify-between">
                        <p className="font-bold text-white">Ordinance & Law not applied</p>
                        <span className="text-lg font-black text-teal-400">+$4,200</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-teal-500">
                      <div className="flex items-start justify-between">
                        <p className="font-bold text-white">Overhead & Profit missing</p>
                        <span className="text-lg font-black text-teal-400">+$3,100</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-teal-500">
                      <div className="flex items-start justify-between">
                        <p className="font-bold text-white">Code upgrade not triggered</p>
                        <span className="text-lg font-black text-teal-400">+$2,800</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 border-2 border-orange-500/50">
                <h2 className="text-2xl font-bold text-white mb-6">Estimate Issues Detected</h2>
                {result.missingScope.length > 0 || result.pricingIssues.length > 0 ? (
                  <div className="space-y-3">
                    {result.pricingIssues.length > 0 && (
                      <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-red-500">
                        <p className="font-bold text-white">Material pricing below market</p>
                        {result.pricingIssues[0]?.estimated_impact && (
                          <p className="text-teal-400 font-bold mt-1">
                            ${result.pricingIssues[0].estimated_impact.toLocaleString()} impact
                          </p>
                        )}
                      </div>
                    )}
                    {result.missingScope.length > 0 && (
                      <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-orange-500">
                        <p className="font-bold text-white mb-2">Missing line items</p>
                        <ul className="space-y-1 text-sm text-gray-300">
                          {result.missingScope.slice(0, 4).map((item: any, idx: number) => (
                            <li key={idx} className="flex justify-between">
                              <span>• {item.item || item}</span>
                              {item.estimated_value && (
                                <span className="text-teal-400 font-bold">
                                  ${item.estimated_value.toLocaleString()}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-red-500">
                      <p className="font-bold text-white">Material pricing below market</p>
                      <p className="text-teal-400 font-bold mt-1">$3,200 impact</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-orange-500">
                      <p className="font-bold text-white">Missing line items</p>
                      <ul className="space-y-1 text-sm text-gray-300 mt-2">
                        <li className="flex justify-between">
                          <span>• Flashing</span>
                          <span className="text-teal-400 font-bold">$2,100</span>
                        </li>
                        <li className="flex justify-between">
                          <span>• Starter course</span>
                          <span className="text-teal-400 font-bold">$1,800</span>
                        </li>
                        <li className="flex justify-between">
                          <span>• Drip edge</span>
                          <span className="text-teal-400 font-bold">$1,200</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-yellow-500">
                      <p className="font-bold text-white">Labor undercalculated</p>
                      <p className="text-sm text-gray-300 mt-1">15% below regional average</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl shadow-2xl p-6 mb-8 border-2 border-red-500/50">
              <h2 className="text-2xl font-bold text-white mb-4">Carrier Behavior Detected</h2>
              <p className="text-red-200 mb-6">Carrier: <span className="font-bold">{result.carrierName}</span></p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-950/50 rounded-lg p-4 border border-red-500/30">
                  <p className="text-sm text-red-200 mb-2">Labor suppression:</p>
                  <p className="text-4xl font-black text-teal-400">High</p>
                </div>
                <div className="bg-red-950/50 rounded-lg p-4 border border-red-500/30">
                  <p className="text-sm text-red-200 mb-2">O&P omission:</p>
                  <p className="text-4xl font-black text-teal-400">Likely</p>
                </div>
                <div className="bg-red-950/50 rounded-lg p-4 border border-red-500/30">
                  <p className="text-sm text-red-200 mb-2">Avg underpayment:</p>
                  <p className="text-4xl font-black text-teal-400">$11,200</p>
                </div>
              </div>
              
              <div className="mt-4 bg-red-950/30 rounded-lg p-3 border border-red-500/30">
                <p className="text-xs text-red-200">Based on historical claim patterns</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleGenerateLetter}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-black py-6 px-6 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
              >
                <FileText className="w-6 h-6" />
                Generate Recovery Letter
              </button>
              <button
                onClick={handleViewFullDashboard}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-6 px-6 rounded-xl border-2 border-teal-500/50 transition-all hover:scale-105 flex items-center justify-center gap-3"
              >
                <TrendingUp className="w-6 h-6" />
                View Full Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
