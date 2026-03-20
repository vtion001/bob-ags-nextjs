import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctmClient = new CTMClient()
    const data = await ctmClient.schedules.getSchedules()

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
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, times, timezone } = body

    const ctmClient = new CTMClient()
    const data = await ctmClient.schedules.createSchedule({
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
