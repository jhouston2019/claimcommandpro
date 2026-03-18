'use client'

import { Upload, Search, FileCheck, Send, ChevronRight } from 'lucide-react'

export default function StepByStepProcess() {
  const steps = [
    {
      number: 1,
      icon: Upload,
      title: 'Enter Your Claim Details & Start Your Analysis',
      description: 'This is where your claim begins. Enter your policy and claim details so Claim Command Pro can analyze your coverage, estimate, and identify missing money.',
      actionLine: 'Takes about 10 minutes. This step unlocks your full claim analysis.',
    },
    {
      number: 2,
      icon: Search,
      title: 'Identify Claim Gap',
      description: 'Detect missing scope, suppressed pricing and coverage triggers.',
    },
    {
      number: 3,
      icon: FileCheck,
      title: 'Generate Proof Packet',
      description: 'Create supplement requests, Proof of Loss and documentation checklist.',
    },
    {
      number: 4,
      icon: Send,
      title: 'Submit and Correct the Claim',
      description: 'Use structured documentation to challenge the insurer estimate.',
    },
  ]

  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            Step-by-Step Claim Process
          </h2>
          
          <p className="text-center text-gray-900 font-semibold mb-16 text-lg">
            Most gaps are never pointed out to policyholders.
          </p>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden lg:grid lg:grid-cols-7 gap-4 items-start">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <>
                  <div key={step.number} className="col-span-3">
                    <div className="bg-gradient-to-br from-primary-50 to-white rounded-lg border-3 border-primary-300 p-8 shadow-lg h-full">
                      <div className="flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-6 mx-auto">
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="text-center mb-4">
                        <span className="inline-block bg-primary-600 text-white font-bold px-4 py-1 rounded-full text-sm mb-4">
                          Step {step.number}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-700 text-center text-lg">
                        {step.description}
                      </p>
                      {step.actionLine && (
                        <p className="text-primary-700 text-center text-base font-semibold mt-4">
                          {step.actionLine}
                        </p>
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="col-span-1 flex items-center justify-center pt-12">
                      <ChevronRight className="w-10 h-10 text-primary-400" />
                    </div>
                  )}
                </>
              )
            })}
          </div>

          {/* Tablet/Mobile: Grid Layout */}
          <div className="lg:hidden grid md:grid-cols-2 gap-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="bg-gradient-to-br from-primary-50 to-white rounded-lg border-3 border-primary-300 p-8 shadow-lg">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-6 mx-auto">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-center mb-4">
                    <span className="inline-block bg-primary-600 text-white font-bold px-4 py-1 rounded-full text-sm mb-4">
                      Step {step.number}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-700 text-center text-lg">
                    {step.description}
                  </p>
                  {step.actionLine && (
                    <p className="text-primary-700 text-center text-base font-semibold mt-4">
                      {step.actionLine}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Objection Handler: Complexity */}
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-8 mt-12 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Is this complicated to use?
            </h3>
            <p className="text-3xl text-gray-900 font-bold mb-6">
              No.
            </p>
            <p className="text-lg text-gray-800 mb-6">
              You answer a few guided questions about your claim and upload your estimate (if available).
            </p>
            <div className="bg-white rounded-lg p-6 mb-6">
              <p className="text-lg text-gray-900 font-semibold mb-4">Claim Command Pro handles:</p>
              <ul className="space-y-2 text-gray-800">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  <span>Policy interpretation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  <span>Estimate analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  <span>Gap detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  <span>Claim letter generation</span>
                </li>
              </ul>
            </div>
            <p className="text-xl text-primary-700 font-bold text-center">
              Most users receive their first analysis in under 10 minutes.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
