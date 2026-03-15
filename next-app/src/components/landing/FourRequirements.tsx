'use client'

import { Shield, CheckSquare, DollarSign, FileCheck } from 'lucide-react'

export default function FourRequirements() {
  const requirements = [
    {
      number: 1,
      icon: Shield,
      title: 'Coverage Trigger Identification',
      color: 'blue',
    },
    {
      number: 2,
      icon: CheckSquare,
      title: 'Scope Validation',
      color: 'green',
    },
    {
      number: 3,
      icon: DollarSign,
      title: 'Cost Substantiation',
      color: 'orange',
    },
    {
      number: 4,
      icon: FileCheck,
      title: 'Structured Submission',
      color: 'purple',
    },
  ]

  const colorClasses = {
    blue: {
      bg: 'bg-blue-600',
      border: 'border-blue-500',
      text: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-600',
      border: 'border-green-500',
      text: 'text-green-600',
    },
    orange: {
      bg: 'bg-orange-600',
      border: 'border-orange-500',
      text: 'text-orange-600',
    },
    purple: {
      bg: 'bg-purple-600',
      border: 'border-purple-500',
      text: 'text-purple-600',
    },
  }

  return (
    <section className="bg-gradient-to-br from-primary-900 to-primary-800 text-white py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            The 4 Things Insurers Require to Pay
          </h2>
          <p className="text-xl text-primary-200 text-center mb-12 max-w-3xl mx-auto">
            Without these four elements, your claim will be delayed, reduced, or denied.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {requirements.map((req) => {
              const Icon = req.icon
              const colors = colorClasses[req.color as keyof typeof colorClasses]
              
              return (
                <div 
                  key={req.number}
                  className="bg-white/10 backdrop-blur-sm rounded-lg border-3 border-white/30 p-8 hover:bg-white/20 transition-all"
                >
                  <div className={`flex items-center justify-center w-20 h-20 ${colors.bg} rounded-full mb-6 mx-auto shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="inline-block bg-white/20 text-white font-bold px-4 py-1 rounded-full text-lg mb-4">
                      {req.number}
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {req.title}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30 p-8">
            <p className="text-xl text-center text-white font-medium">
              Claim Command Pro ensures your claim meets all four requirements before submission.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
