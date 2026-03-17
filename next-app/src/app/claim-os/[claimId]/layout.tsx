'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  BarChart3,
  Shield,
  Lightbulb,
  Mail,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  ChevronLeft,
  Upload,
  FileEdit,
  RefreshCw,
  Menu,
  X
} from 'lucide-react'

interface ClaimWorkspace {
  id: string
  claim_name: string
  carrier_name: string
  claim_status: string
  claim_intelligence_score: number
  alert_count: number
  action_count: number
}

export default function ClaimOSLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { claimId: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [workspace, setWorkspace] = useState<ClaimWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)

  useEffect(() => {
    loadWorkspace()
  }, [params.claimId])

  const loadWorkspace = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: claim } = await supabase
        .from('claims')
        .select('id, claim_name, carrier_name, claim_status')
        .eq('id', params.claimId)
        .eq('user_id', user.id)
        .single()

      if (!claim) {
        router.push('/dashboard')
        return
      }

      const [analysisRes, alertsRes, actionsRes] = await Promise.all([
        supabase.from('claim_analysis').select('claim_intelligence_score').eq('claim_id', params.claimId).single(),
        supabase.from('claim_alerts').select('id', { count: 'exact' }).eq('claim_id', params.claimId).eq('is_dismissed', false),
        supabase.from('recommended_actions').select('id', { count: 'exact' }).eq('claim_id', params.claimId).eq('is_completed', false)
      ])

      setWorkspace({
        id: claim.id,
        claim_name: claim.claim_name,
        carrier_name: claim.carrier_name,
        claim_status: claim.claim_status || 'active',
        claim_intelligence_score: analysisRes.data?.claim_intelligence_score || 0,
        alert_count: alertsRes.count || 0,
        action_count: actionsRes.count || 0
      })

    } catch (error) {
      console.error('Failed to load workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { href: '', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/my-claim', label: 'My Claim', icon: FileText },
    { href: '/documents', label: 'Documents', icon: FolderOpen },
    { href: '/estimate-review', label: 'Estimate Review', icon: BarChart3 },
    { href: '/coverage', label: 'Coverage Analysis', icon: Shield },
    { href: '/strategy', label: 'Claim Strategy', icon: Lightbulb },
    { href: '/letters', label: 'Letters & Documents', icon: Mail },
    { href: '/timeline', label: 'Timeline', icon: Clock },
    { href: '/payments', label: 'Payments', icon: DollarSign },
    { href: '/carrier-intel', label: 'Carrier Intelligence', icon: TrendingUp },
    { href: '/settings', label: 'Settings', icon: Settings }
  ]

  const quickActions = [
    { label: 'Upload Document', icon: Upload, action: () => router.push(`/claim-os/${params.claimId}/documents?upload=true`) },
    { label: 'Run Estimate Review', icon: BarChart3, action: () => router.push(`/claim-os/${params.claimId}/estimate-review`) },
    { label: 'Generate Letter', icon: FileEdit, action: () => router.push(`/claim-os/${params.claimId}/letters`) },
    { label: 'Update Status', icon: RefreshCw, action: () => router.push(`/claim-os/${params.claimId}/my-claim`) }
  ]

  const isActive = (href: string) => {
    const fullPath = `/claim-os/${params.claimId}${href}`
    return pathname === fullPath
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'settled': return 'bg-blue-100 text-blue-800'
      case 'disputed': return 'bg-red-100 text-red-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Claim not found</p>
          <Link href="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 overflow-hidden`}>
        <div className="h-full flex flex-col">
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <h2 className="font-bold text-gray-900 text-lg mb-1 truncate">{workspace.claim_name}</h2>
            <p className="text-xs text-gray-600 truncate">{workspace.carrier_name}</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(workspace.claim_status)}`}>
              {workspace.claim_status}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <li key={item.href}>
                    <Link
                      href={`/claim-os/${params.claimId}${item.href}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                      {item.label === 'Dashboard' && workspace.alert_count > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {workspace.alert_count}
                        </span>
                      )}
                      {item.label === 'Claim Strategy' && workspace.action_count > 0 && (
                        <span className="ml-auto bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {workspace.action_count}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          {workspace.claim_intelligence_score > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Intelligence Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-600">{workspace.claim_intelligence_score}</span>
                  <span className="text-sm text-gray-500">/100</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${workspace.claim_intelligence_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-600 hover:text-gray-900 lg:hidden"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{workspace.claim_name}</h1>
                <p className="text-sm text-gray-600">
                  {workspace.carrier_name} • Claim OS
                </p>
              </div>
            </div>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="btn-primary flex items-center gap-2"
              >
                Quick Actions
                <ChevronLeft className={`w-4 h-4 transition-transform ${quickActionsOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>

              {quickActionsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setQuickActionsOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                    {quickActions.map((action, idx) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            action.action()
                            setQuickActionsOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">{action.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
