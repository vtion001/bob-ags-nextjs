import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export formatDuration from centralized formatters
export { formatDuration } from './utils/formatters'

export function getScoreBadge(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' }
  if (score >= 60) return { label: 'Good', color: 'bg-amber-100 text-amber-800' }
  return { label: 'Needs Work', color: 'bg-red-100 text-red-800' }
}
