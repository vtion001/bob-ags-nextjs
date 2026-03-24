import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fetchCallsFromCTM } from '@/lib/calls/fetcher'
import { getCachedCalls, storeCallsToCache, getLastCallTimestamp } from '@/lib/calls/cache'
import { invalidateCache } from '@/lib/api/cache'
import { filterCallsByPhillies } from '@/lib/monitor/helpers'
import type { CallAPIResponse } from '@/lib/calls/transformer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const cacheOnly = searchParams.get('cacheOnly') === 'true'
    const hours = parseInt(searchParams.get('hours') || '168')
    const agentId = searchParams.get('agentId')
    const limit = parseInt(searchParams.get('limit') || '500')
    const ctmCallId = searchParams.get('ctmCallId')
    const mode = searchParams.get('mode') || 'full'

    if (cacheOnly) {
      try {
        const cached = await getCachedCalls(supabase, {
          userId: user.id,
          hours,
          agentId: agentId || undefined,
          limit,
          ctmCallId: ctmCallId || undefined,
        })
        return NextResponse.json({
          calls: cached?.calls || [],
          source: 'cache',
          count: cached?.calls.length || 0,
          fromCache: true,
        })
      } catch {
        return NextResponse.json({ calls: [], source: 'cache', count: 0, fromCache: true })
      }
    }

    if (mode === 'delta') {
      const sinceMs = await getLastCallTimestamp(supabase, user.id)
      const sinceHours = sinceMs ? Math.max(1, (Date.now() - sinceMs) / 3600000) : 1
      const calls = await fetchCallsFromCTM({ hours: Math.min(sinceHours, 24), agentId: agentId || undefined, limit: 500 })
      let filtered = filterCallsByPhillies(calls) as CallAPIResponse[]
      filtered = sinceMs
        ? filtered.filter(c => new Date(c.timestamp).getTime() > sinceMs)
        : filtered
      if (filtered.length > 0) {
        try { await storeCallsToCache(supabase, user.id, filtered) } catch {}
      }
      return NextResponse.json({ calls: filtered, source: 'ctm', count: filtered.length, isDelta: true })
    }

    const cached = await getCachedCalls(supabase, {
      userId: user.id,
      hours,
      agentId: agentId || undefined,
      limit,
      ctmCallId: ctmCallId || undefined,
    })

    if (cached && cached.calls.length > 0) {
      return NextResponse.json({
        calls: cached.calls,
        source: 'cache',
        count: cached.calls.length,
        fromCache: true,
        cacheAgeMs: cached.cacheAge,
      })
    }

    const calls = await fetchCallsFromCTM({ hours, agentId: agentId || undefined, limit })
    const philliesCalls = filterCallsByPhillies(calls) as CallAPIResponse[]
    try {
      await storeCallsToCache(supabase, user.id, philliesCalls)
    } catch (storeErr) {
      console.warn('[calls] Supabase write failed:', storeErr)
    }
    return NextResponse.json({ calls: philliesCalls, source: 'ctm', count: philliesCalls.length, fromCache: false })
  } catch (error) {
    console.error('Calls fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)

    if (body?.calls && Array.isArray(body.calls)) {
      const callsWithUser = body.calls.map((c: Record<string, unknown>) => ({
        ctm_call_id: c.id,
        user_id: user.id,
        phone: (c.phone as string) || '',
        direction: (c.direction as string) || 'inbound',
        duration: (c.duration as number) || 0,
        status: (c.status as string) || 'completed',
        timestamp: (c.timestamp as string) || new Date().toISOString(),
        caller_number: (c.callerNumber as string) || null,
        tracking_number: (c.trackingNumber as string) || null,
        tracking_label: (c.trackingLabel as string) || null,
        source: (c.source as string) || null,
        source_id: (c.sourceId as string) || null,
        agent_id: (c.agentId as string) || null,
        agent_name: (c.agentName as string) || null,
        recording_url: (c.recordingUrl as string) || null,
        transcript: (c.transcript as string) || null,
        city: (c.city as string) || null,
        state: (c.state as string) || null,
        postal_code: (c.postalCode as string) || null,
        notes: (c.notes as string) || null,
        talk_time: (c.talkTime as number) || null,
        wait_time: (c.waitTime as number) || null,
        ring_time: (c.ringTime as number) || null,
        score: (c.score as number) || null,
        sentiment: (c.sentiment as string) || null,
        summary: (c.summary as string) || null,
        tags: (c.tags as string[]) || null,
        disposition: (c.disposition as string) || null,
        rubric_results: (c.rubricResults as unknown) || null,
        rubric_breakdown: (c.rubricBreakdown as unknown) || null,
        synced_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('calls')
        .upsert(callsWithUser, { onConflict: 'ctm_call_id' })

      if (error) console.warn('[calls] Analysis upsert failed:', error)
      
      invalidateCache(`ctm:dashboardStats:${user.id}`)
      
      return NextResponse.json({ success: true, count: callsWithUser.length })
    }

    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agentId')

    const sinceMs = await getLastCallTimestamp(supabase, user.id)
    const sinceHours = sinceMs ? Math.max(1, (Date.now() - sinceMs) / 3600000) : 1
    const calls = await fetchCallsFromCTM({ hours: Math.min(sinceHours, 24), agentId: agentId || undefined, limit: 500 })
    let filtered = filterCallsByPhillies(calls) as CallAPIResponse[]
    filtered = sinceMs
      ? filtered.filter(c => new Date(c.timestamp).getTime() > sinceMs)
      : filtered

    if (filtered.length > 0) {
      try { await storeCallsToCache(supabase, user.id, filtered) } catch {}
    }

    invalidateCache(`ctm:dashboardStats:${user.id}`)

    return NextResponse.json({ calls: filtered, source: 'ctm', count: filtered.length, isDelta: true })
  } catch (error) {
    console.error('Calls sync error:', error)
    return NextResponse.json({ error: 'Failed to sync calls' }, { status: 500 })
  }
}