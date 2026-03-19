import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { CTMClient } from '@/lib/ctm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const hours = parseInt(searchParams.get('hours') || '24')

    const ctmClient = new CTMClient()
    const calls = await ctmClient.getCalls({ limit, hours })
    
    const inboundCalls = calls.filter(c => c.direction === 'inbound')
    const totalCalls = inboundCalls.length
    const analyzed = inboundCalls.filter(c => c.score !== undefined || c.analysis).length
    const hotLeads = inboundCalls.filter(c => (c.score ?? 0) >= 80).length
    const avgScore = totalCalls > 0
      ? Math.round(inboundCalls.reduce((sum, c) => sum + (c.score ?? 0), 0) / totalCalls)
      : 0

    const stats = {
      totalCalls,
      analyzed,
      hotLeads,
      avgScore: avgScore.toString(),
    }

    return NextResponse.json({
      stats,
      recentCalls: inboundCalls.slice(0, 10),
    })
  } catch (error) {
    console.error('CTM dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats from CTM' },
      { status: 500 }
    )
  }
}
