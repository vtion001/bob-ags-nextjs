import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctmClient = new CTMClient()
    const agents = await ctmClient.agents.getAgents()
    const userGroups = await ctmClient.agents.getUserGroups()

    return NextResponse.json({ 
      agents,
      userGroups 
    })
  } catch (error) {
    console.error('CTM agents error:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}