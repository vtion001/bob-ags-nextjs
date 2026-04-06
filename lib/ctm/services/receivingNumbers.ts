import { CTMClient } from '../client'
import type { CTMReceivingNumber } from '@/lib/types'

export class ReceivingNumbersService extends CTMClient {
  async getReceivingNumbers(): Promise<{ receiving_numbers?: CTMReceivingNumber[] }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ receiving_numbers?: CTMReceivingNumber[] }>(
      `/accounts/${accountId}/receiving_numbers`
    )
  }

  async createReceivingNumber(number: string, name: string): Promise<{ status: string; receiving_number?: CTMReceivingNumber }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string; receiving_number?: CTMReceivingNumber }>(
      `/accounts/${accountId}/receiving_numbers`,
      {
        method: 'POST',
        body: JSON.stringify({ number, name }),
      }
    )
  }

  async updateReceivingNumber(rpnId: string, name: string): Promise<{ status: string }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string }>(
      `/accounts/${accountId}/receiving_numbers/${rpnId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }
    )
  }
}

export function createReceivingNumbersService(): ReceivingNumbersService {
  return new ReceivingNumbersService()
}
