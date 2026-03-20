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
    const data = await ctmClient.sources.getSources()

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM sources error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sources from CTM' },
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
    const { name, online, referring_url, landing_url, position } = body

    const ctmClient = new CTMClient()
    const data = await ctmClient.sources.createSource({
      name,
      online: online || '1',
      referring_url: referring_url || '',
      landing_url: landing_url || '',
      position: position?.toString() || '1',
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM create source error:', error)
    return NextResponse.json(
      { error: 'Failed to create source in CTM' },
      { status: 500 }
    )
  }
}
