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

async function createOrUpdateSuperadmin() {
  const email = 'v.rodriguez@allianceglobalsolutions.com'
  const password = 'Vrod2026@@' // New password for v.rodriguez

  // First, try to find existing user by email
  const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError.message)
  } else {
    const existingUser = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      console.log('User exists, updating password...')
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true
      })
      if (error) {
        console.error('Error updating user:', error.message)
        process.exit(1)
      }
      console.log('Password updated successfully!')
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
      return
    }
  }

  // User doesn't exist, create new
  console.log('Creating new superadmin user...')
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'superadmin',
      name: 'V. Rodriguez'
    }
  })

  if (error) {
    console.error('Error creating user:', error.message)
    process.exit(1)
  }

  console.log('Superadmin user created successfully!')
  console.log('User ID:', data.user.id)
  console.log('Email:', data.user.email)
}

createOrUpdateSuperadmin()