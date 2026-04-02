import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== 'ags-admin-fix-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const devEmail = 'agsdev@allianceglobalsolutions.com'

  // Use service role client to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Update user_roles to admin
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .update({ role: 'admin', approved: true })
    .eq('email', devEmail)

  if (roleError) {
    console.error('Role update error:', roleError)
    return NextResponse.json({ error: roleError.message }, { status: 500 })
  }

  // Update users to superadmin
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({ is_superadmin: true })
    .eq('email', devEmail)

  if (userError) {
    console.error('User update error:', userError)
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `${devEmail} is now a super admin`
  })
}