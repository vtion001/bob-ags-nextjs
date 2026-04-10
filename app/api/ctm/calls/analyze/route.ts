import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CallsService } from '@/lib/ctm/services/calls'
import { isDevUser } from '@/lib/auth/is-dev-user'
import { evaluateRubric, calculateBreakdown, calculateScore } from '@/lib/ai/scoring'
import { generateTags, getDisposition, generateSummary } from '@/lib/ai/generation'

async function getTranscriptFromAssemblyAI(callId: string): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY || process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured')
  }

  // Get CTM credentials
  const accountId = process.env.CTM_ACCOUNT_ID
  const accessKey = process.env.CTM_ACCESS_KEY
  const secretKey = process.env.CTM_SECRET_KEY

  if (!accountId || !accessKey || !secretKey) {
    throw new Error('CTM credentials not configured')
  }

  const authHeader = Buffer.from(`${accessKey}:${secretKey}`).toString('base64')

  // First, get the call details to find the SID and recording URL
  const callUrl = `https://api.calltrackingmetrics.com/api/v1/accounts/${accountId}/calls/${callId}.json`
  const callResponse = await fetch(callUrl, {
    headers: { 'Authorization': `Basic ${authHeader}` },
  })

  if (!callResponse.ok) {
    throw new Error(`CTM call lookup error: ${callResponse.status}`)
  }

  const callData = await callResponse.json()
  const sid = callData.sid
  const recordingUrl = callData.audio || callData.recording_url

  if (!recordingUrl && !sid) {
    throw new Error('No recording available for this call')
  }

  // If we have the full recording URL already, use it; otherwise construct from SID
  const audioSourceUrl = recordingUrl || `https://app.calltrackingmetrics.com/api/v1/accounts/${accountId}/calls/${sid}/recording`

  // Fetch audio directly from CTM (with auth) - this handles the 303 redirect to S3
  const ctmResponse = await fetch(audioSourceUrl, {
    headers: { 'Authorization': `Basic ${authHeader}` },
    redirect: 'follow',
  })

  if (!ctmResponse.ok) {
    throw new Error(`CTM recording error: ${ctmResponse.status}`)
  }

  const audioBuffer = await ctmResponse.arrayBuffer()
  const contentType = ctmResponse.headers.get('Content-Type') || 'audio/wav'

  // Upload to AssemblyAI
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': contentType,
    },
    body: audioBuffer,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(`AssemblyAI upload error: ${errorText}`)
  }

  const uploadData = await uploadResponse.json()
  const audioUrl = uploadData.upload_url

  // Submit for transcription
  const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_models: ['universal-2'],
      punctuate: true,
      format_text: true,
    }),
  })

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    throw new Error(`AssemblyAI submit error: ${errorText}`)
  }

  const submitData = await submitResponse.json()
  const transcriptId = submitData.id

  // Poll for completion
  const maxAttempts = 60
  let attempts = 0

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000))

    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'Authorization': apiKey,
      },
    })

    if (!statusResponse.ok) {
      attempts++
      continue
    }

    const statusData = await statusResponse.json()

    if (statusData.status === 'completed') {
      return statusData.text || ''
    } else if (statusData.status === 'error') {
      throw new Error(`Transcription error: ${statusData.error}`)
    }

    attempts++
  }

  throw new Error('Transcription timed out')
}

async function analyzeWithOpenAI(transcript: string, phone: string, ctmStarRating?: number) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are a quality assurance analyst for a substance abuse helpline. Analyze the following call transcript and evaluate it against each criterion.

For EACH of the 22 evaluated criteria below, respond with PASS or FAIL and a brief reason. For criteria 4.2, 4.3, 4.4, mark as N/A (these require manual Salesforce verification).

Return your response in this exact format for each criterion (one per line):
CRITERION_ID|PASS/FAIL|N/A|Brief reason

Criteria:
1.1 Opening - Used approved greeting: Agent says "Hello Flyland, this is [Agent Name]"
1.2 Opening - Confirmed caller name and relationship (Applicable for treatment and facility inquiry calls; N/A if meeting call)
1.3 Opening - Identified reason for call promptly (first 30 seconds) without assumptions
1.4 Opening - Verified caller location (state) - agent asks and repeats back state
2.1 Probing - Asked about sober/clean time using "When was your last drink or drug use?"
2.2 Probing - Inquired about substance/type of struggle (no advice given)
2.3 Probing - Asked about insurance type: "private through work/family or state like Medicaid/Medicare?"
2.4 Probing - Gathered additional relevant info concisely (3 turns or fewer)
2.5 Probing - Verified caller phone number for follow-up
3.1 Qualification - Correctly assessed eligibility and action
3.2 Qualification - Handled caller-specific needs correctly (treatment/Al-Anon/facility/other)
3.3 Qualification - Used approved rebuttals/scripts for refusals
3.4 Qualification - Avoided unqualified transfers (ZTP - Auto-FAIL if violated)
3.5 Qualification - Escalated qualified leads promptly (within 60 seconds)
3.6 Qualification - Provided correct referrals for non-qualifying cases
3.7 Qualification - Maintained empathy (uses name 2x+, empathetic statements)
4.1 Closing - Ended call professionally with clear next steps
4.2 Closing - Documented in Salesforce within 5 minutes (N/A - requires manual Salesforce verification)
4.3 Closing - Applied correct star rating based on CTM recording (N/A - requires manual Salesforce verification)
4.4 Closing - Noted follow-up/callback requests (N/A - requires manual Salesforce verification)
5.1 Compliance - Upheld patient confidentiality (HIPAA) (ZTP - Auto-FAIL if violated)
5.2 Compliance - Avoided providing medical advice (ZTP - Auto-FAIL if violated)
5.3 Compliance - Maintained response time (under 30 seconds)
5.4 Compliance - Demonstrated soft skills (active listening, clear communication)
5.5 Compliance - Adhered to SOP/tools (used CTM/ZohoChat only)

