import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null

    if (isDevUser(request)) {
      userId = DEV_BYPASS_UID
      console.log('[DEBUG] Dev user accessing agent profiles')
    } else {
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      const user = session.user
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
        { error: 'Server configuration error', supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey },
        { status: 500 }
      )
    }

    let supabaseAdmin
    try {
      supabaseAdmin = createClient(
        supabaseUrl,
        serviceKey,
        { auth: { persistSession: false } }
      )
    } catch (err) {
      console.error('[DEBUG] Failed to create admin client:', err)
      return NextResponse.json(
        { error: 'Failed to initialize database client' },
        { status: 500 }
      )
    }

    let agents, error
    try {
      const result = await supabaseAdmin
        .from('agent_profiles')
        .select('*')
        .order('name')
      agents = result.data
      error = result.error
    } catch (err) {
      console.error('[DEBUG] Query threw exception:', err)
      return NextResponse.json(
        { error: 'Database query failed', detail: String(err) },
        { status: 500 }
      )
    }

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
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = session.user.id
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
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = session.user.id
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
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get('id') ?? undefined

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