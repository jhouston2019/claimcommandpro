import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface AlertCardProps {
  type: 'info' | 'warning' | 'critical' | 'success'
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
  onDismiss?: () => void
}

export function AlertCard({
  type,
  title,
  message,
  actionLabel,
  actionUrl,
  onDismiss
}: AlertCardProps) {
  const getStyles = () => {
    switch (type) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          message: 'text-red-800',
          action: 'text-red-600 hover:text-red-800',
          IconComponent: AlertCircle
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          message: 'text-yellow-800',
          action: 'text-yellow-600 hover:text-yellow-800',
          IconComponent: AlertTriangle
        }
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          message: 'text-green-800',
          action: 'text-green-600 hover:text-green-800',
          IconComponent: CheckCircle
        }
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          message: 'text-blue-800',
          action: 'text-blue-600 hover:text-blue-800',
          IconComponent: Info
        }
    }
  }

  const styles = getStyles()
  const Icon = styles.IconComponent

  return (
    <div className={`p-4 rounded-lg border-l-4 ${styles.container} relative`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${styles.title}`}>
            {title}
          </h3>
          <p className={`text-sm ${styles.message}`}>
            {message}
          </p>
          {actionLabel && actionUrl && (
            <Link 
              href={actionUrl}
              className={`inline-block mt-2 text-sm font-semibold ${styles.action}`}
            >
              {actionLabel} →
            </Link>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

interface AlertBadgeProps {
  severity: 'info' | 'warning' | 'critical'
  children: React.ReactNode
}

export function AlertBadge({ severity, children }: AlertBadgeProps) {
  const getStyles = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStyles()}`}>
      {children}
    </span>
  )
}
