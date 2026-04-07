export interface Agent {
  id: string
  uid: number
  name: string
  email: string
}

export interface UserGroup {
  id: string
  name: string
  userIds: number[]
}

export interface ScoreDistribution {
  excellent: number
  good: number
  needsImprovement: number
  poor: number
}

export interface ZTPViolations {
  hipaaRisk: number
  medicalAdviceRisk: number
  unqualifiedTransfer: number
}

export interface DispositionBreakdown {
  qualified: number
  warmLead: number
  refer: number
  doNotRefer: number
}

export interface KPIStats {
  totalCalls: number
  answered: number
  missed: number
  voicemail: number
  avgDuration: number
  avgTalkTime: number
  avgWaitTime: number
  avgRingTime: number
  avgScore: number
  scoreDistribution: ScoreDistribution
  ztpViolations: ZTPViolations
  disposition: DispositionBreakdown
}

export interface DashboardStats {
  totalCalls: number
  analyzed: number
  hotLeads: number
  avgScore: string
  kpi: KPIStats
}

export interface LiveCallsMeta {
  total: number
  isAdmin: boolean
  assignedGroupId: string | null
  assignedAgentId: string | null
  userEmail: string | null
}

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom'
