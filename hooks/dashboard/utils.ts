import type { TimeRange } from './types'

export function getHoursFromRange(range: TimeRange): number {
  switch (range) {
    case '24h': return 24
    case '7d': return 168
    case '30d': return 720
    case '90d': return 2160
    default: return 168
  }
}

export function formatDateRange(range: TimeRange): string {
  switch (range) {
    case '24h': return 'Last 24 Hours'
    case '7d': return 'Last 7 Days'
    case '30d': return 'Last 30 Days'
    case '90d': return 'Last 90 Days'
    case 'custom': return 'Custom Range'
  }
}
