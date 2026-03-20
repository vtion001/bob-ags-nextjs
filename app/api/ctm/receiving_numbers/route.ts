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
    const data = await ctmClient.receivingNumbers.getReceivingNumbers()

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM receiving numbers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receiving numbers from CTM' },
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
    const { number, name } = body

    if (!number) {
      return NextResponse.json(
        { error: 'number is required' },
        { status: 400 }
      )
    }

    const ctmClient = new CTMClient()
    const data = await ctmClient.receivingNumbers.createReceivingNumber(number, name || '')

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM create receiving number error:', error)
    return NextResponse.json(
      { error: 'Failed to create receiving number in CTM' },
      { status: 500 }
    )
  }
}
