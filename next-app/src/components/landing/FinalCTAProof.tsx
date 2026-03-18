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

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 leading-tight">
            Don't Sign Anything Until You Know What Your Claim Is Actually Worth
          </h2>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-8 mb-8 max-w-2xl mx-auto">
            <p className="text-3xl md:text-4xl text-white font-bold text-center leading-relaxed">
              Start your analysis.<br />
              See what your claim is really worth.<br />
              We'll guide you through the rest.
            </p>
          </div>
          
          {/* Future Regret Trigger */}
          <div className="bg-red-900/40 backdrop-blur-sm rounded-lg border-2 border-red-400 p-8 mb-8 max-w-2xl mx-auto">
            <p className="text-2xl text-white font-bold text-center leading-relaxed">
              Most policyholders only realize what was missed after the claim is closed.
            </p>
            <p className="text-xl text-red-300 font-bold text-center mt-4">
              At that point, it's too late to recover it.
            </p>
          </div>
          
          {/* Final Decision Frame */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-8 mb-8 max-w-2xl mx-auto">
            <p className="text-2xl text-white font-bold mb-6 text-center">
              You have two options:
            </p>
            <div className="space-y-4 text-lg text-white">
              <div className="flex items-start gap-4">
                <span className="text-3xl font-bold text-primary-200">1.</span>
                <p>Accept your insurer's number and move forward</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-3xl font-bold text-yellow-300">2.</span>
                <p>Verify it — and make sure nothing was missed</p>
              </div>
            </div>
            <p className="text-xl text-yellow-300 font-bold text-center mt-6">
              This is how you verify it.
            </p>
          </div>
          
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
          
          {/* Risk Reversal */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-6 mt-10 max-w-2xl mx-auto">
            <p className="text-lg text-white text-center leading-relaxed">
              If no meaningful gap is identified, you don't need the paid tools.<br />
              <strong className="text-yellow-300">If it is — the value is already documented before you spend anything.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
