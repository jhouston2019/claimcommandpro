'use client'

import { Brain, Scale, FileText, MapPin } from 'lucide-react'

export default function ToolsSection() {
  const tools = [
    {
      icon: Brain,
      title: 'Policy Intelligence Engine',
      description: 'Extracts coverage triggers, endorsements, limits and exclusions.',
    },
    {
      icon: Scale,
      title: 'Estimate Comparison Engine',
      description: 'Line-by-line estimate comparison detecting missing scope and pricing gaps.',
    },
    {
      icon: FileText,
      title: 'Claim Documentation Engine',
      description: 'Generates Proof of Loss forms, supplement letters, appeal templates and evidence checklists.',
    },
    {
      icon: MapPin,
      title: 'Claim Process Guidance',
      description: 'Step-by-step guidance for inspections, supplements and escalation.',
    },
  ]

  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Tools in Claim Command Pro
          </h2>

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
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {tool.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
