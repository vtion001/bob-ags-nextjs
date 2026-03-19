import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { CTMClient } from '@/lib/ctm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctmClient = new CTMClient()
    const data = await ctmClient.getSchedules()

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM schedules error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules from CTM' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, times, timezone } = body

    const ctmClient = new CTMClient()
    const data = await ctmClient.createSchedule({
      name,
      times,
      timezone,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM create schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule in CTM' },
      { status: 500 }
    )
  }
}
