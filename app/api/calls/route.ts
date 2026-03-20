import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fetchCallsFromCTM } from '@/lib/calls/fetcher'
import { getCachedCalls, storeCallsToCache, getLastCallTimestamp } from '@/lib/calls/cache'

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
      const filtered = sinceMs
        ? calls.filter(c => new Date(c.timestamp).getTime() > sinceMs)
        : calls
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
    try {
      await storeCallsToCache(supabase, user.id, calls)
    } catch (storeErr) {
      console.warn('[calls] Supabase write failed:', storeErr)
    }
    return NextResponse.json({ calls, source: 'ctm', count: calls.length, fromCache: false })
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

    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agentId')

    const sinceMs = await getLastCallTimestamp(supabase, user.id)
    const sinceHours = sinceMs ? Math.max(1, (Date.now() - sinceMs) / 3600000) : 1
    const calls = await fetchCallsFromCTM({ hours: Math.min(sinceHours, 24), agentId: agentId || undefined, limit: 500 })
    const filtered = sinceMs
      ? calls.filter(c => new Date(c.timestamp).getTime() > sinceMs)
      : calls

    if (filtered.length > 0) {
      try { await storeCallsToCache(supabase, user.id, filtered) } catch {}
    }

    return NextResponse.json({ calls: filtered, source: 'ctm', count: filtered.length, isDelta: true })
  } catch (error) {
    console.error('Calls sync error:', error)
    return NextResponse.json({ error: 'Failed to sync calls' }, { status: 500 })
  }
}