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
        </div>
      </div>
    </section>
  )
}
