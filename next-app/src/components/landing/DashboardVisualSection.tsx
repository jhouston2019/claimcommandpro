'use client'

import { AlertTriangle } from 'lucide-react'

export default function DashboardVisualSection() {
  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Claim Command Center
          </h2>

          <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-gray-300">
            {/* Browser Chrome */}
            <div className="bg-gray-200 px-4 py-3 border-b border-gray-300 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 bg-white rounded px-4 py-1.5 text-sm text-gray-600">
                claimcommandpro.com/dashboard
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-8 md:p-12 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="mb-8">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Claim Command Center
                </h3>
                <p className="text-gray-600 text-lg">Claim #2024-RF-8847 • State Farm</p>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg p-6 border-3 border-gray-300 shadow-md">
                  <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide font-bold">
                    Carrier Estimate
                  </p>
                  <p className="text-4xl md:text-5xl font-bold text-gray-900">$18,400</p>
                </div>
                <div className="bg-white rounded-lg p-6 border-3 border-green-500 shadow-md">
                  <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide font-bold">
                    Verified Scope
                  </p>
                  <p className="text-4xl md:text-5xl font-bold text-green-700">$36,750</p>
                </div>
              </div>

              {/* Gap Alert */}
              <div className="bg-red-50 border-4 border-red-500 rounded-lg p-8 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-2xl font-bold text-red-900 uppercase tracking-wide">
                      CLAIM GAP DETECTED
                    </h4>
                    <p className="text-5xl md:text-6xl font-bold text-red-600 mt-2">$18,350</p>
                  </div>
                </div>
              </div>

              {/* Issues Identified */}
              <div className="bg-white rounded-lg p-6 border-3 border-gray-300 shadow-md mb-6">
                <h5 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Issues Identified
                </h5>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-lg">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></span>
                    <span className="text-gray-700"><strong className="text-gray-900">10</strong> Missing Scope Items</span>
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></span>
                    <span className="text-gray-700"><strong className="text-gray-900">3</strong> Pricing Discrepancies</span>
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></span>
                    <span className="text-gray-700"><strong className="text-gray-900">2</strong> Coverage Issues</span>
                  </li>
                </ul>
              </div>

              {/* Recommended Actions */}
              <div className="bg-blue-50 rounded-lg p-6 border-3 border-blue-400">
                <h5 className="text-xl font-bold text-blue-900 mb-4 uppercase tracking-wide">
                  Recommended Actions
                </h5>
                <ol className="space-y-3 text-lg text-blue-900">
                  <li className="flex gap-4">
                    <span className="font-bold flex-shrink-0">1</span>
                    <span>Request supplemental inspection</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="font-bold flex-shrink-0">2</span>
                    <span>Challenge wear-and-tear exclusion</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="font-bold flex-shrink-0">3</span>
                    <span>Submit labor rate documentation</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8 text-lg">
            This is the actual interface you'll use to analyze and recover your claim.
          </p>
        </div>
      </div>
    </section>
  )
}
