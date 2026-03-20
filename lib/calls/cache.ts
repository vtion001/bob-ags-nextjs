import { SupabaseClient } from '@supabase/supabase-js'
import { CallDBRow, transformDBRowToAPIResponse, CallAPIResponse } from './transformer'

const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export interface GetCachedCallsOptions {
  userId: string
  hours: number
  agentId?: string | null
  limit: number
  ctmCallId?: string | null
}

export async function getCachedCalls(
  supabase: SupabaseClient,
  options: GetCachedCallsOptions
): Promise<{ calls: CallAPIResponse[]; cacheAge: number } | null> {
  const { userId, hours, agentId, limit, ctmCallId } = options

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  
  let query = supabase
    .from('calls')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (agentId) query = query.eq('agent_id', agentId)
  if (ctmCallId) query = query.eq('ctm_call_id', ctmCallId)

  const { data, error } = await query
  
  if (error || !data || data.length === 0) {
    return null
  }

  const calls = (data as unknown as CallDBRow[]).map(transformDBRowToAPIResponse)
  const mostRecentSync = data[0]?.synced_at
  const cacheAge = mostRecentSync ? Date.now() - new Date(mostRecentSync).getTime() : Infinity

  return { calls, cacheAge }
}

export function isCacheStale(cacheAge: number): boolean {
  return cacheAge > SYNC_INTERVAL_MS
}

export async function storeCallsToCache(
  supabase: SupabaseClient,
  userId: string,
  calls: CallAPIResponse[]
): Promise<void> {
  if (calls.length === 0) return

  const rows = calls.map(c => ({
    ctm_call_id: c.id,
    user_id: userId,
    phone: c.phone,
    direction: c.direction,
    duration: c.duration,
    status: c.status,
    timestamp: c.timestamp,
    caller_number: c.callerNumber,
    tracking_number: c.trackingNumber,
    tracking_label: c.trackingLabel,
    source: c.source,
    source_id: c.sourceId,
    agent_id: c.agentId,
    agent_name: c.agentName,
    recording_url: c.recordingUrl,
    transcript: c.transcript,
    city: c.city,
    state: c.state,
    postal_code: c.postalCode,
    notes: c.notes,
    talk_time: c.talkTime,
    wait_time: c.waitTime,
    ring_time: c.ringTime,
    score: c.score,
    sentiment: c.sentiment,
    summary: c.summary,
    tags: c.tags,
    disposition: c.disposition,
    rubric_results: c.rubricResults || null,
    rubric_breakdown: c.rubricBreakdown || null,
    synced_at: new Date().toISOString(),
  }))

  await supabase.from('calls').upsert(rows, { onConflict: 'ctm_call_id' })
  
  await supabase.from('calls_sync_log').insert({
    user_id: userId,
    last_sync_at: new Date().toISOString(),
    calls_synced: rows.length,
    status: 'completed',
  })
}

export async function getLastCallTimestamp(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const { data: latestCall } = await supabase
    .from('calls')
    .select('timestamp')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    
  if (latestCall && latestCall.length > 0 && latestCall[0]?.timestamp) {
    return new Date(latestCall[0].timestamp).getTime()
  }
  return null
}