'use client'

import Link from 'next/link'
import { FileSearch, Sparkles } from 'lucide-react'

export default function CTAAnalysisSection() {
  return (
    <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white py-20">
      <div className="section-container">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/40">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See What Your Insurance Claim Might Be Missing
          </h2>
          
          <p className="text-xl md:text-2xl mb-10 text-primary-100">
            Upload your claim documents and get a claim gap analysis preview instantly.
          </p>
          
          <Link 
            href="/estimate-scan" 
            className="inline-flex items-center gap-3 text-xl bg-white text-primary-700 hover:bg-gray-100 font-bold py-5 px-10 rounded-lg shadow-2xl transition-all hover:scale-105"
          >
            <FileSearch className="w-7 h-7" />
            Start My Claim Analysis
          </Link>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-primary-100">
            <span className="flex items-center gap-2">
              <span className="text-green-300 text-lg">✓</span>
              Free preview in 60 seconds
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-300 text-lg">✓</span>
              No account required
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-300 text-lg">✓</span>
              Full report for $149
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
