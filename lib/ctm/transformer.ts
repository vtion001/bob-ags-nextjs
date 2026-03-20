import type { CTMCall, Call } from '@/lib/types'

export function transformCall(ctmCall: CTMCall): Call {
  const sale = (ctmCall as unknown as Record<string, unknown>).sale as { score?: number; name?: string } | undefined
  const activityAnalysis = (ctmCall as unknown as Record<string, unknown>).activity_analysis as Record<string, string> | undefined

  return {
    id: String(ctmCall.id),
    phone: ctmCall.phone_number || ctmCall.caller_number || ctmCall.caller_id || ctmCall.did_number || '',
    direction: (ctmCall.direction as 'inbound' | 'outbound') || 'inbound',
    duration: ctmCall.duration || ctmCall.talk_time || 0,
    status: mapStatus(ctmCall.status),
    timestamp: ctmCall.started_at ? new Date(ctmCall.started_at) : new Date(),
    name: ctmCall.name,
    callerNumber: ctmCall.caller_number || ctmCall.caller_id,
    trackingNumber: ctmCall.tracking_number,
    trackingLabel: ctmCall.tracking_label,
    source: ctmCall.source,
    sourceId: ctmCall.source_id ? String(ctmCall.source_id) : undefined,
    accountId: ctmCall.account_id ? String(ctmCall.account_id) : undefined,
    agent: ctmCall.agent ?? (ctmCall.source ? { id: '', name: ctmCall.source, email: '' } : undefined),
    recordingUrl: ctmCall.audio || ctmCall.recording_url,
    transcript: ctmCall.transcript,
    city: ctmCall.city,
    state: ctmCall.state,
    postalCode: ctmCall.postal_code,
    notes: ctmCall.notes,
    talkTime: ctmCall.talk_time,
    waitTime: ctmCall.wait_time,
    ringTime: ctmCall.ring_time,
    score: sale?.score,
    analysis: activityAnalysis ? {
      score: sale?.score ?? 0,
      sentiment: sale?.score && sale.score >= 75 ? 'positive' : sale?.score && sale.score >= 50 ? 'neutral' : 'negative',
      summary: activityAnalysis.general || activityAnalysis.sales || '',
      tags: ctmCall.tag_list || [],
      disposition: sale?.name || '',
    } : undefined,
    destinationNumber: ctmCall.destination_number,
    poolNumber: ctmCall.pool_number,
    didNumber: ctmCall.did_number,
    trackingNumberFormat: ctmCall.tracking_number_format,
  }
}

function mapStatus(ctmStatus?: string): 'completed' | 'missed' | 'active' {
  if (!ctmStatus) return 'completed'
  const statusMap: Record<string, 'completed' | 'missed' | 'active'> = {
    'completed': 'completed',
    'missed': 'missed',
    'active': 'active',
    'in progress': 'active',
    'voicemail': 'completed',
  }
  return statusMap[ctmStatus.toLowerCase()] || 'completed'
}
