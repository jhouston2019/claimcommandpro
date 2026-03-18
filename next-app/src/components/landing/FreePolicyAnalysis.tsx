'use client'

import Link from 'next/link'
import { FileCheck, Shield } from 'lucide-react'

export default function FreePolicyAnalysis() {
  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-16">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/40">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <p className="text-lg text-primary-100 font-semibold mb-4">
              Start free. Only upgrade if the analysis shows missing money.
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Free Policy Analysis
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Upload your insurance policy and instantly identify:
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-8 md:p-10 mb-8">
            <ul className="space-y-4 text-lg md:text-xl">
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-2xl font-bold">•</span>
                <span>coverage triggers</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-2xl font-bold">•</span>
                <span>endorsements</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-2xl font-bold">•</span>
                <span>coverage limits</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-2xl font-bold">•</span>
                <span>exclusions</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400 text-2xl font-bold">•</span>
                <span>documentation requirements</span>
              </li>
            </ul>
          </div>

          {/* Low-Risk Decision Frame */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-6 mb-8">
            <p className="text-xl text-white font-bold text-center mb-6">
              You're not committing to anything.
            </p>
            <p className="text-lg text-primary-100 text-center mb-4">
              You're checking if money was missed.
            </p>
            <p className="text-xl text-white font-bold text-center leading-relaxed">
              If nothing is missing, you'll know.<br />
              If something is — you'll see it clearly.
            </p>
          </div>
          
          <div className="text-center">
            <Link
              href="/policy-analysis"
              className="inline-flex items-center gap-3 bg-white text-primary-700 hover:bg-gray-100 font-bold text-xl py-5 px-10 rounded-lg shadow-2xl transition-all hover:scale-105"
            >
              <FileCheck className="w-7 h-7" />
              Analyze My Policy (Free)
            </Link>
            <p className="text-sm text-primary-200 mt-4">
              No credit card required • Results in 60 seconds
            </p>
          </div>
          
          {/* Deadline Pressure Block */}
          <div className="bg-red-900/30 backdrop-blur-sm rounded-lg border-2 border-red-400 p-8 mt-12">
            <p className="text-xl text-white font-bold mb-6 text-center">
              Every claim operates on deadlines:
            </p>
            <ul className="space-y-3 text-white text-lg mb-6">
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold flex-shrink-0">•</span>
                <span>Proof of loss deadlines can be as short as 60 days</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold flex-shrink-0">•</span>
                <span>Depreciation recovery windows can expire in months</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold flex-shrink-0">•</span>
                <span>Once a release is signed, the claim is closed permanently</span>
              </li>
            </ul>
            <p className="text-xl text-white text-center leading-relaxed">
              Your insurer knows this.<br />
              <strong className="text-yellow-300">Most policyholders don't.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
