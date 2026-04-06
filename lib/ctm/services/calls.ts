import { CTMClient } from '../client'
import { transformCall } from '../transformer'
import type { Call, GetCallsParams, CTMCall } from '@/lib/types'

function normalizePhoneForComparison(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }
  return digits
}

function phoneMatches(phone1: string, phone2: string): boolean {
  const norm1 = normalizePhoneForComparison(phone1)
  const norm2 = normalizePhoneForComparison(phone2)
  
  if (!norm1 || !norm2) return false
  
  if (norm1.length === norm2.length) {
    return norm1 === norm2
  }
  
  const shorter = norm1.length < norm2.length ? norm1 : norm2
  const longer = norm1.length < norm2.length ? norm2 : norm1
  
  return longer.slice(-shorter.length) === shorter
}

export class CallsService extends CTMClient {
  async getCalls(params: GetCallsParams = {}): Promise<Call[]> {
    const { limit = 100, hours = 24, status, sourceId, agentId } = params

    const callsPerRequest = 200
    const pagesNeeded = Math.ceil(limit / callsPerRequest)
    const maxPages = Math.min(pagesNeeded, 500)

    let allCalls: Call[] = []
    const accountId = this.getAccountId()

    for (let page = 1; page <= maxPages && allCalls.length < limit; page++) {
      let endpoint = `/accounts/${accountId}/calls.json?limit=${callsPerRequest}&hours=${hours}&page=${page}`
      if (status) endpoint += `&status=${status}`
      if (sourceId) endpoint += `&source_id=${sourceId}`
      if (agentId) endpoint += `&agent_id=${agentId}`

      const data = await this.makeRequest<{ calls?: CTMCall[] }>(endpoint)
      
      if (!data.calls || data.calls.length === 0) break

      const transformedCalls = data.calls.map(transformCall)
      
      if (agentId) {
        allCalls.push(...transformedCalls.filter(c => c.agent?.id === agentId))
      } else {
        allCalls.push(...transformedCalls)
      }
    }

    return allCalls
  }

  async getAllCalls(params: { hours?: number; status?: string | null; sourceId?: string | null; agentId?: string | null; direction?: 'inbound' | 'outbound'; limit?: number } = {}): Promise<Call[]> {
    const { hours = 8760, status, sourceId, agentId, direction, limit } = params

    const callsPerRequest = 200
    const maxPages = limit ? Math.ceil(limit / callsPerRequest) : 500
    const accountId = this.getAccountId()

    let allCalls: Call[] = []
    let page = 1
    let hasMore = true

    while (page <= maxPages && hasMore) {
      let endpoint = `/accounts/${accountId}/calls.json?limit=${callsPerRequest}&hours=${hours}&page=${page}`
      if (status) endpoint += `&status=${status}`
      if (sourceId) endpoint += `&source_id=${sourceId}`
      if (agentId) endpoint += `&agent_id=${agentId}`
      if (direction) endpoint += `&direction=${direction}`

      const data = await this.makeRequest<{ calls?: CTMCall[] }>(endpoint)

      if (!data.calls || data.calls.length === 0) {
        hasMore = false
        break
      }

      const transformedCalls = data.calls.map(transformCall)

      if (agentId) {
        allCalls.push(...transformedCalls.filter(c => c.agent?.id === agentId))
      } else {
        allCalls.push(...transformedCalls)
      }

      if (limit && allCalls.length >= limit) {
        allCalls = allCalls.slice(0, limit)
        hasMore = false
        break
      }

      if (data.calls.length < callsPerRequest) {
        hasMore = false
      } else {
        page++
      }
    }

    return allCalls
  }

  async getCall(callId: string): Promise<Call | null> {
    try {
      // If callId looks like an SID (starts with 'CA'), we need to resolve the numeric ID
      if (callId.startsWith('CA')) {
        const numericId = await this.resolveNumericId(callId)
        if (!numericId) {
          return null
        }
        callId = numericId
      }

      const accountId = this.getAccountId()
      const data = await this.makeRequest<CTMCall>(
        `/accounts/${accountId}/calls/${callId}.json`
      )
      return data ? transformCall(data) : null
    } catch {
      return null
    }
  }

  /**
   * Resolve a CTM call SID to its numeric ID.
   * CTM's /calls/{id}.json endpoint only accepts numeric IDs, not SIDs.
   * We fetch recent calls and find the matching SID (paginating as needed).
   */
  private async resolveNumericId(sid: string): Promise<string | null> {
    try {
      const maxPages = 100 // search up to 100 pages (20k calls) to find the SID
      let after: string | undefined = undefined
      const accountId = this.getAccountId()

      for (let page = 0; page < maxPages; page++) {
        let endpoint = `/accounts/${accountId}/calls.json?limit=200&hours=24`
        if (after) endpoint += `&after=${after}`

        const data = await this.makeRequest<{ calls?: CTMCall[]; after?: string }>(endpoint)

        if (data.calls) {
          const match = data.calls.find(c => c.sid === sid)
          if (match) {
            return String(match.id)
          }
        }

        after = data.after
        if (!after) break
      }

      return null
    } catch {
      return null
    }
  }

  async getCallTranscript(callId: string): Promise<string> {
    try {
      const accountId = this.getAccountId()
      const data = await this.makeRequest<{ transcript?: string }>(
        `/accounts/${accountId}/calls/${callId}/transcript`
      )
      return data.transcript || ''
    } catch {
      return ''
    }
  }

  async getActiveCalls(): Promise<Call[]> {
    return this.getCalls({ hours: 1 })
  }

  async getRecentCalls(minutes: number = 5): Promise<Call[]> {
    const hours = Math.max(0.017, minutes / 60)
    return this.getCalls({ hours, limit: 50 })
  }

  async searchCallsByPhone(phoneNumber: string, hours: number = 8760, limit?: number, direction?: 'inbound' | 'outbound'): Promise<Call[]> {
    // Phone search should fetch all available calls (no limit by default)
    const allCalls = await this.getAllCalls({ hours, direction, limit })

    return allCalls.filter(call => {
      const phoneFields = [
        call.phone,
        call.callerNumber,
        call.trackingNumber,
        call.destinationNumber,
        call.poolNumber,
        call.didNumber,
      ]
      return phoneFields.some(field => {
        if (!field) return false
        return phoneMatches(String(field), phoneNumber)
      })
    })
  }
}

export function createCallsService(): CallsService {
  return new CallsService()
}
