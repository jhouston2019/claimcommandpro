'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Calculator } from 'lucide-react'

export default function ClaimUnderpaymentEstimator() {
  const [insuranceEstimate, setInsuranceEstimate] = useState('')
  const [contractorEstimate, setContractorEstimate] = useState('')
  const [deductible, setDeductible] = useState('')

  const parseAmount = (value: string): number => {
    return parseFloat(value.replace(/[^0-9.]/g, '')) || 0
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const insurance = parseAmount(insuranceEstimate)
  const contractor = parseAmount(contractorEstimate)
  const deduct = parseAmount(deductible)
  
  const gap = contractor > insurance ? contractor - insurance - deduct : 0
  const showResults = insurance > 0 && contractor > 0

  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <Calculator className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Check What Your Claim Is Missing
            </h2>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-8 shadow-xl">
            {/* Input Fields */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Insurance Company Estimate
                </label>
                <input
                  type="text"
                  value={insuranceEstimate}
                  onChange={(e) => setInsuranceEstimate(e.target.value)}
                  placeholder="$18,200"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Contractor Repair Estimate
                </label>
                <input
                  type="text"
                  value={contractorEstimate}
                  onChange={(e) => setContractorEstimate(e.target.value)}
                  placeholder="$36,750"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Deductible
                </label>
                <input
                  type="text"
                  value={deductible}
                  onChange={(e) => setDeductible(e.target.value)}
                  placeholder="$2,500"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none text-gray-900"
                />
              </div>
            </div>

            {/* Results Display */}
            {showResults && (
              <div className="bg-white rounded-lg border-4 border-gray-300 p-8 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center uppercase tracking-wide">
                  Estimated Claim Gap
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="text-lg">Insurance Estimate:</span>
                    <span className="text-2xl font-bold">{formatCurrency(insurance)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="text-lg">Repair Cost:</span>
                    <span className="text-2xl font-bold">{formatCurrency(contractor)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="text-lg">Deductible:</span>
                    <span className="text-2xl font-bold">-{formatCurrency(deduct)}</span>
                  </div>
                </div>

                <div className="border-t-4 border-red-500 pt-6">
                  <div className="bg-red-50 rounded-lg p-6 border-3 border-red-400">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                      <h4 className="text-xl font-bold text-red-900 uppercase tracking-wide">
                        Potential Underpayment
                      </h4>
                    </div>
                    <p className="text-5xl md:text-6xl font-bold text-red-600 text-center">
                      {formatCurrency(gap)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pre-CTA Reality Check */}
            <div className="bg-primary-50 border-2 border-primary-300 rounded-lg p-6 mb-8">
              <p className="text-xl text-gray-900 font-semibold text-center leading-relaxed">
                If you haven't had your estimate reviewed line-by-line,<br />
                you don't know if anything was missed.
              </p>
            </div>
            
            {/* Self-Identification Checkpoint */}
            <div className="bg-gray-900 rounded-lg p-8 mb-8">
              <p className="text-xl text-white font-bold mb-6 text-center">
                Before you continue, ask yourself:
              </p>
              <ul className="space-y-4 text-white text-lg mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 font-bold flex-shrink-0">•</span>
                  <span>Has my estimate been independently reviewed?</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 font-bold flex-shrink-0">•</span>
                  <span>Do I know if anything was left out?</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 font-bold flex-shrink-0">•</span>
                  <span>Has every coverage in my policy actually been applied?</span>
                </li>
              </ul>
              <p className="text-xl text-yellow-300 font-bold text-center">
                If the answer is no — there is a reason to run this analysis.
              </p>
            </div>

            {/* CTA and Explanation */}
            <div className="text-center">
              <p className="text-xl text-gray-900 font-bold mb-2">
                Takes about 10 minutes.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Shows you exactly what's missing — if anything.
              </p>
              
              <Link
                href="/estimate-scan"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xl py-4 px-10 rounded-lg shadow-xl transition-all hover:scale-105 mb-6"
              >
                Analyze My Claim
              </Link>
              
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-4">
                Claim Command Pro analyzes your claim documents and shows exactly where this gap comes from.
              </p>
              
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                Detects missing scope, pricing gaps, and coverage issues — and shows you exactly where your claim may be underpaid.
              </p>
            </div>
            
            {/* Objection Handler: I Don't Need This */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 mt-12 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                What if my claim is already correct?
              </h3>
              <p className="text-lg text-gray-800 mb-4">
                That's exactly what the free analysis is designed to determine.
              </p>
              <p className="text-lg text-gray-800 mb-4">
                If your claim is complete and fairly paid, the system will show no meaningful gap — and you don't need to upgrade.
              </p>
              <p className="text-lg text-gray-800 mb-4">
                If it's not, you'll see exactly where money is being left behind.
              </p>
              <p className="text-xl text-primary-700 font-bold text-center">
                There is no guesswork — only documented findings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
