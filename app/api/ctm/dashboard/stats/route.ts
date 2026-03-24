import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'
import { getCachedCalls } from '@/lib/calls/cache'
import { getAuthenticatedUser, getCTMClient } from '@/lib/api/deps'
import { getCached, setCache } from '@/lib/api/cache'

interface DashboardStats {
  totalCalls: number
  analyzed: number
  hotLeads: number
  avgScore: string
}

function calculateStats(calls: any[]): { stats: DashboardStats; recentCalls: any[] } {
  const inboundCalls = calls.filter((c: any) => c.direction === 'inbound')
  const totalCalls = inboundCalls.length
  const analyzed = inboundCalls.filter((c: any) => c.score !== undefined || c.analysis).length
  const hotLeads = inboundCalls.filter((c: any) => (c.score ?? 0) >= 80).length
  const scoredCalls = inboundCalls.filter((c: any) => c.score && c.score > 0)
  const avgScore = scoredCalls.length > 0
    ? Math.round(scoredCalls.reduce((sum: number, c: any) => sum + (c.score ?? 0), 0) / scoredCalls.length)
    : 0

  return {
    stats: { totalCalls, analyzed, hotLeads, avgScore: avgScore.toString() },
    recentCalls: inboundCalls.slice(0, 10),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request)
    if (error || !user) return error!

    const searchParams = request.nextUrl.searchParams
    const cacheOnly = searchParams.get('cacheOnly') === 'true'
    const swr = searchParams.get('swr') === 'true'
    const hours = parseInt(searchParams.get('hours') || '168')
    const agentId = searchParams.get('agentId')

    const cacheKey = `ctm:dashboardStats:${user.id}:${hours}:${agentId || 'all'}`
    const cachedData = swr ? getCached<{ stats: DashboardStats; recentCalls: any[] }>(cacheKey, 300000) : null

    if (cachedData) {
      if (swr) {
        fetch(`${request.nextUrl.origin}/api/ctm/dashboard/stats?hours=${hours}${agentId ? `&agentId=${agentId}` : ''}&refresh=true`, {
          headers: { 'Authorization': request.headers.get('Authorization') || '' },
        }).catch(() => {})
      }

      return NextResponse.json({
        ...cachedData,
        fromCache: true,
        stale: swr,
      })
    }

    if (cacheOnly) {
      return NextResponse.json({
        stats: { totalCalls: 0, analyzed: 0, hotLeads: 0, avgScore: '0' },
        recentCalls: [],
        fromCache: true,
      })
    }

    try {
      const cached = await getCachedCalls(await createServerSupabase(request), {
        userId: user.id,
        hours,
        agentId: agentId || undefined,
        limit: 500,
        ctmCallId: undefined,
      })

      if (cached && cached.calls.length > 0) {
        const { stats, recentCalls } = calculateStats(cached.calls)
        setCache(cacheKey, { stats, recentCalls })
        return NextResponse.json({ stats, recentCalls, fromCache: true })
      }
    } catch {}

    const ctmClient = getCTMClient()
    const calls = await ctmClient.calls.getCalls({ limit: 500, hours, agentId: agentId || undefined })
    const { stats, recentCalls } = calculateStats(calls)
    setCache(cacheKey, { stats, recentCalls })

    return NextResponse.json({ stats, recentCalls, fromCache: false })
  } catch (error) {
    console.error('CTM dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats from CTM' },
      { status: 500 }
    )
  }
}
