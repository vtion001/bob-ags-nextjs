import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'
import { analyzeTranscript } from '@/lib/ai'
import { invalidateCache } from '@/lib/api/cache'

async function transcribeWithAssemblyAI(audioUrl: string): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured')
  }

  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio_url: audioUrl, speech_models: ['universal-2'] }),
  })

  if (!transcriptResponse.ok) {
    throw new Error(`AssemblyAI error: ${await transcriptResponse.text()}`)
  }

  const transcriptJob = await transcriptResponse.json()
  
  while (true) {
    const pollingRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptJob.id}`, {
      headers: { 'Authorization': apiKey }
    })
    const result = await pollingRes.json()
    
    if (result.status === 'completed') return result.text || ''
    if (result.status === 'error') throw new Error(`AssemblyAI failed: ${result.error}`)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { callIds } = await request.json()

    if (!callIds || !Array.isArray(callIds) || callIds.length === 0) {
      return NextResponse.json(
        { error: 'callIds array is required' },
        { status: 400 }
      )
    }

    const ctmClient = new CTMClient()
    const results = []
    const callsToUpdate = []

    for (const callId of callIds) {
      try {
        const call = await ctmClient.calls.getCall(callId)
        
        if (!call) {
          results.push({ callId, success: false, error: 'Call not found' })
          continue
        }

        let transcript = call.transcript
        
        if (!transcript && call.recordingUrl) {
          try {
            transcript = await transcribeWithAssemblyAI(call.recordingUrl)
          } catch (transcribeErr) {
            console.error(`Transcription error for call ${callId}:`, transcribeErr)
            results.push({ 
              callId, 
              success: false, 
              error: transcribeErr instanceof Error ? transcribeErr.message : 'Transcription failed' 
            })
            continue
          }
        }
        
        if (!transcript) {
          const transcriptData = await ctmClient.calls.getCallTranscript(callId)
          transcript = transcriptData || undefined
        }

        if (!transcript) {
          results.push({ callId, success: false, error: 'No transcript available' })
          continue
        }

        const analysis = await analyzeTranscript(transcript, call.phone)
        
        const analysisResult = {
          score: analysis.qualification_score,
          sentiment: analysis.sentiment,
          summary: analysis.summary,
          tags: analysis.tags,
          disposition: analysis.suggested_disposition,
        }

        results.push({
          callId,
          success: true,
          analysis: {
            ...analysisResult,
            followUp: analysis.follow_up_required,
            rubric_results: analysis.rubric_results,
            rubric_breakdown: analysis.rubric_breakdown,
          },
        })

        // Queue the call for updating in Supabase
        callsToUpdate.push({
          ctm_call_id: callId,
          score: analysisResult.score,
          sentiment: analysisResult.sentiment,
          summary: analysisResult.summary,
          tags: analysisResult.tags,
          disposition: analysisResult.disposition,
          rubric_results: analysis.rubric_results,
          rubric_breakdown: analysis.rubric_breakdown,
        })
      } catch (err) {
        console.error(`Error analyzing call ${callId}:`, err)
        results.push({ callId, success: false, error: 'Analysis failed' })
      }
    }

    // Update all analyzed calls in Supabase
    if (callsToUpdate.length > 0) {
      for (const callUpdate of callsToUpdate) {
        await supabase
          .from('calls')
          .update({
            score: callUpdate.score,
            sentiment: callUpdate.sentiment,
            summary: callUpdate.summary,
            tags: callUpdate.tags,
            disposition: callUpdate.disposition,
            rubric_results: callUpdate.rubric_results || null,
            rubric_breakdown: callUpdate.rubric_breakdown || null,
            synced_at: new Date().toISOString(),
          })
          .eq('ctm_call_id', callUpdate.ctm_call_id)
          .eq('user_id', user.id)
      }
      
      invalidateCache(`ctm:dashboardStats:${user.id}`)
    }

    return NextResponse.json({
      success: true,
      results,
      analyzed: results.filter(r => r.success).length,
      updatedInCache: callsToUpdate.length,
    })
  } catch (error) {
    console.error('Bulk analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze calls' },
      { status: 500 }
    )
  }
}