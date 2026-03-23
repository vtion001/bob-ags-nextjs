import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const supabase = await createServerSupabase(request)
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  // Auto-create user_roles entry for new OAuth users
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existingRole) {
    const email = user.email?.toLowerCase()
    const devEmail = 'agsdev@allianceglobalsolutions.com'
    const isDev = email === devEmail

    // Auto-create user_roles with appropriate approval status
    await supabase.from('user_roles').insert({
      user_id: user.id,
      email: email,
      role: isDev ? 'admin' : 'viewer',
      approved: isDev ? true : false, // Dev email auto-approved, others need admin approval
      permissions: {
        can_view_calls: true,
        can_view_monitor: true,
        can_view_history: true,
        can_view_agents: true,
        can_manage_settings: isDev,
        can_manage_users: isDev,
        can_run_analysis: true,
      },
    })
  }

  // Check if user is approved
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('approved')
    .eq('user_id', user.id)
    .single()

  if (userRole?.approved === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/?signup=pending', request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
