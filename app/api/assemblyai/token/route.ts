import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

function isDevUser(request: NextRequest): boolean {
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        return true
      }
    } catch {}
  }
  const sessionCookie = request.cookies.get('sb-session')
  if (sessionCookie?.value === 'dev-session-placeholder') {
    return true
  }
  return false
}

export async function GET(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const supabase = await createServerSupabase(request)
      // MUST use getSession() to refresh cookies
      const { data: { user } } = await supabase.auth.getSession()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // AssemblyAI token requires external API - return empty in standalone mode
    return NextResponse.json({
      success: true,
      token: ''
    })
  } catch (error) {
    console.error('AssemblyAI token error:', error)
    return NextResponse.json(
      { error: 'Failed to get AssemblyAI token' },
      { status: 500 }
    )
  }
}
