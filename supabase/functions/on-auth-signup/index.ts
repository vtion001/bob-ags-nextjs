const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface UserMetadata {
  email?: string
  name?: string
  avatar_url?: string
}

interface AuthUser {
  id: string
  email: string
  user_metadata: UserMetadata
}

Deno.serve(async (req) => {
  try {
    const { type, user } = await req.json()

    if (type !== 'user.created') {
      return new Response(
        JSON.stringify({ message: 'Event type not handled' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const authUser = user as AuthUser
    const userId = authUser.id
    const email = authUser.email || authUser.user_metadata?.email

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const defaultPermissions = {
      can_view_calls: true,
      can_view_monitor: true,
      can_view_history: false,
      can_view_agents: false,
      can_manage_settings: false,
      can_manage_users: false,
      can_run_analysis: false,
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: userId,
        email: email,
        role: 'viewer',
        permissions: defaultPermissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error creating user role:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to create user role' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User role created for ${email}`)

    return new Response(
      JSON.stringify({ success: true, userId, email }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in on-auth-signup function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
