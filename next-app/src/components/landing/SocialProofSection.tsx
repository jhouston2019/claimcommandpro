'use client'

import { TrendingUp, CheckCircle2 } from 'lucide-react'

export default function SocialProofSection() {
  const examples = [
    {
      type: 'Water Damage Claim',
      insuranceOffer: 18200,
      actualCost: 36750,
      recovered: 18550,
      showRecovered: true,
    },
    {
      type: 'Roof Damage Claim',
      insuranceOffer: null,
      actualCost: null,
      finalPayment: 42300,
      showRecovered: false,
      denied: true,
    },
    {
      type: 'Fire Damage Claim',
      insuranceOffer: 15000,
      actualCost: 67000,
      recovered: 52000,
      showRecovered: true,
    },
    {
      type: 'Wind Damage Claim',
      insuranceOffer: 9800,
      actualCost: null,
      revisedPayment: 24750,
      showRecovered: false,
    },
  ]

  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            Real Claim Recoveries
          </h2>
          
          <p className="text-center text-gray-600 mb-4 max-w-3xl mx-auto">
            Used by policyholders across all 50 states to identify missing claim money
          </p>
          
          <p className="text-center text-gray-900 font-semibold mb-4 text-lg">
            Insurance estimates are not final valuations.
          </p>
          
          {/* Probability Frame */}
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-12 max-w-2xl mx-auto">
            <p className="text-xl text-gray-900 font-bold text-center leading-relaxed">
              Statistically, most policyholders are underpaid.<br />
              <span className="text-red-600">The only question is whether yours is one of them.</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {examples.map((example, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg border-3 border-gray-300 p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {example.type}
                </h3>

                {example.denied ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
                      <p className="text-sm text-red-800 font-bold uppercase tracking-wide mb-1">
                        Initial Status
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        Claim Denied
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-500">
                      <p className="text-sm text-green-800 font-bold uppercase tracking-wide mb-1">
                        Final Payment
                      </p>
                      <p className="text-4xl font-bold text-green-700">
                        ${example.finalPayment?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : example.showRecovered ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Insurance Offer:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${example.insuranceOffer?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Actual Repair Cost:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${example.actualCost?.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t-3 border-green-500 pt-4 bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800 font-bold uppercase tracking-wide">
                          Recovered:
                        </span>
                        <span className="text-4xl font-bold text-green-600 flex items-center gap-2">
                          <TrendingUp className="w-8 h-8" />
                          +${example.recovered?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Insurance Offer:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ${example.insuranceOffer?.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border-2 border-green-500">
                      <div className="flex justify-between items-center">
                        <span className="text-green-800 font-bold uppercase tracking-wide">
                          Revised Payment:
                        </span>
                        <span className="text-4xl font-bold text-green-700">
                          ${example.revisedPayment?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-center text-gray-600 mt-12 text-sm max-w-3xl mx-auto">
            Based on analysis of real claim estimates and industry-standard pricing data.
          </p>
        </div>
      </div>
    </section>
  )
}
