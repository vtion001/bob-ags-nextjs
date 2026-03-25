import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { supabase, response, cookieStorage } = await createServerSupabase(request)
  
  // Exchange code for session - cookies are set via callbacks
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

    await supabase.from('user_roles').insert({
      user_id: user.id,
      email: email,
      role: isDev ? 'admin' : 'viewer',
      approved: isDev ? true : false,
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

    // Also create public.users entry for OAuth users
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      is_superadmin: isDev,
    }, {
      onConflict: 'id',
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

  // Auto-lookup CTM agent and assign if not already assigned
  const { data: settings } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', user.id)
    .single()

  const currentSettings = settings?.settings || {}
  
  if (!currentSettings.ctm_agent_id) {
    try {
      const ctmClient = new CTMClient()
      const agents = await ctmClient.agents.getAgents()
      
      const match = agents.find(
        (agent) => agent.email?.toLowerCase() === user.email?.toLowerCase()
      )

      if (match) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            settings: {
              ...currentSettings,
              ctm_agent_id: match.id,
            },
            updated_at: new Date().toISOString(),
          })

        // Auto-create agent profile for this CTM agent
        const { data: existingProfile } = await supabase
          .from('agent_profiles')
          .select('id')
          .eq('agent_id', match.id)
          .single()

        if (!existingProfile) {
          await supabase.from('agent_profiles').insert({
            name: match.name || 'Unknown Agent',
            agent_id: match.id,
            email: match.email || null,
            phone: null,
            notes: `Auto-created for user ${user.email}`,
          })
        }
      }
    } catch (agentError) {
      console.error('CTM agent lookup error:', agentError)
    }
  } else {
    // If user already has ctm_agent_id, ensure agent profile exists
    try {
      const { data: existingProfile } = await supabase
        .from('agent_profiles')
        .select('id')
        .eq('agent_id', currentSettings.ctm_agent_id)
        .single()

      if (!existingProfile) {
        const ctmClient = new CTMClient()
        const agents = await ctmClient.agents.getAgents()
        const match = agents.find((agent) => agent.id === currentSettings.ctm_agent_id)

        if (match) {
          await supabase.from('agent_profiles').insert({
            name: match.name || 'Unknown Agent',
            agent_id: match.id,
            email: match.email || null,
            phone: null,
            notes: `Auto-created for user ${user.email}`,
          })
        }
      }
    } catch (profileError) {
      console.error('Agent profile creation error:', profileError)
    }
  }

  // Verify session is established via network request to Supabase
  const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()

  if (verifyError || !verifiedUser) {
    console.error('Session verification failed:', verifyError)
    return NextResponse.redirect(new URL('/?error=session_failed', request.url))
  }

  const redirectUrl = new URL(next, request.url)
  const redirectResponse = NextResponse.redirect(redirectUrl, 302)

  // Copy cookies from cookieStorage map (which was populated by set callbacks during exchangeCodeForSession)
  for (const [name, { value, options }] of cookieStorage.entries()) {
    redirectResponse.cookies.set(name, value, {
      httpOnly: options?.httpOnly ?? true,
      secure: options?.secure ?? true,
      sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
      path: options?.path ?? '/',
    })
  }

  return redirectResponse
}
