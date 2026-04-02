import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// All Phillies group agents - data confirmed from CTM API
const PHILLIES_AGENTS = [
  { id: 'USRD2D1DDFF2364DBAD42AE3C3C224F2C09', name: 'May Ligad Phillies', email: 'zhilah@allianceglobalsolutions.com' },
  { id: 'USR55221642AE3C3C224F2C09', name: 'Ann Jamorol Phillies', email: 'analyn@allianceglobalsolutions.com' },
  { id: 'USR59923242AE3C3C224F2C09', name: 'Pauline Aquino Phillies', email: 'pauline@allianceglobalsolutions.com' },
  { id: 'USR59923842AE3C3C224F2C09', name: 'Zac Castro Phillies', email: 'zachariah@allianceglobalsolutions.com' },
  { id: 'USRA9BCBA5AE2BE70B5B8AA7F171F594FDB', name: 'Jerieme Padoc Phillies', email: 'jerieme@allianceglobalsolutions.com' },
  { id: 'USRA9BCBA5AE2BE70B567400CA2D37E34DC', name: 'Francine Del Mundo Phillies', email: 'francine@allianceglobalsolutions.com' },
  { id: 'USRA9BCBA5AE2BE70B540BDB40B8B195546', name: 'Benjie Magbanua Phillies', email: 'benjie@allianceglobalsolutions.com' },
  { id: 'USRA9BCBA5AE2BE70B52534015726350E45', name: 'Patricia Aranes Phillies', email: 'patricia@allianceglobalsolutions.com' },
  { id: 'USRA9BCBA5AE2BE70B535B549A59E934320', name: 'Luke Flores Phillies', email: 'luke@allianceglobalsolutions.com' },
  { id: 'USRFAA35D88A1D51842D3EF08F497B25B9A', name: 'Anjo Aquino Phillies', email: 'anjo@allianceglobalsolutions.com' },
  { id: 'USR606009BC8AF41AD2856B590114A37B63', name: 'Kiel Asiniero Phillies', email: 'kiel@allianceglobalsolutions.com' },
  { id: 'USR606009BC8AF41AD212083737D790659E', name: 'JM Dequilla Phillies', email: 'jessa@allianceglobalsolutions.com' },
  { id: 'USR72A09B59AD9DB496EE20EF234C20DDB8', name: 'Mary Arellano Phillies', email: 'mary.ann@allianceglobalsolutions.com' },
  { id: 'USR6D4A7D521EA700417D8B46E4285A730A', name: 'Jasmin Amistoso Phillies', email: 'jasmin@allianceglobalsolutions.com' },
  { id: 'USR6D4A7D521EA700411CBF6FFBAA60758C', name: 'Jhon Denver Manongdo Phillies', email: 'jd@allianceglobalsolutions.com' },
  { id: 'USR6D4A7D521EA70041C3BD219F7E668378', name: 'Alfred Mariano Phillies', email: 'alfred@allianceglobalsolutions.com' },
  { id: 'USR6D4A7D521EA700415FDBD912DF24A802', name: 'Karen Perez Phillies', email: 'karen@allianceglobalsolutions.com' },
]

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== 'ags-admin-fix-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const results = []

    for (const agent of PHILLIES_AGENTS) {
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
          email: agent.email,
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