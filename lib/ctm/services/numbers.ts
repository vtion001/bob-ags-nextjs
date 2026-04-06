import { CTMClient } from '../client'
import type { CTMNumber, SearchNumbersParams } from '@/lib/types'

export class NumbersService extends CTMClient {
  async getNumbers(): Promise<{ numbers?: CTMNumber[] }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ numbers?: CTMNumber[] }>(
      `/accounts/${accountId}/numbers.json`
    )
  }

  async searchNumbers(params: SearchNumbersParams): Promise<{ numbers?: CTMNumber[] }> {
    const queryParams = new URLSearchParams()
    if (params.country) queryParams.set('country', params.country)
    if (params.searchby) queryParams.set('searchby', params.searchby)
    if (params.areacode) queryParams.set('areacode', params.areacode)
    if (params.address) queryParams.set('address', params.address)
    if (params.pattern) queryParams.set('pattern', params.pattern)

    const accountId = this.getAccountId()
    return this.makeRequest<{ numbers?: CTMNumber[] }>(
      `/accounts/${accountId}/numbers/search.json?${queryParams.toString()}`
    )
  }

  async purchaseNumber(phoneNumber: string, test: boolean = true): Promise<{ status: string; number?: CTMNumber }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string; number?: CTMNumber }>(
      `/accounts/${accountId}/numbers`,
      {
        method: 'POST',
        body: JSON.stringify({ phone_number: phoneNumber, test }),
      }
    )
  }

  async getNumberDetails(tpnId: string): Promise<{ number?: CTMNumber }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ number?: CTMNumber }>(
      `/accounts/${accountId}/numbers/${tpnId}`
    )
  }

  async updateNumberRoute(tpnId: string, dialRoute: string, numbers?: string[], countryCodes?: string[]): Promise<{ status: string }> {
    const data: Record<string, unknown> = { dial_route: dialRoute }
    if (numbers) data.numbers = numbers
    if (countryCodes) data.country_codes = countryCodes

    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string }>(
      `/accounts/${accountId}/numbers/${tpnId}/update_number`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  async setNumberDialRoute(tpnId: string, dialRoute: string, voiceMenuId?: string): Promise<{ status: string }> {
    const data: Record<string, unknown> = {
      virtual_phone_number: { dial_route: dialRoute }
    }
    if (voiceMenuId) {
      (data.virtual_phone_number as Record<string, unknown>).voice_menu_id = voiceMenuId
    }

    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string }>(
      `/accounts/${accountId}/numbers/${tpnId}/dial_routes`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    )
  }
}

export function createNumbersService(): NumbersService {
  return new NumbersService()
}
