import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export interface LiveAnalysisLog {
  id: string
  user_id: string
  call_id: string | null
  call_phone: string | null
  call_direction: string | null
  call_timestamp: string | null
  suggested_disposition: string | null
  insights: LiveInsight[]
  transcript_preview: string | null
  created_at: string
}

export interface LiveInsight {
  id: string
  type: 'insight' | 'suggestion' | 'warning' | 'disposition'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: number
}

// GET - Retrieve live analysis logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const callId = searchParams.get('callId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('live_analysis_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (callId) {
      query = query.eq('call_id', callId)
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('[LiveAnalysisLogs] Error fetching logs:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      count: logs?.length || 0,
    })
  } catch (error) {
    console.error('[LiveAnalysisLogs] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

// POST - Store a new live analysis log
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      callId,
      callPhone,
      callDirection,
      callTimestamp,
      suggestedDisposition,
      insights,
      transcriptPreview,
    } = body

    const { data: log, error } = await supabase
      .from('live_analysis_logs')
      .insert({
        user_id: user.id,
        call_id: callId || null,
        call_phone: callPhone || null,
        call_direction: callDirection || null,
        call_timestamp: callTimestamp || null,
        suggested_disposition: suggestedDisposition || null,
        insights: insights || [],
        transcript_preview: transcriptPreview ? transcriptPreview.slice(0, 500) : null,
      })
      .select()
      .single()

    if (error) {
      console.error('[LiveAnalysisLogs] Error storing log:', error)
      return NextResponse.json({ error: 'Failed to store log' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      log,
    })
  } catch (error) {
    console.error('[LiveAnalysisLogs] Error:', error)
    return NextResponse.json({ error: 'Failed to store log' }, { status: 500 })
  }
}

// DELETE - Clear all logs for a user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('live_analysis_logs')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('[LiveAnalysisLogs] Error deleting logs:', error)
      return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[LiveAnalysisLogs] Error:', error)
    return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 })
  }
}