TRANSCRIPT:
---
${transcript}
---

Return exactly 25 lines, one for each criterion in order. For 4.2, 4.3, 4.4 use N/A as the status.`
      }],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

function parseRubricResults(content: string): Record<string, { pass: boolean; details: string; na?: boolean }> {
  const results: Record<string, { pass: boolean; details: string; na?: boolean }> = {}
  const lines = content.split('\n').filter(l => l.trim())
  for (const line of lines) {
    const parts = line.split('|')
    if (parts.length >= 3) {
      const id = parts[0].trim()
      const status = parts[1].trim().toUpperCase()
      const isNA = status === 'N/A'
      const details = parts.slice(2).join('|').trim()
      if (/^\d+\.\d+$/.test(id)) {
        results[id] = {
          pass: isNA ? true : status === 'PASS',
          details: details.substring(0, 200),
          na: isNA ? true : undefined
        }
      }
    }
  }
  return results
}

export async function GET(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const { supabase } = await createServerSupabase(request)
      // MUST use getSession() to refresh cookies
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Call analysis requires external AI service - return empty in standalone mode
    return NextResponse.json({
      success: true,
      calls: []
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze calls' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const { supabase } = await createServerSupabase(request)
      // MUST use getSession() to refresh cookies
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { callIds } = body

    if (!callIds || !Array.isArray(callIds) || callIds.length === 0) {
      return NextResponse.json({ error: 'callIds array is required' }, { status: 400 })
    }

    const callsService = new CallsService()
    const results = []

    for (const callId of callIds) {
      try {
        // Get call details from CTM
        const call = await callsService.getCall(callId)
        if (!call) {
          results.push({ callId, success: false, error: 'Call not found' })
          continue
        }

        // Get transcript - first try CTM, then AssemblyAI
        let transcript = ''
        const ctmTranscript = await callsService.getCallTranscript(callId)
        if (ctmTranscript) {
          transcript = ctmTranscript
        } else if (call.recordingUrl) {
          // Use AssemblyAI to transcribe the recording
          try {
            transcript = await getTranscriptFromAssemblyAI(callId)
          } catch (transcribeErr) {
            const errMsg = transcribeErr instanceof Error ? transcribeErr.message : String(transcribeErr)
            results.push({ callId, success: false, error: `Transcription failed: ${errMsg}` })
            continue
          }
        }

        if (!transcript) {
          results.push({ callId, success: false, error: 'No transcript available' })
          continue
        }

        // Get AI evaluation from OpenAI
        const aiContent = await analyzeWithOpenAI(transcript, call.phone || '', call.starRating)
        const aiResults = parseRubricResults(aiContent)
        const evaluatedResults = evaluateRubric(transcript.toLowerCase(), aiResults)
        const { breakdown, ztpFailures, autoFailed } = calculateBreakdown(evaluatedResults)
        const score = calculateScore(breakdown, ztpFailures, autoFailed)

        // Detect insurance and state
        const lower = transcript.toLowerCase()
        let detectedInsurance = ''
        if (lower.includes('medicaid')) detectedInsurance = 'medicaid'
        else if (lower.includes('medicare')) detectedInsurance = 'medicare'
        else if (lower.includes('tricare')) detectedInsurance = 'tricare'
        else if (lower.includes('kaiser')) detectedInsurance = 'kaiser'
        else if (lower.includes('private') || lower.includes('blue cross') || lower.includes('aetna') || lower.includes('cigna') || lower.includes('united')) detectedInsurance = 'private'
        else if (lower.includes('self pay') || lower.includes('self-pay')) detectedInsurance = 'self-pay'

        const US_STATES = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
        let detectedState = ''
        for (const state of US_STATES) {
          if (lower.includes(state)) {
            detectedState = state.charAt(0).toUpperCase() + state.slice(1)
            break
          }
        }

        const tags = generateTags(evaluatedResults, score, detectedInsurance, detectedState)
        const sentiment = score >= 70 ? 'positive' : score >= 40 ? 'neutral' : 'negative'
        const disposition = getDisposition(evaluatedResults, score, autoFailed)
        const summary = generateSummary(evaluatedResults, score, autoFailed)

        const analysis = {
          score,
          sentiment,
          summary,
          tags,
          disposition,
          rubric_results: evaluatedResults,
          rubric_breakdown: breakdown,
          call_type: lower.includes('al-anon') || lower.includes('family') ? 'al-anon' : lower.includes('facility') || lower.includes('treatment center') ? 'facility' : lower.includes('looking for help') || lower.includes('addiction') ? 'treatment' : 'general',
          detected_state: detectedState,
          detected_insurance: detectedInsurance,
        }

        results.push({
          callId,
          success: true,
          analysis,
          transcript
        })
      } catch (err) {
        results.push({ callId, success: false, error: err instanceof Error ? err.message : 'Analysis failed' })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze call' },
      { status: 500 }
    )
  }
}
