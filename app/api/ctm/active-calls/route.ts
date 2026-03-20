import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
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
    const calls = await ctmClient.calls.getActiveCalls()

    return NextResponse.json({ calls })
  } catch (error) {
    console.error('CTM active calls error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active calls from CTM' },
      { status: 500 }
    )
  }
}