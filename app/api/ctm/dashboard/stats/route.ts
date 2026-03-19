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
    const stats = ctmClient.getStats(calls)

    return NextResponse.json({
      stats,
      recentCalls: calls.slice(0, 10),
    })
  } catch (error) {
    console.error('CTM dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats from CTM' },
      { status: 500 }
    )
  }
}
