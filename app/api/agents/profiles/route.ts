import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

function isDevUser(request: NextRequest): boolean {
  // Check for original dev session cookie (from proxy)
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        return true
      }
    } catch {}
  }

  // Check for placeholder session set by proxy after it consumed sb-dev-session
  const sessionCookie = request.cookies.get('sb-session')
  if (sessionCookie?.value === 'dev-session-placeholder') {
    return true
  }

  return false
}

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null

    if (isDevUser(request)) {
      userId = DEV_BYPASS_UID
      console.log('[DEBUG] Dev user accessing agent profiles')
    } else {
      const supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
      console.log('[DEBUG] User:', user.email, 'accessing agent profiles')
    }

    // Use service role key to bypass RLS and get all agent profiles
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('[DEBUG] SUPABASE_URL:', supabaseUrl ? `SET (${supabaseUrl.substring(0, 20)}...)` : 'UNSET')
    console.log('[DEBUG] SERVICE_ROLE_KEY:', serviceKey ? `SET (${serviceKey.substring(0, 20)}...)` : 'UNSET')

    if (!supabaseUrl || !serviceKey) {
      console.error('[DEBUG] Missing env vars - cannot create admin client')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { persistSession: false } }
    )

    const { data: agents, error } = await supabaseAdmin
      .from('agent_profiles')
      .select('*')
      .order('name')

    console.log('[DEBUG] Query result - agents count:', agents?.length, 'error:', error)

    if (error) {
      console.error('Error fetching agent profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agent profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agents: agents || [],
    })
  } catch (error) {
    console.error('Agent profiles error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent profiles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null

    if (isDevUser(request)) {
      userId = DEV_BYPASS_UID
    } else {
      const supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    const body = await request.json()
    const { name, agent_id, email, phone, notes } = body

    // Use service role key to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: agent, error } = await supabaseAdmin
      .from('agent_profiles')
      .insert({
        user_id: userId,
        name,
        agent_id,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating agent profile:', error)
      return NextResponse.json(
        { error: 'Failed to create agent profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agent,
    })
  } catch (error) {
    console.error('Agent profile creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create agent profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    let userId: string | null = null

    if (isDevUser(request)) {
      userId = DEV_BYPASS_UID
    } else {
      const supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    const body = await request.json()
    const { id, name, agent_id, email, phone, notes } = body

    // Use service role key to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: agent, error } = await supabaseAdmin
      .from('agent_profiles')
      .update({
        name,
        agent_id,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating agent profile:', error)
      return NextResponse.json(
        { error: 'Failed to update agent profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agent,
    })
  } catch (error) {
    console.error('Agent profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent profile' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Agent profile ID is required' },
        { status: 400 }
      )
    }

    // Use service role key to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabaseAdmin
      .from('agent_profiles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting agent profile:', error)
      return NextResponse.json(
        { error: 'Failed to delete agent profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Agent profile deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent profile' },
      { status: 500 }
    )
  }
}