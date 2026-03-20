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
    const data = await ctmClient.accounts.getAccounts()

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM accounts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts from CTM' },
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
    const { name, timezoneHint } = body

    const ctmClient = new CTMClient()
    const data = await ctmClient.accounts.createAccount(name, timezoneHint)

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM create account error:', error)
    return NextResponse.json(
      { error: 'Failed to create account in CTM' },
      { status: 500 }
    )
  }
}
