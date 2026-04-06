import { NextRequest, NextResponse } from 'next/server'
import { CallsService } from '@/lib/ctm/services/calls'
import { authenticate } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const { id } = await params
    const callsService = new CallsService()
    const call = await callsService.getCall(id)

    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      call
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch call from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
