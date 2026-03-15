'use client'

import Link from 'next/link'
import { Sparkles, FileSearch } from 'lucide-react'

export default function FinalCTAProof() {
  return (
    <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white py-20">
      <div className="section-container">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/40 shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Stop Guessing. Start Proving.
          </h2>
          
          <p className="text-2xl md:text-3xl mb-12 text-primary-100 font-medium max-w-3xl mx-auto">
            Upload your claim documents and see exactly where the insurance estimate may be wrong.
          </p>
          
          <Link 
            href="/estimate-scan" 
            className="inline-flex items-center gap-3 text-2xl bg-white text-primary-700 hover:bg-gray-100 font-bold py-6 px-12 rounded-lg shadow-2xl transition-all hover:scale-105"
          >
            <FileSearch className="w-8 h-8" />
            Start My Claim
          </Link>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-base text-primary-100">
            <span className="flex items-center gap-2">
              <span className="text-green-300 text-xl">✓</span>
              Free preview in 60 seconds
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-300 text-xl">✓</span>
              No account required
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-300 text-xl">✓</span>
              Full report for $149
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
