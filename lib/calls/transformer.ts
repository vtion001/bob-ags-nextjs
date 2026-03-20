import { Call } from '@/lib/ctm'

export interface CallDBRow {
  id: number
  ctm_call_id: string
  user_id: string
  phone: string
  direction: string
  duration: number
  status: string
  timestamp: string
  caller_number: string | null
  tracking_number: string | null
  tracking_label: string | null
  source: string | null
  source_id: string | null
  agent_id: string | null
  agent_name: string | null
  recording_url: string | null
  transcript: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  notes: string | null
  talk_time: number | null
  wait_time: number | null
  ring_time: number | null
  score: number | null
  sentiment: string | null
  summary: string | null
  tags: string[] | null
  disposition: string | null
  synced_at: string | null
  rubric_results: unknown | null
  rubric_breakdown: unknown | null
}

export interface CallAPIResponse {
  id: string
  phone: string
  direction: string
  duration: number
  status: string
  timestamp: string
  callerNumber: string | null
  trackingNumber: string | null
  trackingLabel: string | null
  source: string | null
  sourceId: string | null
  agentId: string | null
  agentName: string | null
  recordingUrl: string | null
  transcript: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  notes: string | null
  talkTime: number | null
  waitTime: number | null
  ringTime: number | null
  score: number | null
  sentiment: string | null
  summary: string | null
  tags: string[] | null
  disposition: string | null
  syncedAt: string | null
  rubricResults: unknown | null
  rubricBreakdown: unknown | null
  analysis?: {
    score: number | null
    sentiment: string | null
    summary: string | null
    tags: string[] | null
    disposition: string | null
    rubric_results: unknown | null
    rubric_breakdown: unknown | null
  }
}

export function transformCTMToDBRow(c: Call, userId: string): Omit<CallDBRow, 'id'> {
  return {
    ctm_call_id: c.id,
    user_id: userId,
    phone: c.phone,
    direction: c.direction,
    duration: c.duration,
    status: c.status,
    timestamp: new Date(c.timestamp).toISOString(),
    caller_number: c.callerNumber || null,
    tracking_number: c.trackingNumber || null,
    tracking_label: c.trackingLabel || null,
    source: c.source || null,
    source_id: c.sourceId || null,
    agent_id: c.agent?.id || null,
    agent_name: c.agent?.name || null,
    recording_url: c.recordingUrl || null,
    transcript: c.transcript || null,
    city: c.city || null,
    state: c.state || null,
    postal_code: c.postalCode || null,
    notes: c.notes || null,
    talk_time: c.talkTime || null,
    wait_time: c.waitTime || null,
    ring_time: c.ringTime || null,
    score: (c as any).score || null,
    sentiment: (c as any).sentiment || null,
    summary: (c as any).summary || null,
    tags: (c as any).tags || null,
    disposition: (c as any).disposition || null,
    synced_at: new Date().toISOString(),
    rubric_results: (c as any).rubricResults || null,
    rubric_breakdown: (c as any).rubricBreakdown || null,
  }
}

export function transformDBRowToAPIResponse(row: CallDBRow): CallAPIResponse {
  return {
    id: row.ctm_call_id,
    phone: row.phone,
    direction: row.direction,
    duration: row.duration,
    status: row.status,
    timestamp: row.timestamp,
    callerNumber: row.caller_number,
    trackingNumber: row.tracking_number,
    trackingLabel: row.tracking_label,
    source: row.source,
    sourceId: row.source_id,
    agentId: row.agent_id,
    agentName: row.agent_name,
    recordingUrl: row.recording_url,
    transcript: row.transcript,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    notes: row.notes,
    talkTime: row.talk_time,
    waitTime: row.wait_time,
    ringTime: row.ring_time,
    score: row.score,
    sentiment: row.sentiment,
    summary: row.summary,
    tags: row.tags,
    disposition: row.disposition,
    syncedAt: row.synced_at,
    rubricResults: row.rubric_results,
    rubricBreakdown: row.rubric_breakdown,
    analysis: {
      score: row.score,
      sentiment: row.sentiment,
      summary: row.summary,
      tags: row.tags,
      disposition: row.disposition,
      rubric_results: row.rubric_results,
      rubric_breakdown: row.rubric_breakdown,
    },
  }
}

export function transformCTMCallToAPIResponse(c: Call): CallAPIResponse {
  return {
    id: c.id,
    phone: c.phone,
    direction: c.direction,
    duration: c.duration,
    status: c.status,
    timestamp: new Date(c.timestamp).toISOString(),
    callerNumber: c.callerNumber || null,
    trackingNumber: c.trackingNumber || null,
    trackingLabel: c.trackingLabel || null,
    source: c.source || null,
    sourceId: c.sourceId || null,
    agentId: c.agent?.id || null,
    agentName: c.agent?.name || null,
    recordingUrl: c.recordingUrl || null,
    transcript: c.transcript || null,
    city: c.city || null,
    state: c.state || null,
    postalCode: c.postalCode || null,
    notes: c.notes || null,
    talkTime: c.talkTime || null,
    waitTime: c.waitTime || null,
    ringTime: c.ringTime || null,
    score: (c as any).score || null,
    sentiment: (c as any).sentiment || null,
    summary: (c as any).summary || null,
    tags: (c as any).tags || null,
    disposition: (c as any).disposition || null,
    syncedAt: (c as any).syncedAt || null,
    rubricResults: (c as any).rubricResults || null,
    rubricBreakdown: (c as any).rubricBreakdown || null,
    analysis: {
      score: (c as any).score || null,
      sentiment: (c as any).sentiment || null,
      summary: (c as any).summary || null,
      tags: (c as any).tags || null,
      disposition: (c as any).disposition || null,
      rubric_results: (c as any).rubricResults || null,
      rubric_breakdown: (c as any).rubricBreakdown || null,
    },
  }
}