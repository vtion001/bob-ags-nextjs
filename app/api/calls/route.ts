import { NextRequest, NextResponse } from 'next/server'
import { CallsService } from '@/lib/ctm/services/calls'
import { createServerSupabase } from '@/lib/supabase/server'
import { createCallsService } from '@/lib/ctm/services/calls'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const hours = parseInt(searchParams.get('hours') || '24', 10)
    const status = searchParams.get('status')
    const sourceId = searchParams.get('source_id')
    const agentId = searchParams.get('agent_id')
    const agentProfileId = searchParams.get('agentProfileId') // Optional: specific agent profile to filter by
    const ctmCallId = searchParams.get('ctm_call_id') // Optional: fetch specific call by CTM call ID
    const cacheOnly = searchParams.get('cacheOnly') === 'true'

    // Fetch registered agent profiles with their CTM agent IDs
    const { supabase, response } = await createServerSupabase(request)
    const { data: agentProfiles } = await supabase
      .from('agent_profiles')
      .select('id, agent_id, name')

    // Build a map of CTM agent IDs to profile info
    const ctmAgentIdToProfile = new Map<string, { id: string; agent_id: string; name: string }>()
    for (const profile of agentProfiles || []) {
      if (profile.agent_id) {
        ctmAgentIdToProfile.set(profile.agent_id, profile)
        // Also normalize for comparison (remove non-digits)
        const normalizedId = profile.agent_id.replace(/\D/g, '')
        if (normalizedId !== profile.agent_id) {
          ctmAgentIdToProfile.set(normalizedId, profile)
        }
      }
    }

    // If ctm_call_id is provided, fetch specific call from Supabase
    if (ctmCallId) {
      // First try with user_id filter (for RLS), then without if not found
      const { data: cachedCall, error: fetchError } = await supabase
        .from('calls')
        .select('*')
        .eq('ctm_call_id', ctmCallId)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching cached call:', fetchError)
      }

      const jsonResponse = NextResponse.json({
        success: true,
        calls: cachedCall ? [cachedCall] : [],
        cached: !!cachedCall
      })
      response.cookies.getAll().forEach((cookie) => {
        jsonResponse.cookies.set(cookie.name, cookie.value)
      })
      return jsonResponse
    }

    const callsService = createCallsService()
    const calls = await callsService.getCalls({
      limit,
      hours,
      status: status || undefined,
      sourceId: sourceId || undefined,
      agentId: agentId || undefined
    })

    // Filter calls to only include those from registered agents
    // Use phone-based matching since agent IDs may be in different formats (UUID vs numeric)
    const filteredCalls = calls.filter(call => {
      // If no registered agents, return all calls
      if (ctmAgentIdToProfile.size === 0) return true

      // Match by agent ID (try both exact and normalized comparison)
      const callAgentId = call.agent?.id
      if (callAgentId) {
        // Check exact match
        if (ctmAgentIdToProfile.has(callAgentId)) return true
        // Check normalized match (digits only)
        const normalizedCallAgentId = callAgentId.replace(/\D/g, '')
        if (normalizedCallAgentId && ctmAgentIdToProfile.has(normalizedCallAgentId)) return true
      }

      // Also check by agent phone number if available
      if (call.agent?.phone && ctmAgentIdToProfile.size > 0) {
        // Check if any registered agent has this phone
        for (const [, profile] of ctmAgentIdToProfile) {
          // We can't directly match phone here since profiles don't store phone
          // But if we have agentProfiles with phone info, we could use it
        }
      }

      return false
    })

    // Create response with cookies from Supabase auth
    const jsonResponse = NextResponse.json({
      success: true,
      calls: filteredCalls
    })

    // Copy cookies from Supabase response to our response
    response.cookies.getAll().forEach((cookie) => {
      jsonResponse.cookies.set(cookie.name, cookie.value)
    })

    return jsonResponse
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch calls from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}

// POST handler for storing call/analysis data to Supabase
export async function POST(request: NextRequest) {
  const { supabase, response } = await createServerSupabase(request)

  let userId: string | null = null

  if (!isDevUser(request)) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = session.user.id
  } else {
    userId = DEV_BYPASS_UID
  }

  try {
    const body = await request.json()
    const { calls } = body

    if (!Array.isArray(calls) || calls.length === 0) {
      return NextResponse.json({ error: 'No calls data provided' }, { status: 400 })
    }

    // Transform calls to match the Supabase schema
    // The calls table has: ctm_call_id, user_id, and other fields
    const callsWithCtmId = calls.map((call: Record<string, unknown>) => ({
      ctm_call_id: String(call.id), // CTM call ID goes to ctm_call_id
      user_id: userId, // Set user_id for RLS
      phone: call.phone,
      direction: call.direction,
      duration: call.duration,
      status: call.status,
      timestamp: call.timestamp,
      caller_number: call.callerNumber,
      tracking_number: call.trackingNumber,
      tracking_label: call.trackingLabel,
      source: call.source,
      source_id: call.sourceId,
      agent_id: (call.agent as any)?.id,
      agent_name: (call.agent as any)?.name,
      recording_url: call.recordingUrl,
      transcript: call.transcript,
      city: call.city,
      state: call.state,
      postal_code: call.postalCode,
      notes: call.notes,
      talk_time: call.talkTime,
      wait_time: call.waitTime,
      ring_time: call.ringTime,
      score: call.score,
      sentiment: call.sentiment,
      summary: call.summary,
      tags: call.tags || [],
      disposition: call.disposition,
      rubric_results: call.rubric_results,
      rubric_breakdown: call.rubric_breakdown,
    }))

    // Upsert with ctm_call_id as conflict target
    const { error: upsertError } = await supabase
      .from('calls')
      .upsert(callsWithCtmId, { onConflict: 'ctm_call_id' })

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to store calls', details: upsertError.message }, { status: 500 })
    }

    const jsonResponse = NextResponse.json({ success: true })
    response.cookies.getAll().forEach((cookie) => {
      jsonResponse.cookies.set(cookie.name, cookie.value)
    })
    return jsonResponse
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
