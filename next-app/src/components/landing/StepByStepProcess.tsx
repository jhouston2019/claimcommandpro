'use client'

import { Upload, Search, FileCheck, Send, ChevronRight } from 'lucide-react'

export default function StepByStepProcess() {
  const steps = [
    {
      number: 1,
      icon: Upload,
      title: 'Upload Documents',
      description: 'Policy, estimates, denial letters and claim correspondence.',
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
            Step-by-Step Claim Process
          </h2>

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
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
