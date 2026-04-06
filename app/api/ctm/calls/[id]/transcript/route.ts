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
    const transcript = await callsService.getCallTranscript(id)

    return NextResponse.json({
      success: true,
      transcript
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transcript from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
