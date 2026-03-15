'use client'

import { Brain, Scale, FileText } from 'lucide-react'

export default function ToolStrip() {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* AI Claim Analyzer */}
            <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-primary-200 hover:border-primary-400 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                AI Claim Analyzer
              </h3>
              <p className="text-gray-700 text-center">
                Reads denial letters, engineer reports, and claim correspondence.
              </p>
            </div>

            {/* Estimate Gap Detector */}
            <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-primary-200 hover:border-primary-400 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                  <Scale className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                Estimate Gap Detector
              </h3>
              <p className="text-gray-700 text-center">
                Compares contractor estimates to insurance estimates line-by-line.
              </p>
            </div>

            {/* Supplement Generator */}
            <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-primary-200 hover:border-primary-400 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                Supplement Generator
              </h3>
              <p className="text-gray-700 text-center">
                Creates professional demand letters and proof-of-loss documentation.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
