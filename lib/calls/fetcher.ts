import { CTMClient } from '@/lib/ctm'
import { Call } from '@/lib/ctm'
import { transformCTMCallToAPIResponse, CallAPIResponse } from './transformer'
import { createCallsService } from '@/lib/ctm/services/calls'

export interface FetchCallsOptions {
  hours?: number
  agentId?: string | null
  limit?: number
}

export async function fetchCallsFromCTM(
  options: FetchCallsOptions = {}
): Promise<CallAPIResponse[]> {
  const { hours = 168, agentId = null, limit = 500 } = options

  const callsService = createCallsService()
  const calls = await callsService.getCalls({ limit, hours, agentId: agentId || undefined })
  const inbound = calls.filter(c => c.direction === 'inbound')

  return inbound.map(transformCTMCallToAPIResponse)
}

export async function fetchCallByIdFromCTM(callId: string): Promise<CallAPIResponse | null> {
  const callsService = createCallsService()
  const calls = await callsService.getCalls({ limit: 1, hours: 8760, agentId: null })
  const call = calls.find(c => c.id === callId)

  if (!call) return null

  const inbound = call.direction === 'inbound' ? call : null
  if (!inbound) return null

  return transformCTMCallToAPIResponse(inbound)
}