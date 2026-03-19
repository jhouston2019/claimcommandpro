'use client'

import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
      <div className="section-container py-20">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-center">
            Handle your insurance claim the right way and get paid what you're owed.
          </h1>
          
          <p className="text-2xl md:text-3xl text-primary-100 text-center mb-8 max-w-4xl mx-auto leading-relaxed">
            Most policyholders don't know how to prove their loss correctly and it costs them. We show you exactly what to do, what to document, and how to recover the full value of your claim.
          </p>
          
          <p className="text-xl text-primary-100 text-center mb-12 max-w-4xl mx-auto leading-relaxed">
            Insurance companies pay based on what's properly proven. Claim Command Pro gives you an expert step-by-step system to prove your claim and get paid what you're owed.
          </p>
          
          {/* Proof Block */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-8 mb-8 max-w-2xl mx-auto">
            <div className="space-y-4 text-center">
              <div>
                <p className="text-lg text-primary-200 mb-1">What the insurance company offered:</p>
                <p className="text-5xl font-bold text-white">$18,200</p>
              </div>
              <div>
                <p className="text-lg text-primary-200 mb-1">What a properly proven claim supports:</p>
                <p className="text-5xl font-bold text-green-400">$36,750</p>
              </div>
              <div className="border-t-2 border-white/30 pt-4">
                <p className="text-lg text-red-300 mb-1">Difference caused by incomplete claim handling:</p>
                <p className="text-6xl font-bold text-red-400">$18,550</p>
              </div>
            </div>
          </div>
          
          {/* Reinforcement */}
          <p className="text-2xl text-yellow-300 font-bold text-center mb-12">
            8 out of 10 claim estimates are incomplete or underpaid.
          </p>
          
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/estimate-scan"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-gray-100 font-bold text-xl py-4 px-10 rounded-lg shadow-2xl transition-all hover:scale-105"
            >
              Check My Claim →
            </Link>
          </div>
          
          {/* Lower Hero Line */}
          <p className="text-xl text-primary-200 text-center font-medium">
            Don't leave the money you're owed sitting in their pocket.
          </p>
          
          {/* Original Content (Collapsed) */}
          <details className="mt-12">
            <summary className="text-center text-primary-200 cursor-pointer hover:text-white transition-colors text-lg font-semibold mb-4">
              Why This Matters (Click to Expand)
            </summary>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-8 md:p-12">
              <ul className="space-y-4 text-lg md:text-xl text-white">
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Insurance estimates are often <strong className="text-yellow-300">$12,000–$47,000</strong> below the real cost of repair</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Insurance companies frequently leave real damage out of the estimate</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Labor and material pricing is often suppressed below contractor market rates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Policies contain coverage triggers and endorsements most policyholders never see</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Claims are evaluated using documentation standards homeowners are never taught</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Damage must be documented line-by-line before insurers will pay</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Adjusters are trained to defend the estimate they wrote</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Most policyholders do not know how to challenge an estimate correctly</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Most policyholders rely on their insurer or guess their way through the process — and miss critical steps that directly impact what they get paid</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Denials frequently rely on phrases like "wear and tear" or "maintenance related"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Missing documentation gives insurers a reason to delay or reduce payment</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Contractors can identify damage but cannot translate it into insurer-accepted proof</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Without structured proof the first insurance offer becomes the settlement</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span>Most claims are underpaid not because coverage is missing but because proof is</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 font-bold mt-1 flex-shrink-0">•</span>
                <span><strong className="text-yellow-300">Claim Command Pro</strong> shows where the estimate is wrong and what proof is required to correct it</span>
              </li>
            </ul>
          </div>
          </details>
        </div>
      </div>
    </section>
  )
}
