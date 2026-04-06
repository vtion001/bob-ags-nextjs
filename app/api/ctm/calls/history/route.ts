import { NextRequest, NextResponse } from 'next/server'
import { CallsService } from '@/lib/ctm/services/calls'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')
    const hours = parseInt(searchParams.get('hours') || '8760', 10)

    if (!phone) {
      return NextResponse.json(
        { error: 'phone parameter is required' },
        { status: 400 }
      )
    }

    const callsService = new CallsService()
    const calls = await callsService.searchCallsByPhone(phone, hours)

    return NextResponse.json({
      success: true,
      calls
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch call history from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
