import type { Call } from './ctm'

export const mockCalls: Call[] = [
  {
    id: '1',
    phone: '+1 (555) 123-4567',
    direction: 'inbound',
    duration: 412,
    status: 'completed',
    score: 85,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    transcript: 'Sample transcript...',
    analysis: {
      sentiment: 'positive',
      summary: 'Caller interested in premium plan, high conversion probability',
      tags: ['hot-lead', 'decision-maker', 'budget-approved'],
      disposition: 'Follow up in 24h',
    },
  },
  {
    id: '2',
    phone: '+1 (555) 234-5678',
    direction: 'outbound',
    duration: 185,
    status: 'completed',
    score: 62,
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    transcript: 'Sample transcript...',
    analysis: {
      sentiment: 'neutral',
      summary: 'Caller needs more information before deciding',
      tags: ['warm-lead', 'needs-info'],
      disposition: 'Send proposal',
    },
  },
  {
    id: '3',
    phone: '+1 (555) 345-6789',
    direction: 'inbound',
    duration: 92,
    status: 'completed',
    score: 28,
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    transcript: 'Sample transcript...',
    analysis: {
      sentiment: 'negative',
      summary: 'Caller not interested, budget constraints',
      tags: ['cold-lead', 'not-interested'],
      disposition: 'Add to nurture sequence',
    },
  },
  {
    id: '4',
    phone: '+1 (555) 456-7890',
    direction: 'inbound',
    duration: 523,
    status: 'completed',
    score: 92,
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    transcript: 'Sample transcript...',
    analysis: {
      sentiment: 'positive',
      summary: 'Strong fit, ready to purchase, stakeholders aligned',
      tags: ['hot-lead', 'ready-to-buy', 'high-value'],
      disposition: 'Send contract immediately',
    },
  },
  {
    id: '5',
    phone: '+1 (555) 567-8901',
    direction: 'outbound',
    duration: 267,
    status: 'completed',
    score: 71,
    timestamp: new Date(Date.now() - 1000 * 60 * 380),
    transcript: 'Sample transcript...',
    analysis: {
      sentiment: 'positive',
      summary: 'Interest shown, will circle back next week',
      tags: ['warm-lead', 'interested'],
      disposition: 'Schedule follow-up',
    },
  },
]

export function getCallStats() {
  const totalCalls = mockCalls.length
  const analyzed = mockCalls.filter(c => c.score !== undefined).length
  const hotLeads = mockCalls.filter(c => c.score && c.score >= 75).length
  const avgScore = mockCalls.reduce((sum, c) => sum + (c.score || 0), 0) / analyzed

  return {
    totalCalls,
    analyzed,
    hotLeads,
    avgScore: avgScore.toFixed(1),
  }
}

export function getRecentCalls(limit: number = 10) {
  return mockCalls.slice(0, limit).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}