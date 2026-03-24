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
}

export function createCTMClient(): CTMClient {
  return new CTMClient()
}
