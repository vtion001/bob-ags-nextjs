import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { isDevUser } from '@/lib/auth/is-dev-user'
import { evaluateRubric, calculateBreakdown, calculateScore } from '@/lib/ai/scoring'
import { generateTags, getDisposition, generateSummary } from '@/lib/ai/generation'

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

export async function POST(request: NextRequest) {
  try {
    const { supabase, response } = await createServerSupabase(request)

    if (!isDevUser(request)) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { limit = 50, offset = 0 } = body

    // Fetch calls from Supabase that have transcripts but no scores
    const { data: calls, error: fetchError } = await supabase
      .from('calls')
      .select('id, ctm_call_id, phone, caller_number, transcript, agent_name, state')
      .not('transcript', 'is', null)
      .not('transcript', 'eq', '')
      .is('score', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Error fetching calls for bulk analysis:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch calls from Supabase' },
        { status: 500 }
      )
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calls found that need analysis',
        processed: 0,
        results: []
      })
    }

    const results = []
    let successCount = 0
    let failCount = 0

    for (const call of calls) {
      try {
        if (!call.transcript || call.transcript.trim() === '') {
          results.push({ callId: call.ctm_call_id, success: false, error: 'Empty transcript' })
          failCount++
          continue
        }

        // Get AI evaluation from OpenAI
        const aiContent = await analyzeWithOpenAI(call.transcript, call.phone || call.caller_number || '')
        const aiResults = parseRubricResults(aiContent)
        const evaluatedResults = evaluateRubric(call.transcript.toLowerCase(), aiResults)
        const { breakdown, ztpFailures, autoFailed } = calculateBreakdown(evaluatedResults)
        const score = calculateScore(breakdown, ztpFailures, autoFailed)

        // Detect insurance and state
        const lower = call.transcript.toLowerCase()
        let detectedInsurance = ''
        if (lower.includes('medicaid')) detectedInsurance = 'medicaid'
        else if (lower.includes('medicare')) detectedInsurance = 'medicare'
        else if (lower.includes('tricare')) detectedInsurance = 'tricare'
        else if (lower.includes('kaiser')) detectedInsurance = 'kaiser'
        else if (lower.includes('private') || lower.includes('blue cross') || lower.includes('aetna') || lower.includes('cigna') || lower.includes('united')) detectedInsurance = 'private'
        else if (lower.includes('self pay') || lower.includes('self-pay')) detectedInsurance = 'self-pay'

        const US_STATES = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming']
        let detectedState = call.state || ''
        if (!detectedState) {
          for (const state of US_STATES) {
            if (lower.includes(state)) {
              detectedState = state.charAt(0).toUpperCase() + state.slice(1)
              break
            }
          }
        }

        const tags = generateTags(evaluatedResults, score, detectedInsurance, detectedState)
        const sentiment = score >= 70 ? 'positive' : score >= 40 ? 'neutral' : 'negative'
        const disposition = getDisposition(evaluatedResults, score, autoFailed)
        const summary = generateSummary(evaluatedResults, score, autoFailed)

        // Update call in Supabase with analysis results
        const { error: updateError } = await supabase
          .from('calls')
          .update({
            score,
            sentiment,
            summary,
            tags,
            disposition,
            rubric_results: evaluatedResults,
            rubric_breakdown: breakdown,
            updated_at: new Date().toISOString()
          })
          .eq('id', call.id)

        if (updateError) {
          console.error(`Error updating call ${call.id}:`, updateError)
          results.push({ callId: call.ctm_call_id, success: false, error: updateError.message })
          failCount++
        } else {
          results.push({
            callId: call.ctm_call_id,
            success: true,
            score,
            sentiment,
            disposition
          })
          successCount++
        }
      } catch (err) {
        console.error(`Error analyzing call ${call.ctm_call_id}:`, err)
        results.push({ callId: call.ctm_call_id, success: false, error: err instanceof Error ? err.message : 'Analysis failed' })
        failCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed: calls.length,
      successCount,
      failCount,
      results
    })
  } catch (error) {
    console.error('Bulk analyze error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk analyze calls' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, response } = await createServerSupabase(request)

    if (!isDevUser(request)) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Get count of calls that need analysis
    const { count, error } = await supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .not('transcript', 'is', null)
      .not('transcript', 'eq', '')
      .is('score', null)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to count calls' },
        { status: 500 }
      )
    }

    // Get count of analyzed calls
    const { count: analyzedCount, error: analyzedError } = await supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .not('score', 'is', null)

    if (analyzedError) {
      return NextResponse.json(
        { error: 'Failed to count analyzed calls' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      unanalyzedCount: count || 0,
      analyzedCount: analyzedCount || 0
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get analysis status' },
      { status: 500 }
    )
  }
}
