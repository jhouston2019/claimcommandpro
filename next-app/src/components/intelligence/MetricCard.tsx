import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  borderColor?: string
  valueColor?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  children?: React.ReactNode
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  borderColor = 'border-blue-100',
  valueColor = 'text-gray-900',
  trend,
  children
}: MetricCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 uppercase">{title}</h3>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>
      
      <div className="mb-2">
        <span className={`text-5xl font-bold ${valueColor}`}>
          {value}
        </span>
      </div>

      {subtitle && (
        <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
      )}

      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-semibold ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
          <span className="text-gray-500 font-normal">{trend.label}</span>
        </div>
      )}

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  )
}

interface ProgressMetricCardProps {
  title: string
  value: number
  maxValue: number
  icon?: LucideIcon
  iconColor?: string
  progressColor?: string
  indicators?: string[]
}

export function ProgressMetricCard({
  title,
  value,
  maxValue,
  icon: Icon,
  iconColor = 'text-blue-600',
  progressColor = 'bg-blue-600',
  indicators
}: ProgressMetricCardProps) {
  const percentage = (value / maxValue) * 100

  const getProgressColor = () => {
    if (value >= maxValue * 0.8) return 'bg-green-600'
    if (value >= maxValue * 0.6) return 'bg-yellow-600'
    if (value >= maxValue * 0.4) return 'bg-orange-600'
    return 'bg-red-600'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 uppercase">{title}</h3>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold ${
            value >= maxValue * 0.8 ? 'text-green-600' :
            value >= maxValue * 0.6 ? 'text-yellow-600' :
            value >= maxValue * 0.4 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {value}
          </span>
          <span className="text-2xl text-gray-400 font-medium">/{maxValue}</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div 
          className={`h-3 rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {indicators && indicators.length > 0 && (
        <div className="space-y-1 text-xs text-gray-600">
          {indicators.map((indicator, idx) => (
            <p key={idx}>• {indicator}</p>
          ))}
        </div>
      )}
    </div>
  )
}

interface ComparisonMetricCardProps {
  title: string
  values: {
    label: string
    amount: number
    color?: string
  }[]
  icon?: LucideIcon
}

export function ComparisonMetricCard({
  title,
  values,
  icon: Icon
}: ComparisonMetricCardProps) {
  const maxValue = Math.max(...values.map(v => v.amount))

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {Icon && <Icon className="w-6 h-6 text-blue-600" />}
      </div>

      <div className="space-y-3">
        {values.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-semibold">${item.amount.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${item.color || 'bg-blue-600'}`}
                style={{ width: `${(item.amount / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
