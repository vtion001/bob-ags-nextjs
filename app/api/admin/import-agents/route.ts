import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CTMClient } from '@/lib/ctm/client'

// All working Phillies group agent UIDs
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
    const ctmClient = new CTMClient()
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const results = []

    for (const { uid, name } of PHILLIES_AGENTS) {
      try {
        const agentData = await ctmClient.makeRequest<{ agent?: { id: string; uid: number; name: string; email: string } }>(
          `/accounts/${ctmClient.accountId}/agents/${uid}.json`
        )

        const agent = agentData.agent
        if (!agent) {
          results.push({ uid, name, status: 'not_found' })
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
      } catch (err) {
        console.error('[Import] Error fetching UID:', uid, err)
        results.push({ uid, name, status: 'error' })
      }
    }

    return NextResponse.json({
      success: true,
      total: PHILLIES_AGENTS.length,
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