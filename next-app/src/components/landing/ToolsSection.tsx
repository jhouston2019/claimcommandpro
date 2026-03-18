'use client'

import { Brain, Scale, FileText, MapPin, CheckCircle2, TrendingUp } from 'lucide-react'

export default function ToolsSection() {
  const tools = [
    {
      icon: MapPin,
      label: 'Tool 01',
      sublabel: 'Track & Control Your Claim',
      title: 'Complete Claim Guidance System',
      description: 'Shows you exactly what to do at each step — from first inspection to final settlement.',
    },
    {
      icon: Scale,
      label: 'Tool 02',
      sublabel: 'Find Missing Money in Your Estimate',
      title: 'Clear, Step-by-Step Analysis',
      description: 'Upload your estimate and we\'ll show you exactly what\'s missing, underpaid, or incorrect — in plain English.',
    },
    {
      icon: FileText,
      label: 'Tool 03',
      sublabel: 'Generate Professional Claim Letters',
      title: 'Ready-to-Send Claim Letters',
      description: 'Get ready-to-send claim letters written for you — clear, professional, and taken seriously by insurers.',
    },
    {
      icon: Brain,
      label: 'Tool 04',
      sublabel: 'Follow the Exact Claim Strategy',
      title: 'Policy Coverage Breakdown',
      description: 'Shows you exactly what your policy covers, what triggers apply, and what documentation you need.',
    },
  ]

  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          {/* Process Flow Header */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
              How It Works — From Claim to Settlement
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  1
                </div>
                <p className="font-semibold text-gray-900 mb-1">Enter Your Claim Details</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  2
                </div>
                <p className="font-semibold text-gray-900 mb-1">We Analyze Your Policy and Estimate</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  3
                </div>
                <p className="font-semibold text-gray-900 mb-1">We Identify Missing Money</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  4
                </div>
                <p className="font-semibold text-gray-900 mb-1">You Recover What You're Owed</p>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
            Everything You Need to Handle Your Claim — Step by Step
          </h3>
          
          <p className="text-lg text-gray-600 text-center mb-4 max-w-3xl mx-auto">
            Each tool handles a specific step — together they guide you through your entire claim.
          </p>
          
          <p className="text-base text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Together, they remove guesswork and guide you through your claim from start to finish.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {tools.map((tool, index) => {
              const Icon = tool.icon
              return (
                <div 
                  key={index}
                  className="bg-gradient-to-br from-primary-50 to-white rounded-lg border-3 border-primary-200 p-8 shadow-lg hover:shadow-xl hover:border-primary-400 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">
                          {tool.label}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-semibold text-gray-600">
                          {tool.sublabel}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-3">
                        {tool.title}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <p className="text-center text-primary-700 mt-12 text-xl font-semibold max-w-2xl mx-auto">
            This is how you move from estimate to full recovery.
          </p>
          
          <p className="text-center text-gray-900 font-semibold mt-6 text-base">
            Insurance companies do not audit their own estimates for completeness.
          </p>
        </div>
      </div>
    </section>
  )
}
