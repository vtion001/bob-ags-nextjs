import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mmrhryddyjjkyhstytox.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcmhyeWRkeWpqa3loc3R5dG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkzODY2MywiZXhwIjoyMDg5NTE0NjYzfQ.8F-xTH3W6A3Av-Spi3jYJiSQymgW9Bs9jQspQiA4KYY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function fixQAUser() {
  const email = 'allyssa@allianceglobalsolutions.com'

  // First check current state
  console.log('Checking current state for:', email)

  const { data: userRole, error: findError } = await supabaseAdmin
    .from('user_roles')
    .select('*')
    .ilike('email', email)
    .single()

  if (findError) {
    console.log('No user_roles entry found, creating one...')
  } else {
    console.log('Current user_roles entry:', userRole)
  }

  // Get user from auth.users
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const authUser = authUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!authUser) {
    console.error('User not found in auth.users - they need to sign up first')
    process.exit(1)
  }

  console.log('Auth user ID:', authUser.id)

  // Update or create user_roles entry with QA role and full permissions
  const qaPermissions = {
    can_view_calls: true,
    can_view_monitor: true,
    can_view_history: true,
    can_view_agents: true,
    can_manage_settings: false,
    can_manage_users: false,
    can_run_analysis: true,
  }

  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .upsert({
      user_id: authUser.id,
      email: email.toLowerCase(),
      role: 'qa',
      permissions: qaPermissions,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating user_roles:', error.message)
    process.exit(1)
  }

  console.log('Successfully updated user_roles:')
  console.log('  role:', data.role)
  console.log('  permissions:', JSON.stringify(data.permissions, null, 2))
}

fixQAUser()