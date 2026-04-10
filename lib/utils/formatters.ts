export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function formatDurationLong(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export function formatDurationCompact(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Backwards compatibility alias
export const formatDuration = formatDurationCompact

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`
  }
  return phone
}

export function getScoreBadge(score?: number): {
  label: string
  className: string
  variant: 'hot' | 'warm' | 'cold' | 'pending'
} {
  if (!score) return { label: 'Pending', className: 'bg-slate-100 text-slate-600', variant: 'pending' }
  if (score >= 75) return { label: 'Hot', className: 'bg-navy-900 text-white', variant: 'hot' }
  if (score >= 50) return { label: 'Warm', className: 'bg-amber-100 text-amber-800', variant: 'warm' }
  return { label: 'Cold', className: 'bg-slate-100 text-slate-600', variant: 'cold' }
}

export function getStatusBadge(status: string): {
  label: string
  className: string
} {
  switch (status) {
    case 'completed':
      return { label: 'Done', className: 'text-emerald-600' }
    case 'missed':
      return { label: 'Missed', className: 'text-red-600' }
    case 'active':
      return { label: 'Active', className: 'text-amber-600' }
    default:
      return { label: status, className: 'text-navy-600' }
  }
}
