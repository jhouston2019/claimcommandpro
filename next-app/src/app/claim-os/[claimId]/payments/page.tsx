'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, Plus, TrendingUp, CheckCircle } from 'lucide-react'

interface Payment {
  id: string
  payment_type: string
  amount: number
  payment_date: string
  description: string
  check_number: string
  is_verified: boolean
}

export default function PaymentsPage({ params }: { params: { claimId: string } }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [financial, setFinancial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [params.claimId])

  const loadPayments = async () => {
    try {
      const [paymentsRes, financialRes] = await Promise.all([
        supabase.from('payments').select('*').eq('claim_id', params.claimId).order('payment_date', { ascending: false }),
        supabase.from('claim_financial_summary').select('*').eq('claim_id', params.claimId).single()
      ])

      setPayments(paymentsRes.data || [])
      setFinancial(financialRes.data)
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const formData = new FormData(e.currentTarget)
      
      await supabase.from('payments').insert({
        claim_id: params.claimId,
        user_id: user.id,
        payment_type: formData.get('paymentType'),
        amount: parseFloat(formData.get('amount') as string),
        payment_date: formData.get('paymentDate'),
        description: formData.get('description'),
        check_number: formData.get('checkNumber') || null,
        is_verified: true
      })

      await supabase.rpc('log_claim_event', {
        p_claim_id: params.claimId,
        p_user_id: user.id,
        p_event_type: 'payment_received',
        p_event_title: 'Payment Received',
        p_event_description: `Payment of $${formData.get('amount')} recorded`
      })

      setShowAddModal(false)
      loadPayments()
    } catch (error) {
      console.error('Failed to add payment:', error)
      alert('Failed to add payment')
    }
  }

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0)
  const expectedValue = financial?.contractor_total || 0
  const remainingBalance = Math.max(0, expectedValue - totalReceived)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments Tracker</h1>
            <p className="text-gray-600">Monitor payments and settlement progress</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Payments Received</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-4xl font-bold text-green-600">
              ${totalReceived.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Expected Value</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-blue-600">
              ${expectedValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase">Remaining Balance</h3>
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-4xl font-bold text-orange-600">
              ${remainingBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">
                        {payment.payment_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString()}
                        {payment.check_number && ` • Check #${payment.check_number}`}
                      </p>
                      {payment.description && (
                        <p className="text-xs text-gray-500 mt-1">{payment.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ${payment.amount.toLocaleString()}
                    </p>
                    {payment.is_verified && (
                      <span className="text-xs text-green-600">✓ Verified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Recorded</h3>
            <p className="text-gray-600 mb-6">Add payments as you receive them from your carrier</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Payment
            </button>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Payment</h2>
              
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Type *</label>
                  <select name="paymentType" required className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                    <option value="">Select type</option>
                    <option value="acv_payment">ACV Payment</option>
                    <option value="rcv_payment">RCV Payment</option>
                    <option value="depreciation_recovery">Depreciation Recovery</option>
                    <option value="supplement_payment">Supplement Payment</option>
                    <option value="final_settlement">Final Settlement</option>
                    <option value="partial_payment">Partial Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      required
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date *</label>
                  <input
                    type="date"
                    name="paymentDate"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check Number</label>
                  <input
                    type="text"
                    name="checkNumber"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
