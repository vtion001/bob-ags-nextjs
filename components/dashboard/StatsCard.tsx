import React from 'react'
import Card from '@/components/ui/Card'

export interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

export default function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5 hover:shadow-lg transition-shadow duration-200">
      {icon && (
        <div className="flex-shrink-0 w-12 h-12 bg-navy-100 rounded-lg flex items-center justify-center text-navy-900">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-navy-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-navy-900 mt-1">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </div>
    </Card>
  )
}
