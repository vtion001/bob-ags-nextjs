import { CTMClient } from '../client'
import type { CTMSource } from '@/lib/types'

export class SourcesService extends CTMClient {
  async getSources(): Promise<{ sources?: CTMSource[] }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ sources?: CTMSource[] }>(
      `/accounts/${accountId}/sources`
    )
  }

  async createSource(data: {
    name: string
    online?: string
    referring_url?: string
    landing_url?: string
    position?: string
  }): Promise<{ status: string; source?: CTMSource }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string; source?: CTMSource }>(
      `/accounts/${accountId}/sources`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  async assignNumberToSource(tsoId: string, tpnId: string): Promise<{ status: string }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string }>(
      `/accounts/${accountId}/sources/${tsoId}/numbers/${tpnId}/add`,
      { method: 'POST' }
    )
  }
}

export function createSourcesService(): SourcesService {
  return new SourcesService()
}
