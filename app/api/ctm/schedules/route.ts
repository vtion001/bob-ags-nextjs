import { NextRequest, NextResponse } from 'next/server'
import { SchedulesService } from '@/lib/ctm/services/schedules'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const schedulesService = new SchedulesService()
    const data = await schedulesService.getSchedules()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch schedules from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const schedulesService = new SchedulesService()
    const data = await schedulesService.createSchedule(body)

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create schedule in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
