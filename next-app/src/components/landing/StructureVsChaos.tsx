'use client'

export default function StructureVsChaos() {
  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            Why Policyholders Use Claim Command Pro
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Because most claims are underpaid — and most people don't know how to properly manage and document them.
          </p>

          {/* Comparison Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-4 font-bold text-gray-900 border-b-2 border-gray-300">
                    What Happens During Your Claim
                  </th>
                  <th className="text-left p-4 font-bold text-gray-700 border-b-2 border-gray-300">
                    Handling It Yourself
                  </th>
                  <th className="text-left p-4 font-bold text-primary-900 bg-primary-50 border-b-2 border-primary-300">
                    Claim Command Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Claim Value</td>
                  <td className="p-4 text-gray-700">Accept insurer's estimate</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Identify full loss value</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Missing Damage</td>
                  <td className="p-4 text-gray-700">Often overlooked</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Systematically identified</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Estimate Accuracy</td>
                  <td className="p-4 text-gray-700">Carrier-controlled</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Independently evaluated</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Claim Strategy</td>
                  <td className="p-4 text-gray-700">Unclear or reactive</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Step-by-step claim roadmap</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Documentation</td>
                  <td className="p-4 text-gray-700">Incomplete or inconsistent</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Structured and organized</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">What to Do Next</td>
                  <td className="p-4 text-gray-700">Guessing or unsure</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Clear guided actions at each step</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Timeline Management</td>
                  <td className="p-4 text-gray-700">Missed or delayed actions</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Tracked and guided process</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Negotiation Position</td>
                  <td className="p-4 text-gray-700">Weak or undefined</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Clear, documented position</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Claim Visibility</td>
                  <td className="p-4 text-gray-700">Limited understanding</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-medium">Full view of claim status and gaps</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">Final Outcome</td>
                  <td className="p-4 text-gray-700">Often underpaid</td>
                  <td className="p-4 text-primary-900 bg-primary-50/30 font-bold">Maximized and properly documented</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Post-Table Statement */}
          <div className="bg-primary-50 rounded-lg p-8 border-2 border-primary-200 mb-8">
            <p className="text-lg text-gray-800 text-center font-medium leading-relaxed">
              Most policyholders do not get paid what they are actually owed —<br />
              not because their claim is invalid, but because it is not properly managed, documented, or presented.
            </p>
            <p className="text-base text-gray-700 text-center mt-4">
              Claim Command Pro provides a structured system to guide you through the process — ensuring nothing is missed and your claim is fully supported.
            </p>
          </div>

          {/* Gap Preview Block */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-8 text-white shadow-xl">
            <h3 className="text-2xl font-bold text-center mb-6">Example Claim Outcome</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <p className="text-sm text-gray-300 mb-2">Insurance Estimate:</p>
                <p className="text-4xl font-bold text-white">$18,200</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <p className="text-sm text-gray-300 mb-2">Actual Loss Potential:</p>
                <p className="text-4xl font-bold text-green-400">$36,750</p>
              </div>
            </div>

            <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-6 mb-6">
              <p className="text-sm font-semibold text-yellow-300 mb-2">Difference:</p>
              <p className="text-base text-white">
                Unidentified scope, pricing gaps, and incomplete documentation
              </p>
            </div>

            <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-6">
              <p className="text-sm font-semibold text-green-300 mb-2">Result:</p>
              <p className="text-base text-white">
                Clear understanding of what is missing and how to pursue it
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
