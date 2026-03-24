import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'
import { fetchWithCache, invalidateCache } from '@/lib/api/cache'

const VOICE_MENUS_CACHE_TTL = 30000

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await fetchWithCache(
      'ctm:voice_menus',
      async () => {
        const ctmClient = new CTMClient()
        return ctmClient.voiceMenus.getVoiceMenus()
      },
      VOICE_MENUS_CACHE_TTL
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM voice menus error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voice menus from CTM' },
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
    const { name, play_message, input_maxkeys, input_timeout, prompt_retries, items } = body

    const ctmClient = new CTMClient()
    const data = await ctmClient.voiceMenus.createVoiceMenu({
      name,
      play_message,
      input_maxkeys,
      input_timeout,
      prompt_retries,
      items,
    })

    invalidateCache('ctm:voice_menus')

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM create voice menu error:', error)
    return NextResponse.json(
      { error: 'Failed to create voice menu in CTM' },
      { status: 500 }
    )
  }
}
