import { NextRequest, NextResponse } from 'next/server'
import { CallsService } from '@/lib/ctm/services/calls'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '24', 10)
    const sourceId = searchParams.get('source_id')
    const agentId = searchParams.get('agent_id')

    const callsService = new CallsService()

    // Use getAllCalls to iterate through all pages and get accurate totals
    // getAllCalls pages through up to 500 pages (100k calls) if no limit specified
    const calls = await callsService.getAllCalls({
      hours,
      sourceId: sourceId || undefined,
      agentId: agentId || undefined,
    })

    // Calculate stats from ALL calls (not just a page of 100-500)
    const totalCalls = calls.length
    const answered = calls.filter(c => c.status === 'completed' || c.status === 'active').length
    const missed = calls.filter(c => c.status === 'missed').length

    const durations = calls.filter(c => c.duration).map(c => c.duration!)
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0

    const scores = calls.filter(c => c.score !== undefined && c.score !== null).map(c => c.score!)
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalCalls,
        answered,
        missed,
        avgDuration,
        avgScore,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
