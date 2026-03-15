'use client'

import { AlertTriangle, ArrowRight } from 'lucide-react'

export default function EstimateReviewVisual() {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Line-by-Line Estimate Comparison
          </h2>

          <div className="bg-white rounded-lg border-4 border-gray-300 shadow-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8 items-center mb-10">
              {/* Insurance Estimate */}
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-6 border-3 border-gray-400 mb-3">
                  <p className="text-sm text-gray-600 font-bold uppercase tracking-wide mb-2">
                    Insurance Estimate
                  </p>
                  <p className="text-5xl font-bold text-gray-900">$18,200</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-red-600">
                  <ArrowRight className="w-12 h-12 hidden md:block" />
                  <div className="md:hidden text-center text-4xl font-bold">↓</div>
                </div>
              </div>

              {/* Contractor Estimate */}
              <div className="text-center">
                <div className="bg-green-50 rounded-lg p-6 border-3 border-green-500 mb-3">
                  <p className="text-sm text-gray-600 font-bold uppercase tracking-wide mb-2">
                    Contractor Estimate
                  </p>
                  <p className="text-5xl font-bold text-green-700">$36,750</p>
                </div>
              </div>
            </div>

            {/* Gap Alert */}
            <div className="bg-red-50 border-4 border-red-500 rounded-lg p-8 mb-8">
              <div className="flex items-center justify-center gap-4 mb-3">
                <AlertTriangle className="w-10 h-10 text-red-600" />
                <h3 className="text-3xl font-bold text-red-900 uppercase tracking-wide">
                  Gap Detected
                </h3>
              </div>
              <p className="text-6xl font-bold text-red-600 text-center">$18,550</p>
            </div>

            {/* Detected Issues */}
            <div className="bg-yellow-50 rounded-lg p-6 border-3 border-yellow-400">
              <h4 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                Detected Issues
              </h4>
              <ul className="space-y-3 text-lg">
                <li className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-yellow-600 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700"><strong className="text-gray-900">10</strong> missing scope items</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-orange-600 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700"><strong className="text-gray-900">3</strong> pricing discrepancies</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-red-600 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700"><strong className="text-gray-900">2</strong> quantity gaps</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-center text-gray-700 mt-8 text-xl max-w-3xl mx-auto font-medium">
            Line-by-line estimate comparison showing exactly where the insurance estimate falls short.
          </p>
        </div>
      </div>
    </section>
  )
}
