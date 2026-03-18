'use client'

import { TrendingUp } from 'lucide-react'

export default function TypicalClaimGap() {
  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Typical Claim Gap
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Initial Offer */}
            <div className="text-center">
              <div className="bg-red-500/20 rounded-lg p-8 border-3 border-red-500 mb-4">
                <p className="text-sm text-red-300 font-bold uppercase tracking-wide mb-3">
                  Initial Offer
                </p>
                <p className="text-5xl md:text-6xl font-bold text-red-400">
                  $18,200
                </p>
              </div>
            </div>

            {/* Documented Value */}
            <div className="text-center">
              <div className="bg-green-500/20 rounded-lg p-8 border-3 border-green-500 mb-4">
                <p className="text-sm text-green-300 font-bold uppercase tracking-wide mb-3">
                  Documented Value
                </p>
                <p className="text-5xl md:text-6xl font-bold text-green-400">
                  $36,750
                </p>
              </div>
            </div>

            {/* Gap Identified */}
            <div className="text-center">
              <div className="bg-yellow-500/20 rounded-lg p-8 border-3 border-yellow-500 mb-4">
                <p className="text-sm text-yellow-300 font-bold uppercase tracking-wide mb-3">
                  Gap Identified
                </p>
                <p className="text-5xl md:text-6xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                  <TrendingUp className="w-10 h-10" />
                  $18,550
                </p>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-10 text-center">
            <p className="text-2xl md:text-3xl font-bold mb-6 leading-relaxed">
              Insurance companies underpay <span className="text-yellow-400">$12,000–$47,000</span> per claim on average.
            </p>
            
            <p className="text-xl md:text-2xl mb-4 text-gray-200">
              Not because coverage doesn't exist.
            </p>
            
            <p className="text-xl md:text-2xl font-semibold text-white mb-6">
              Because most policyholders do not know how to prove what they are owed.
            </p>
            
            <p className="text-lg text-yellow-300 font-bold border-t-2 border-white/30 pt-6">
              You only get one opportunity to settle your claim correctly.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
