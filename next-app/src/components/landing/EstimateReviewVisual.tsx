'use client'

import { AlertTriangle, Search } from 'lucide-react'

export default function EstimateReviewVisual() {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
            How Claim Command Pro Finds Missing Claim Money
          </h2>
          
          {/* Micro Yes Ladder */}
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <ul className="space-y-3 text-lg text-gray-900">
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold text-2xl">✓</span>
                <span>You already have the estimate.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold text-2xl">✓</span>
                <span>You already have the policy.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-600 font-bold text-2xl">✓</span>
                <span><strong>This simply analyzes what's already there.</strong></span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border-4 border-gray-300 shadow-2xl p-8 md:p-12">
            {/* STEP 1 — Input */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-gray-900 text-white font-bold px-4 py-2 rounded-lg text-sm">STEP 1</span>
                <h3 className="text-xl font-bold text-gray-900">What Your Insurer Said</h3>
              </div>
              <div className="bg-gray-100 rounded-lg p-8 border-3 border-gray-400 text-center">
                <p className="text-5xl md:text-6xl font-bold text-gray-900">$18,200</p>
              </div>
            </div>

            {/* STEP 2 — System Analysis */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary-600 text-white font-bold px-4 py-2 rounded-lg text-sm">STEP 2</span>
                <h3 className="text-xl font-bold text-gray-900">What Claim Command Pro Detected</h3>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6 border-3 border-yellow-400">
                <ul className="space-y-3 text-lg">
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-yellow-600 rounded-full flex-shrink-0"></span>
                    <span className="text-gray-700"><strong className="text-gray-900">10</strong> missing scope items</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-orange-600 rounded-full flex-shrink-0"></span>
                    <span className="text-gray-700"><strong className="text-gray-900">3</strong> pricing discrepancies (suppressed below market)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-red-600 rounded-full flex-shrink-0"></span>
                    <span className="text-gray-700"><strong className="text-gray-900">2</strong> unclaimed coverage triggers</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* STEP 3 — Corrected Value */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-sm">STEP 3</span>
                <h3 className="text-xl font-bold text-gray-900">What Your Claim Is Actually Worth</h3>
              </div>
              <div className="bg-green-50 rounded-lg p-8 border-3 border-green-500 text-center">
                <p className="text-5xl md:text-6xl font-bold text-green-700">$36,750</p>
              </div>
            </div>

            {/* STEP 4 — Gap */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm">STEP 4</span>
                <h3 className="text-xl font-bold text-gray-900">Money Left on the Table</h3>
              </div>
              <div className="bg-red-50 border-4 border-red-500 rounded-lg p-8">
                <div className="flex items-center justify-center gap-4">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                  <p className="text-5xl md:text-6xl font-bold text-red-600">$18,550</p>
                </div>
              </div>
              
              {/* Gap Psychology Insert */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mt-4">
                <p className="text-center text-gray-900 font-semibold text-lg">
                  If your estimate looks similar, there is a high probability your claim is underpaid.
                </p>
              </div>
            </div>

            {/* Line-by-Line Breakdown */}
            <div className="border-t-4 border-gray-300 pt-8">
              <h4 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Line-by-Line Breakdown of What Was Missed
              </h4>
              
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-300">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                    <span className="text-gray-700 font-medium">Item</span>
                    <span className="text-gray-700 font-medium">Issue Type</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">Roof underlayment replacement</span>
                    <span className="text-yellow-700 font-semibold">Missing Scope</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">Drywall repair - interior rooms</span>
                    <span className="text-yellow-700 font-semibold">Missing Scope</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">Labor rate: $45/hr vs market $72/hr</span>
                    <span className="text-orange-700 font-semibold">Pricing Gap</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">Code upgrade coverage (ordinance/law)</span>
                    <span className="text-red-700 font-semibold">Coverage Trigger</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">Debris removal allowance</span>
                    <span className="text-red-700 font-semibold">Coverage Trigger</span>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-600 mt-6 text-base italic">
                This is a partial analysis. Most claims reveal 12–30 issues.
              </p>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8 text-lg max-w-3xl mx-auto">
            Each flagged item represents documented, recoverable value that can be pursued through supplements or negotiation.
          </p>
          
          <p className="text-center text-primary-700 mt-6 text-xl font-semibold max-w-2xl mx-auto">
            Run this on your claim to see what you're missing.
          </p>
          
          <p className="text-center text-gray-900 font-semibold mt-6 text-base">
            Most claim gaps are only identified when challenged.
          </p>
        </div>
      </div>
    </section>
  )
}
