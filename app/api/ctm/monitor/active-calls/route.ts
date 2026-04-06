import { NextRequest, NextResponse } from 'next/server'
import { CallsService } from '@/lib/ctm/services/calls'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const minutes = parseInt(searchParams.get('minutes') || '5', 10)

    const callsService = new CallsService()
    const calls = await callsService.getRecentCalls(minutes)

    return NextResponse.json({
      success: true,
      calls
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch active calls from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
