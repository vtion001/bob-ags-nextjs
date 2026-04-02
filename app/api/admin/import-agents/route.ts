import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { AgentsService } from '@/lib/ctm/services/agents'

const AGENTS_TO_IMPORT = [
  'May Ligad Phillies',
  'JM Dequilla Phillies',
  'Kiel Asiniero Phillies',
  'Jhon Denver Manongdo Phillies',
  'Anjo Aquino Phillies',
  'Francine Del Mundo Phillies',
  'Pauline Aquino Phillies',
  'Mary Arellano Phillies',
  'Zac Castro Phillies',
  'Benjie Magbanua Phillies',
  'Jerieme Padoc Phillies',
  'Patricia Aranes Phillies',
  'Ann Jamorol Phillies',
  'Jasmin Amistoso Phillies',
  'Luke Flores Phillies',
  'Karen Perez Phillies',
]

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== 'ags-admin-fix-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch CTM agents
    const agentsService = new AgentsService()
    const ctmAgents = await agentsService.getAgents()

    console.log('[Import Agents] Total CTM agents:', ctmAgents.length)

    // Match agents by name
    const matchedAgents = ctmAgents.filter(agent =>
      AGENTS_TO_IMPORT.some(name =>
        agent.name?.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(agent.name?.toLowerCase() || '')
      )
    )

    console.log('[Import Agents] Matched agents:', matchedAgents)

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const results = []
    for (const agent of matchedAgents) {
      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from('agent_profiles')
        .select('id')
        .eq('agent_id', agent.id)
        .single()

      if (existing) {
        results.push({ name: agent.name, status: 'already_exists', id: agent.id })
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
        console.error('[Import Agents] Insert error for', agent.name, insertError)
        results.push({ name: agent.name, status: 'error', error: insertError.message })
      } else {
        results.push({ name: agent.name, status: 'imported', id: agent.id })
      }
    }

    // Also check for unmatched names
    const matchedNames = matchedAgents.map(a => a.name)
    const unmatched = AGENTS_TO_IMPORT.filter(
      name => !matchedNames.some(m => m.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(m?.toLowerCase()))
    )

    return NextResponse.json({
      success: true,
      imported: results.filter(r => r.status === 'imported').length,
      alreadyExists: results.filter(r => r.status === 'already_exists').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
      unmatched,
    })
  } catch (error) {
    console.error('[Import Agents] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}