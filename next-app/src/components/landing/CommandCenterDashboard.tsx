'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function CommandCenterDashboard() {
  return (
    <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-white/20">
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
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mb-6">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Claim Command Center
          </h3>
          <p className="text-gray-600">Claim #2024-RF-8847 • State Farm</p>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Carrier Estimate</p>
            <p className="text-3xl font-bold text-gray-900">$18,400</p>
          </div>
          <div className="bg-white rounded-lg p-5 border-2 border-green-500 shadow-sm">
            <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Verified Scope</p>
            <p className="text-3xl font-bold text-green-700">$36,750</p>
          </div>
        </div>

        {/* Gap Alert */}
        <div className="bg-red-50 border-3 border-red-500 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h4 className="text-xl font-bold text-red-900">CLAIM GAP DETECTED</h4>
              <p className="text-4xl font-bold text-red-600 mt-1">$18,350</p>
            </div>
          </div>
        </div>

        {/* Issues Identified */}
        <div className="bg-white rounded-lg p-5 border-2 border-gray-200 shadow-sm mb-4">
          <h5 className="text-lg font-bold text-gray-900 mb-3">Issues Identified:</h5>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-gray-700"><strong>10</strong> Missing Scope Items</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="text-gray-700"><strong>3</strong> Pricing Discrepancies</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-gray-700"><strong>2</strong> Coverage Issues</span>
            </li>
          </ul>
        </div>

        {/* Recommended Actions */}
        <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-300">
          <h5 className="text-lg font-bold text-blue-900 mb-3">Recommended Actions:</h5>
          <ol className="space-y-2 text-sm text-blue-900">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <span>Request supplemental inspection</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <span>Challenge wear and tear exclusion</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <span>Submit labor rate documentation</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
