import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const { supabase } = await createServerSupabase(request)
      // MUST use getSession() to refresh cookies
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
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
