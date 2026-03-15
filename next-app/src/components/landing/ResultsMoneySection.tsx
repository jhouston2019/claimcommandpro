'use client'

import { TrendingUp } from 'lucide-react'

export default function ResultsMoneySection() {
  const examples = [
    {
      type: 'Roof Damage',
      insuranceOffer: 18200,
      finalPayment: 36750,
      recovered: 18550,
    },
    {
      type: 'Water Damage',
      insuranceOffer: 14800,
      finalPayment: 32700,
      recovered: 17900,
    },
    {
      type: 'Fire Damage',
      insuranceOffer: 15000,
      finalPayment: 67000,
      recovered: 52000,
    },
  ]

  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Example Claim Recoveries
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Insurance claims are often underpaid because damage scope, pricing, and documentation are incomplete.
            </p>
          </div>

          <div className="space-y-6">
            {examples.map((example, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/20 p-6 hover:border-green-400 transition-colors"
              >
                <div className="grid md:grid-cols-4 gap-6 items-center">
                  {/* Claim Type */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {example.type}
                    </h3>
                  </div>

                  {/* Insurance Offer */}
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1 uppercase tracking-wide">
                      Insurance Offer
                    </p>
                    <p className="text-2xl font-bold text-red-400">
                      ${example.insuranceOffer.toLocaleString()}
                    </p>
                  </div>

                  {/* Final Payment */}
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1 uppercase tracking-wide">
                      Final Payment
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      ${example.finalPayment.toLocaleString()}
                    </p>
                  </div>

                  {/* Recovered */}
                  <div className="text-center bg-green-500/20 rounded-lg p-4 border-2 border-green-500">
                    <p className="text-sm text-green-300 mb-1 uppercase tracking-wide font-semibold">
                      Recovered
                    </p>
                    <p className="text-3xl font-bold text-green-400 flex items-center justify-center gap-2">
                      <TrendingUp className="w-6 h-6" />
                      +${example.recovered.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
