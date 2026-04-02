import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AgentsService } from '@/lib/ctm/services/agents'

const PHILLIES_AGENTS = [
  { uid: 535923, name: 'May Ligad Phillies' },
  { uid: 552216, name: 'Ann Jamorol Phillies' },
  { uid: 599232, name: 'Pauline Aquino Phillies' },
  { uid: 599238, name: 'Zac Castro Phillies' },
  { uid: 779372, name: 'Jerieme Padoc Phillies' },
  { uid: 779375, name: 'Francine Del Mundo Phillies' },
  { uid: 779378, name: 'Benjie Magbanua Phillies' },
  { uid: 779381, name: 'Patricia Aranes Phillies' },
  { uid: 779387, name: 'Luke Flores Phillies' },
  { uid: 835207, name: 'Anjo Aquino Phillies' },
  { uid: 873789, name: 'Kiel Asiniero Phillies' },
  { uid: 873795, name: 'JM Dequilla Phillies' },
  { uid: 912540, name: 'Mary Arellano Phillies' },
  { uid: 937020, name: 'Jasmin Amistoso Phillies' },
  { uid: 937023, name: 'Jhon Denver Manongdo Phillies' },
  { uid: 937026, name: 'Alfred Mariano Phillies' },
  { uid: 937032, name: 'Karen Perez Phillies' },
]

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== 'ags-admin-fix-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const agentsService = new AgentsService()
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // First, get all agents to build a uid->agent map
    const allAgents = await agentsService.getAgents()
    console.log('[Import] Total CTM agents fetched:', allAgents.length)

    const agentByUid = new Map(allAgents.map(a => [a.uid, a])))
    const results = []

    for (const { uid, name } of PHILLIES_AGENTS) {
      const agent = agentByUid.get(uid)

      if (!agent) {
        console.log(`[Import] UID ${uid} (${name}) not found in agents list`)
        results.push({ uid, name, status: 'not_found_in_ctm' })
        continue
      }

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
          notes: `Auto-imported from CTM Phillies group on ${new Date().toISOString()}`,
        })

      if (insertError) {
        console.error('[Import] Insert error:', agent.name, insertError)
        results.push({ name: agent.name, email: agent.email, status: 'error', error: insertError.message })
      } else {
        results.push({ name: agent.name, email: agent.email, status: 'imported' })
      }
    }

    return NextResponse.json({
      success: true,
      total: PHILLIES_AGENTS.length,
      imported: results.filter(r => r.status === 'imported').length,
      alreadyExists: results.filter(r => r.status === 'already_exists').length,
      notFound: results.filter(r => r.status === 'not_found_in_ctm').length,
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