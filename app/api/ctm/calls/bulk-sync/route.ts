import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Bulk Sync] Starting bulk sync for user:', user.id)

    const ctmClient = new CTMClient()
    const callsPerPage = 100
    const maxPages = 100
    let allCalls: any[] = []
    let page = 1

    // Fetch all available calls from CTM
    console.log('[Bulk Sync] Fetching calls from CTM...')
    
    while (page <= maxPages) {
      const endpoint = `/accounts/${ctmClient.getAccountId()}/calls.json?limit=${callsPerPage}&hours=8760&page=${page}`
      
      try {
        const data = await ctmClient.makeRequest<{ calls?: any[] }>(endpoint)
        
        if (!data.calls || data.calls.length === 0) {
          console.log(`[Bulk Sync] Page ${page}: No more calls, stopping`)
          break
        }

        console.log(`[Bulk Sync] Page ${page}: fetched ${data.calls.length} calls`)
        allCalls.push(...data.calls)
        
        if (data.calls.length < callsPerPage) {
          console.log(`[Bulk Sync] Page ${page}: Less than ${callsPerPage} calls, stopping`)
          break
        }
        
        page++
      } catch (err) {
        console.error(`[Bulk Sync] Error on page ${page}:`, err)
        break
      }
    }

    console.log(`[Bulk Sync] Total calls fetched from CTM: ${allCalls.length}`)

    if (allCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calls found in CTM',
        callsSynced: 0,
      })
    }

    // Transform and store to Supabase
    const callsToStore = allCalls.map((c: any) => ({
      ctm_call_id: String(c.id),
      user_id: user.id,
      phone: c.phone_number || c.caller_number || null,
      direction: c.direction || 'inbound',
      duration: c.duration || 0,
      status: c.status || 'completed',
      timestamp: c.started_at || new Date().toISOString(),
      caller_number: c.caller_number || null,
      tracking_number: c.tracking_number || null,
      tracking_label: c.tracking_label || null,
      source: c.source || null,
      source_id: c.source_id ? String(c.source_id) : null,
      agent_id: c.agent?.id || null,
      agent_name: c.agent?.name || null,
      recording_url: c.audio || c.recording_url || null,
      transcript: c.transcript || null,
      city: c.city || null,
      state: c.state || null,
      postal_code: c.postal_code || null,
      synced_at: new Date().toISOString(),
    }))

    // Batch upsert - split into chunks of 500
    const chunkSize = 500
    let stored = 0
    
    for (let i = 0; i < callsToStore.length; i += chunkSize) {
      const chunk = callsToStore.slice(i, i + chunkSize)
      const { error } = await supabase
        .from('calls')
        .upsert(chunk, { onConflict: 'ctm_call_id' })
      
      if (error) {
        console.error(`[Bulk Sync] Error upserting chunk ${i}:`, error)
      } else {
        stored += chunk.length
        console.log(`[Bulk Sync] Stored ${stored}/${callsToStore.length} calls`)
      }
    }

    // Update sync log
    await supabase.from('calls_sync_log').insert({
      user_id: user.id,
      last_sync_at: new Date().toISOString(),
      calls_synced: stored,
      status: 'completed',
    })

    console.log(`[Bulk Sync] Complete. Total stored: ${stored}`)

    return NextResponse.json({
      success: true,
      message: `Synced ${stored} calls from CTM to Supabase`,
      callsSynced: stored,
      callsAvailable: allCalls.length,
    })
  } catch (error) {
    console.error('[Bulk Sync] Error:', error)
    return NextResponse.json({ error: 'Bulk sync failed' }, { status: 500 })
  }
}