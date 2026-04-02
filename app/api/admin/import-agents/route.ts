import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { AgentsService } from '@/lib/ctm/services/agents'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== 'ags-admin-fix-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const agentsService = new AgentsService()
    const ctmAgents = await agentsService.getAgents()

    // Filter only AGS agents
    const agsAgents = ctmAgents.filter(a =>
      a.email?.includes('allianceglobalsolutions.com')
    )

    console.log('[Import AGS Agents] Found:', agsAgents.length)

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const results = []
    for (const agent of agsAgents) {
      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from('agent_profiles')
        .select('id')
        .eq('agent_id', agent.id)
        .single()

      if (existing) {
        results.push({ name: agent.name, email: agent.email, status: 'already_exists' })
        continue
      }

      // Insert new agent profile
      const { error: insertError } = await supabaseAdmin
        .from('agent_profiles')
        .insert({
          name: agent.name,
          agent_id: agent.id,
          email: agent.email || null,
          phone: null,
          notes: `Auto-imported from CTM on ${new Date().toISOString()}`,
        })

      if (insertError) {
        console.error('[Import Agents] Insert error:', agent.name, insertError)
        results.push({ name: agent.name, email: agent.email, status: 'error', error: insertError.message })
      } else {
        results.push({ name: agent.name, email: agent.email, status: 'imported' })
      }
    }

    return NextResponse.json({
      success: true,
      total: agsAgents.length,
      imported: results.filter(r => r.status === 'imported').length,
      alreadyExists: results.filter(r => r.status === 'already_exists').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
    })
  } catch (error) {
    console.error('[Import Agents] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}