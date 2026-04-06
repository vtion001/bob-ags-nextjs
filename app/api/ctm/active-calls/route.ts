import { NextRequest, NextResponse } from 'next/server'
import { CallsService } from '@/lib/ctm/services/calls'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const callsService = new CallsService()
    const calls = await callsService.getActiveCalls()

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

export async function POST(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  // POST is not supported for active-calls - it's a read-only endpoint
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch active calls.' },
    { status: 405 }
  )
}
