/**
 * Seed script to create test users in Supabase Auth
 * Run: npx ts-node scripts/create-test-users.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  {
    email: 'allyssa@allianceglobalsolutions.com',
    password: 'allyssa2026@@',
    role: 'qa',
    metadata: { role: 'qa' }
  },
  {
    email: 'kiel@allianceglobalsolutions.com',
    password: 'kiel2026@@',
    role: 'viewer',
    metadata: { role: 'viewer' }
  },
  {
    email: 'jd@allianceglobalsolutions.com',
    password: 'jd2026@@',
    role: 'viewer',
    metadata: { role: 'viewer' }
  },
  {
    email: 'v.rodriguez@allianceglobalsolutions.com',
    password: 'vrodriguez2026@@',
    role: 'admin',
    metadata: { role: 'admin' }
  },
]

const rolePermissions: Record<string, any> = {
  admin: {
    can_view_calls: true,
    can_view_monitor: true,
    can_view_history: true,
    can_view_agents: true,
    can_manage_settings: true,
    can_manage_users: true,
    can_run_analysis: true,
  },
  qa: {
    can_view_calls: true,
    can_view_monitor: true,
    can_view_history: true,
    can_view_agents: true,
    can_manage_settings: false,
    can_manage_users: false,
    can_run_analysis: true,
  },
  viewer: {
    can_view_calls: true,
    can_view_monitor: true,
    can_view_history: false,
    can_view_agents: false,
    can_manage_settings: false,
    can_manage_users: false,
    can_run_analysis: false,
  },
  agent: {
    can_view_calls: false,
    can_view_monitor: true,
    can_view_history: false,
    can_view_agents: false,
    can_manage_settings: false,
    can_manage_users: false,
    can_run_analysis: false,
  },
}

async function createUser(user: typeof testUsers[0]) {
  console.log(`\nCreating user: ${user.email}`)

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === user.email)

    let userId: string

    if (existingUser) {
      console.log(`  User ${user.email} already exists with ID: ${existingUser.id}`)

      // Update the user's password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: user.password,
          email_confirm: true,
          user_metadata: user.metadata
        }
      )

      if (updateError) {
        console.error(`  ERROR updating password: ${updateError.message}`)
        // Continue anyway - the user might still work with existing password
      } else {
        console.log(`  Updated password`)
      }

      userId = existingUser.id
    } else {
      // Create the auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.metadata
      })

      if (authError) {
        console.error(`  ERROR creating auth user: ${authError.message}`)
        return false
      }

      userId = authData.user.id
      console.log(`  Created auth user with ID: ${userId}`)
    }

    // First delete any existing user_roles entry for this user
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    // Create user_roles entry
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        email: user.email.toLowerCase(),
        role: user.role,
        approved: true,
        permissions: rolePermissions[user.role],
      })

    if (roleError) {
      console.error(`  ERROR creating user_roles: ${roleError.message}`)
      return false
    }

    console.log(`  Created user_roles entry with role: ${user.role}`)

    // Create public.users entry
    await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: user.email.toLowerCase(),
        is_superadmin: user.role === 'admin',
      })

    console.log(`  Created users entry`)
    return true
  } catch (error) {
    console.error(`  ERROR: ${error}`)
    return false
  }
}

async function main() {
  console.log('Starting test user creation...')
  console.log(`Supabase URL: ${supabaseUrl}`)

  let successCount = 0
  for (const user of testUsers) {
    const success = await createUser(user)
    if (success) successCount++
  }

  console.log(`\n========================================`)
  console.log(`Created ${successCount}/${testUsers.length} users successfully`)
  console.log(`\nTest credentials:`)
  for (const user of testUsers) {
    console.log(`  ${user.role.padEnd(8)} - ${user.email} / ${user.password}`)
  }
}

main().catch(console.error)
