import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { fetchCallsFromCTM } from '@/lib/calls/fetcher'
import { getCachedCalls, storeCallsToCache, isCacheStale } from '@/lib/calls/cache'

const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '2160')
    const agentId = searchParams.get('agentId')
    const limit = parseInt(searchParams.get('limit') || '500')
    const skipSync = searchParams.get('skipSync') === 'true'
    const ctmCallId = searchParams.get('ctmCallId')
    const after = searchParams.get('after')

    if (after) {
      const calls = await fetchCallsFromCTM({ hours, agentId, limit })
      const afterDate = new Date(after).getTime()
      const newer = calls.filter(c => new Date(c.timestamp).getTime() > afterDate)
      return NextResponse.json({ calls: newer, source: 'ctm', count: newer.length })
    }

    let cachedData = null
    try {
      cachedData = await getCachedCalls(supabase, {
        userId: user.id,
        hours,
        agentId,
        limit,
        ctmCallId,
      })
    } catch (cacheErr) {
      console.warn('[calls] Supabase cache unavailable, falling back to CTM:', cacheErr)
    }

    if (cachedData && cachedData.calls.length > 0) {
      const isCacheStaleFlag = isCacheStale(cachedData.cacheAge)

      const response: any = {
        calls: cachedData.calls,
        source: 'cache',
        count: cachedData.calls.length,
        cacheAgeMs: cachedData.cacheAge,
      }
      if (!skipSync && isCacheStaleFlag) response.needsSync = true
      return NextResponse.json(response)
    }

    const calls = await fetchCallsFromCTM({ hours, agentId, limit })

    try {
      await storeCallsToCache(supabase, user.id, calls)
    } catch (storeErr) {
      console.warn('[calls] Supabase write failed:', storeErr)
    }

    return NextResponse.json({ calls, source: 'ctm', count: calls.length })
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
    const hours = parseInt(searchParams.get('hours') || '2160')
    const agentId = searchParams.get('agentId')

    const calls = await fetchCallsFromCTM({ hours: 24, agentId, limit: 500 })
    
    if (calls.length === 0) {
      return NextResponse.json({ calls: [], source: 'ctm', count: 0, isIncremental: true, message: 'No new calls' })
    }

    try {
      await storeCallsToCache(supabase, user.id, calls)
    } catch (e) {
      console.warn('[calls] Supabase sync write skipped (table may not exist):', e)
    }

    return NextResponse.json({ calls, source: 'ctm', count: calls.length, isIncremental: true })
  } catch (error) {
    console.error('Calls sync error:', error)
    return NextResponse.json({ error: 'Failed to sync calls' }, { status: 500 })
  }
}