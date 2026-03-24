import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'
import { invalidateCache } from '@/lib/api/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Bulk Sync] Starting bulk sync for user:', user.id)

    const ctmClient = new CTMClient()
    const allCalls = await ctmClient.calls.getCalls({ limit: 5000, hours: 8760 })

    console.log(`[Bulk Sync] Total calls fetched from CTM: ${allCalls.length}`)

    if (allCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calls found in CTM',
        callsSynced: 0,
      })
    }

    // Transform and store to Supabase
    const callsToStore = allCalls.map((c) => ({
      ctm_call_id: c.id,
      user_id: user.id,
      phone: c.phone || '',
      direction: c.direction || 'inbound',
      duration: c.duration || 0,
      status: c.status || 'completed',
      timestamp: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString(),
      caller_number: c.callerNumber || null,
      tracking_number: c.trackingNumber || null,
      tracking_label: c.trackingLabel || null,
      source: c.source || null,
      source_id: c.sourceId ? String(c.sourceId) : null,
      agent_id: c.agent?.id || null,
      agent_name: c.agent?.name || null,
      recording_url: c.recordingUrl || null,
      transcript: c.transcript || null,
      city: c.city || null,
      state: c.state || null,
      postal_code: c.postalCode || null,
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

    invalidateCache(`ctm:dashboardStats:${user.id}`)

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