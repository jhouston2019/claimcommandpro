'use client'

import { X, CheckCircle2 } from 'lucide-react'

export default function StructureVsChaos() {
  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Structure vs Chaos
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Without Structured Proof */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-4 border-red-300 p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <X className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-900">
                  Without Structured Proof
                </h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg">Scattered emails and photos</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg">Accept carrier estimate</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg">Missing scope undetected</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg">Unstructured submissions</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg font-bold">Low settlement outcome</span>
                </li>
              </ul>
            </div>

            {/* With Claim Command Pro */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-4 border-green-500 p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-900">
                  With Claim Command Pro
                </h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg">Organized proof packet</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg">Line-by-line estimate review</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg">Missing scope identified</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg">Structured supplement requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-800 text-lg font-bold">Full documented claim value</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
