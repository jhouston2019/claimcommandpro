'use client'

import { DollarSign, Scale, Zap } from 'lucide-react'

export default function PricingComparison() {
  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            Understand Your Claim Position First
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Know what you're owed before hiring professionals.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Public Adjuster */}
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-gray-300 relative">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center">
                  <Scale className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                Public Adjuster
              </h3>
              <div className="text-center mb-4">
                <p className="text-lg text-gray-700 mb-2">
                  <strong>10–20%</strong> of settlement
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  $3,000–$10,000
                </p>
                <p className="text-sm text-gray-600 mt-1">typical</p>
              </div>
            </div>

            {/* Attorney */}
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-gray-300 relative">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                Attorney
              </h3>
              <div className="text-center mb-4">
                <p className="text-lg text-gray-700 mb-2">
                  <strong>25–40%</strong> contingency
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  $5,000–$15,000
                </p>
                <p className="text-sm text-gray-600 mt-1">typical</p>
              </div>
            </div>

            {/* Claim Command Pro */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-8 border-4 border-primary-400 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  BEST VALUE
                </span>
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-4">
                Claim Command Pro
              </h3>
              <div className="text-center mb-4">
                <p className="text-lg text-primary-100 mb-2">
                  One-time fee
                </p>
                <p className="text-5xl font-bold text-white">
                  $149
                </p>
                <p className="text-sm text-primary-200 mt-1">complete analysis</p>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-primary-50 rounded-lg p-8 border-2 border-primary-200">
            <p className="text-lg text-gray-800 text-center font-medium">
              Understand your claim position before hiring professionals.
            </p>
            <p className="text-base text-gray-600 text-center mt-3">
              Use Claim Command Pro to identify the gap, then decide if you need additional help.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
