'use client'

import { Upload, Search, FileCheck, ChevronRight } from 'lucide-react'

export default function ThreeStepProcess() {
  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
            How It Works
          </h2>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:flex items-start justify-between gap-8">
            {/* Step 1 */}
            <div className="flex-1">
              <div className="flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-full mb-6 mx-auto">
                <Upload className="w-10 h-10" />
              </div>
              <div className="text-center mb-4">
                <span className="inline-block bg-primary-100 text-primary-700 font-bold px-3 py-1 rounded-full text-sm mb-3">
                  Step 1
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Upload Your Claim Documents
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Policy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Denial letter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Insurance estimate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Contractor estimate</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center pt-20">
              <ChevronRight className="w-10 h-10 text-gray-400" />
            </div>

            {/* Step 2 */}
            <div className="flex-1">
              <div className="flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-full mb-6 mx-auto">
                <Search className="w-10 h-10" />
              </div>
              <div className="text-center mb-4">
                <span className="inline-block bg-primary-100 text-primary-700 font-bold px-3 py-1 rounded-full text-sm mb-3">
                  Step 2
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Claim Command Identifies the Gap
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>Detects missing scope</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>pricing suppression</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>coverage triggers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>documentation gaps</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center pt-20">
              <ChevronRight className="w-10 h-10 text-gray-400" />
            </div>

            {/* Step 3 */}
            <div className="flex-1">
              <div className="flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-full mb-6 mx-auto">
                <FileCheck className="w-10 h-10" />
              </div>
              <div className="text-center mb-4">
                <span className="inline-block bg-primary-100 text-primary-700 font-bold px-3 py-1 rounded-full text-sm mb-3">
                  Step 3
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Generate Your Proof Packet
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Supplement request</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Proof of loss</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>documentation checklist</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-4 font-semibold text-center">
                  Submit this to your insurer.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: Vertical Layout */}
          <div className="md:hidden space-y-12">
            {/* Step 1 */}
            <div>
              <div className="flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-full mb-6 mx-auto">
                <Upload className="w-10 h-10" />
              </div>
              <div className="text-center mb-4">
                <span className="inline-block bg-primary-100 text-primary-700 font-bold px-3 py-1 rounded-full text-sm mb-3">
                  Step 1
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Upload Your Claim Documents
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Policy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Denial letter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Insurance estimate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary-600">•</span>
                    <span>Contractor estimate</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center my-6">
                <ChevronRight className="w-8 h-8 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-full mb-6 mx-auto">
                <Search className="w-10 h-10" />
              </div>
              <div className="text-center mb-4">
                <span className="inline-block bg-primary-100 text-primary-700 font-bold px-3 py-1 rounded-full text-sm mb-3">
                  Step 2
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Claim Command Identifies the Gap
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>Detects missing scope</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>pricing suppression</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>coverage triggers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>documentation gaps</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center my-6">
                <ChevronRight className="w-8 h-8 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-center justify-center w-20 h-20 bg-primary-600 text-white rounded-full mb-6 mx-auto">
                <FileCheck className="w-10 h-10" />
              </div>
              <div className="text-center mb-4">
                <span className="inline-block bg-primary-100 text-primary-700 font-bold px-3 py-1 rounded-full text-sm mb-3">
                  Step 3
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Generate Your Proof Packet
                </h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Supplement request</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Proof of loss</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>documentation checklist</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-4 font-semibold text-center">
                  Submit this to your insurer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
