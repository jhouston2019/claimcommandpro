'use client'

export default function ClaimGapVisual() {
  return (
    <section className="bg-white py-16">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Typical Insurance Claim Gap
          </h2>

          <div className="grid md:grid-cols-3 gap-8 items-end mb-12">
            {/* Insurance Company Estimate */}
            <div className="text-center">
              <div className="bg-gray-300 rounded-t-lg p-8 h-48 flex flex-col justify-center items-center border-4 border-gray-400">
                <p className="text-sm text-gray-700 font-semibold mb-2 uppercase tracking-wide">
                  Insurance Company Estimate
                </p>
                <p className="text-4xl font-bold text-gray-900">$18,200</p>
              </div>
            </div>

            {/* Arrow/Gap Indicator */}
            <div className="text-center flex flex-col justify-center">
              <div className="text-6xl font-bold text-red-600 mb-2">→</div>
              <p className="text-sm text-gray-600 font-medium">vs</p>
            </div>

            {/* Actual Repair Cost */}
            <div className="text-center">
              <div className="bg-green-100 rounded-t-lg p-8 h-96 flex flex-col justify-center items-center border-4 border-green-500">
                <p className="text-sm text-gray-700 font-semibold mb-2 uppercase tracking-wide">
                  Actual Repair Cost
                </p>
                <p className="text-5xl font-bold text-green-700">$36,750</p>
              </div>
            </div>
          </div>

          {/* Gap Amount */}
          <div className="bg-red-50 border-4 border-red-500 rounded-lg p-8 text-center">
            <p className="text-sm text-red-800 font-semibold mb-2 uppercase tracking-wide">
              UNPAID AMOUNT
            </p>
            <p className="text-6xl font-bold text-red-600 mb-4">$18,550</p>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Most homeowners never see this gap because they don't analyze the estimate line-by-line.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
