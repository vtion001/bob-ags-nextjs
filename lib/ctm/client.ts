import type { Call, Agent, DashboardStats } from '@/lib/types'

const BASE_URL = 'https://api.calltrackingmetrics.com/api/v1'

export interface CTMConfig {
  accessKey: string
  secretKey: string
  accountId: string
}

export class CTMClient {
  private accessKey: string
  private secretKey: string
  protected accountId: string
  protected baseUrl: string

  constructor() {
    this.accessKey = process.env.CTM_ACCESS_KEY || ''
    this.secretKey = process.env.CTM_SECRET_KEY || ''
    this.accountId = process.env.CTM_ACCOUNT_ID || ''
    this.baseUrl = BASE_URL
  }

  protected getAuthHeader(): string {
    return Buffer.from(`${this.accessKey}:${this.secretKey}`).toString('base64')
  }

  protected getAuthHeaders(): HeadersInit {
    return {
      'Authorization': `Basic ${this.getAuthHeader()}`,
      'Content-Type': 'application/json',
    }
  }

  protected isConfigured(): boolean {
    return !!(this.accessKey && this.secretKey && this.accountId)
  }

  protected validateConfig(): void {
    if (!this.isConfigured()) {
      throw new Error('CTM credentials not configured')
    }
  }

  public async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    this.validateConfig()

    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CTM API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  public getAccountId(): string {
    return this.accountId
  }

  public getBasicAuthHeader(): string {
    return Buffer.from(`${this.accessKey}:${this.secretKey}`).toString('base64')
  }

  getStats(calls: Call[]) {
    const totalCalls = calls.length
    const answered = calls.filter(c => c.status === 'completed' || c.status === 'active').length
    const missed = calls.filter(c => c.status === 'missed').length
    const withRecordings = calls.filter(c => c.recordingUrl).length
    const hotLeads = calls.filter(c => c.score && c.score >= 75).length
    const analyzed = calls.filter(c => c.score !== undefined).length
    const avgScore = calls.filter(c => c.score !== undefined).length > 0
      ? Math.round(calls.reduce((sum, c) => sum + (c.score || 0), 0) / analyzed)
      : 0

    return {
      totalCalls,
      answered,
      missed,
      withRecordings,
      hotLeads,
      analyzed,
      avgScore,
    }
  }

  getDashboardStats(calls: Call[]): DashboardStats {
    const stats = this.getStats(calls)
    return {
      totalCalls: stats.totalCalls,
      analyzed: stats.analyzed,
      hotLeads: stats.hotLeads,
      avgScore: String(stats.avgScore),
    }
  }
}

export function createCTMClient(): CTMClient {
  return new CTMClient()
}
