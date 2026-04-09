import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CallsService } from '@/lib/ctm/services/calls'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

function isDevUser(request: NextRequest): boolean {
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        return true
      }
    } catch {}
  }
  const sessionCookie = request.cookies.get('sb-session')
  if (sessionCookie?.value === 'dev-session-placeholder') {
    return true
  }
  return false
}

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

function evaluateRubric(
  lower: string,
  rubricCriteria: Array<{ id: string; name: string; category: string; severity: string; deduction: number; passPhrases: string[]; failPhrases: string[]; ztp: boolean; autoFail: boolean }>,
  aiResults: Record<string, { pass: boolean; details: string }>
): Array<{ id: string; criterion: string; pass: boolean; ztp: boolean; autoFail: boolean; details: string; deduction: number; severity: string; category: string; na?: boolean }> {
  const ALWAYS_NA_CRITERIA = ['4.2', '4.3', '4.4']

  function keywordMatch(criterion: typeof rubricCriteria[0]): boolean {
    const passCount = criterion.passPhrases.filter(p => lower.includes(p.toLowerCase())).length
    const failCount = criterion.failPhrases.filter(p => lower.includes(p.toLowerCase())).length
    if (criterion.ztp || criterion.autoFail) return failCount === 0
    return passCount > failCount
  }

  function generateDetails(criterion: typeof rubricCriteria[0]): string {
    const found = criterion.passPhrases.find(p => lower.includes(p.toLowerCase()))
    if (found) return `Detected: "${found}"`
    const missed = criterion.failPhrases.find(p => lower.includes(p.toLowerCase()))
    if (missed) return `Issue detected: "${missed}"`
    return criterion.ztp || criterion.autoFail ? 'No violations detected' : 'Not clearly detected in transcript'
  }

  return rubricCriteria.map(criterion => {
    if (ALWAYS_NA_CRITERIA.includes(criterion.id)) {
      return {
        id: criterion.id,
        criterion: criterion.name,
        pass: true,
        na: true,
        ztp: criterion.ztp,
        autoFail: criterion.autoFail,
        details: 'N/A - Requires manual Salesforce verification',
        deduction: 0,
        severity: criterion.severity,
        category: criterion.category,
      }
    }

    const aiResult = aiResults[criterion.id]
    const pass = aiResult ? aiResult.pass : keywordMatch(criterion)
    const details = aiResult?.details || generateDetails(criterion)
    return {
      id: criterion.id,
      criterion: criterion.name,
      pass,
      ztp: criterion.ztp,
      autoFail: criterion.autoFail,
      details,
      deduction: pass ? 0 : criterion.deduction,
      severity: criterion.severity,
      category: criterion.category,
    }
  })
}

function calculateBreakdown(results: ReturnType<typeof evaluateRubric>) {
  const breakdown = {
    opening_score: 0, opening_max: 0,
    probing_score: 0, probing_max: 0,
    qualification_score_detail: 0, qualification_max: 0,
    closing_score: 0, closing_max: 0,
    compliance_score: 0, compliance_max: 0
  }
  let ztpFailures = 0
  let autoFailed = false

  for (const r of results) {
    if (r.na) continue
    const points = r.ztp ? 10 : r.severity === 'Minor' ? 2 : r.severity === 'Major' ? 5 : 0
    const key = r.category === 'Opening' ? 'opening' :
                 r.category === 'Probing' ? 'probing' :
                 r.category === 'Qualification' ? 'qualification' :
                 r.category === 'Closing' ? 'closing' : 'compliance'
    const scoreKey = `${key}_score` as keyof typeof breakdown
    const maxKey = `${key}_max` as keyof typeof breakdown
    breakdown[maxKey] += points
    if (r.pass) breakdown[scoreKey] += points
    if (r.ztp && !r.pass) ztpFailures++
    if (r.autoFail && !r.pass) autoFailed = true
  }

  return { breakdown, ztpFailures, autoFailed }
}

function calculateScore(breakdown: ReturnType<typeof calculateBreakdown>['breakdown'], ztpFailures: number, autoFailed: boolean): number {
  if (autoFailed || ztpFailures >= 2) return 0
  const totalMax = breakdown.opening_max + breakdown.probing_max + breakdown.qualification_max + breakdown.closing_max + breakdown.compliance_max
  const totalScore = breakdown.opening_score + breakdown.probing_score + breakdown.qualification_score_detail + breakdown.closing_score + breakdown.compliance_score
  if (totalMax === 0) return 50
  return Math.round((totalScore / totalMax) * 100)
}

const RUBRIC_CRITERIA = [
  { id: '1.1', name: 'Used approved greeting', category: 'Opening', severity: 'Minor', deduction: 2, passPhrases: ['hello flyland', 'flyland this is'], failPhrases: ['hi there', 'flyland help line'], ztp: false, autoFail: false },
  { id: '1.2', name: 'Confirmed caller name and relationship', category: 'Opening', severity: 'Minor', deduction: 2, passPhrases: ["what's your name", 'can i get your name', 'may i have your name'], failPhrases: [], ztp: false, autoFail: false, naTriggers: ['facility inquiry'] },
  { id: '1.3', name: 'Identified reason for call promptly', category: 'Opening', severity: 'Major', deduction: 5, passPhrases: ['how can i help', 'what brings you', 'reason for your call'], failPhrases: ['assumed reason', 'jumped to questions'], ztp: false, autoFail: false },
  { id: '1.4', name: 'Verified caller location (state)', category: 'Opening', severity: 'Major', deduction: 5, passPhrases: ['what state', 'which state', 'located in', 'state are you'], failPhrases: ['never asks state'], ztp: false, autoFail: false },
  { id: '2.1', name: 'Asked about sober/clean time', category: 'Probing', severity: 'Major', deduction: 5, passPhrases: ['last drink', 'last drug use', 'when was your last', 'how long has it been'], failPhrases: ['how long sober', 'skips time'], ztp: false, autoFail: false },
  { id: '2.2', name: 'Inquired about substance/type of struggle', category: 'Probing', severity: 'Major', deduction: 5, passPhrases: ['what substance', 'struggling with', 'alcohol drugs', 'drug or alcohol'], failPhrases: ['gives detox advice'], ztp: false, autoFail: false },
  { id: '2.3', name: 'Asked about insurance type and details', category: 'Probing', severity: 'Major', deduction: 5, passPhrases: ['type of insurance', 'private or state', 'medicaid', 'medicare', 'insurance do you have'], failPhrases: ['only asks do you have insurance', 'skips insurance'], ztp: false, autoFail: false },
  { id: '2.4', name: 'Gathered additional info concisely', category: 'Probing', severity: 'Minor', deduction: 2, passPhrases: ['openness to help', 'facility name', 'follow-up'], failPhrases: ['probes too many times', 'repeated questions'], ztp: false, autoFail: false },
  { id: '2.5', name: 'Verified caller phone number', category: 'Probing', severity: 'Minor', deduction: 2, passPhrases: ['best number', 'phone number', 'reach you'], failPhrases: ['skips phone when needed'], ztp: false, autoFail: false },
  { id: '3.1', name: 'Correctly assessed eligibility', category: 'Qualification', severity: 'Major', deduction: 5, passPhrases: ['transferring you', 'referring to', 'qualified'], failPhrases: ['wrong transfer', 'wrong referral', 'offers self-pay when prohibited'], ztp: false, autoFail: false },
  { id: '3.2', name: 'Handled caller-specific needs correctly', category: 'Qualification', severity: 'Major', deduction: 5, passPhrases: ['treatment', 'samhsa', 'al-anon', 'aa', 'na'], failPhrases: ['wrong resource', 'incorrect referral'], ztp: false, autoFail: false },
  { id: '3.3', name: 'Used approved rebuttals/scripts', category: 'Qualification', severity: 'Major', deduction: 5, passPhrases: ['we are a helpline', 'to best help you', 'approved rebuttal'], failPhrases: ['deviates script', 'pressures caller'], ztp: false, autoFail: false },
  { id: '3.4', name: 'Avoided unqualified transfers', category: 'Qualification', severity: 'ZTP', deduction: 0, passPhrases: ['does not transfer state insurance', 'no transfer for self-pay', 'correctly disqualified'], failPhrases: ['transfers state insurance', 'transfers self-pay', 'unqualified transfer'], ztp: true, autoFail: true },
  { id: '3.5', name: 'Escalated qualified leads promptly', category: 'Qualification', severity: 'Major', deduction: 5, passPhrases: ['transferring now', 'let me get you', 'transfer in'], failPhrases: ['delays transfer', 'fails to tag'], ztp: false, autoFail: false },
  { id: '3.6', name: 'Provided correct referrals for non-qualifying', category: 'Qualification', severity: 'Major', deduction: 5, passPhrases: ['988', 'samhsa', 'here are resources'], failPhrases: ['wrong referral', 'missing referral'], ztp: false, autoFail: false },
  { id: '3.7', name: 'Maintained empathy and professionalism', category: 'Qualification', severity: 'Minor', deduction: 2, passPhrases: ['i understand', 'thank you for', "that's understandable", 'appreciate you'], failPhrases: ['irritation', 'no empathy', 'dismissive'], ztp: false, autoFail: false },
  { id: '4.1', name: 'Ended call professionally', category: 'Closing', severity: 'Minor', deduction: 2, passPhrases: ['let me get you', 'here are the resources', 'thank you for calling', 'transferring now'], failPhrases: ['abrupt hang-up', 'unclear next steps'], ztp: false, autoFail: false },
  { id: '4.2', name: 'Documented in Salesforce within 5 minutes', category: 'Closing', severity: 'Major', deduction: 5, passPhrases: ['documented', 'logged', 'salesforce', 'notes taken'], failPhrases: ['no documentation', 'late documentation'], ztp: false, autoFail: false },
  { id: '4.3', name: 'Applied correct star rating/disposition', category: 'Closing', severity: 'Major', deduction: 5, passPhrases: ['4 stars', 'qualified transfer', 'correct rating'], failPhrases: ['wrong stars', 'incorrect disposition'], ztp: false, autoFail: false },
  { id: '4.4', name: 'Noted follow-up/callback requests', category: 'Closing', severity: 'Minor', deduction: 2, passPhrases: ['callback request', 'follow-up noted', 'will call back'], failPhrases: ['callback omitted'], ztp: false, autoFail: false },
  { id: '5.1', name: 'Upheld patient confidentiality (HIPAA)', category: 'Compliance', severity: 'ZTP', deduction: 0, passPhrases: ['hipaa', 'confidential', 'protected health'], failPhrases: ['shares info unauthorized', 'hipaa breach', 'unauthorized disclosure'], ztp: true, autoFail: true },
  { id: '5.2', name: 'Avoided providing medical advice', category: 'Compliance', severity: 'ZTP', deduction: 0, passPhrases: ['i cannot advise', 'not a medical', 'consult a professional'], failPhrases: ['detox advice', 'withdrawal advice', 'dosage', 'treatment recommendation'], ztp: true, autoFail: true },
  { id: '5.3', name: 'Maintained response time', category: 'Compliance', severity: 'Minor', deduction: 2, passPhrases: ['responding promptly', 'answered quickly'], failPhrases: ['delayed response'], ztp: false, autoFail: false },
  { id: '5.4', name: 'Demonstrated soft skills', category: 'Compliance', severity: 'Minor', deduction: 2, passPhrases: ['active listening', 'clear communication', 'professional'], failPhrases: ['interruptions', 'unclear'], ztp: false, autoFail: false },
  { id: '5.5', name: 'Adhered to SOP/tools', category: 'Compliance', severity: 'Major', deduction: 5, passPhrases: ['using ctm', 'using zoho', 'approved tools'], failPhrases: ['unapproved script', 'deviates from tools'], ztp: false, autoFail: false },
]

function generateTags(results: ReturnType<typeof evaluateRubric>, score: number, insurance: string, state: string): string[] {
  const tags: string[] = []
  if (score >= 85) tags.push('excellent')
  else if (score >= 70) tags.push('good')
  else if (score >= 50) tags.push('needs-improvement')
  else tags.push('poor')
  const failed = results.filter(r => !r.pass)
  const categories = [...new Set(failed.map(r => r.category))]
  for (const cat of categories) tags.push(`${cat.toLowerCase()}-gap`)
  if (results.find(r => r.id === '3.4' && !r.pass)) tags.push('unqualified-transfer')
  if (results.find(r => r.id === '5.1' && !r.pass)) tags.push('hipaa-risk')
  if (results.find(r => r.id === '5.2' && !r.pass)) tags.push('medical-advice-risk')
  const ztpFails = results.filter(r => !r.pass && r.ztp)
  if (ztpFails.length > 0) tags.push('ztp-violation')
  if (insurance) tags.push(`insurance:${insurance}`)
  if (state) tags.push(`state:${state}`)
  return [...new Set(tags)]
}

function getDisposition(results: ReturnType<typeof evaluateRubric>, score: number, autoFailed: boolean): string {
  if (autoFailed) return 'Auto-fail: Critical violation - Requires supervisor review'
  const qualify3 = results.find(r => r.id === '3.4')
  if (qualify3 && !qualify3.pass) return 'Unqualified - Do not transfer (state insurance/self-pay/out-of-state/VA/Kaiser)'
  if (score >= 80) return 'Qualified Lead - Transfer to treatment facility (tag: Qualified Transfer, 4 stars)'
  if (score >= 60) return 'Warm Lead - Provide resources and schedule callback (3 stars)'
  if (score >= 40) return 'Refer - Provide SAMHSA/988 and general resources (2 stars)'
  return 'Do Not Refer - Outside scope or not interested (1 star)'
}

function generateSummary(results: ReturnType<typeof evaluateRubric>, score: number, autoFailed: boolean): string {
  if (autoFailed) return 'Auto-failed due to critical compliance violation (ZTP). Call requires immediate supervisor review.'
  const failed = results.filter(r => !r.pass)
  const categories = [...new Set(failed.map(r => r.category))]
  if (categories.length === 0) return 'Excellent call. Agent followed all quality standards across all categories.'
  const worst = failed.filter(r => r.severity === 'Major' || r.severity === 'ZTP')
  const categorySummary = categories.map(c => {
    const catFails = failed.filter(r => r.category === c)
    return `${c} (${catFails.length} issue${catFails.length > 1 ? 's' : ''})`
  }).join(', ')
  if (worst.length > 0) return `Call scored ${score}/100. Major issues in: ${categorySummary}. Requires coaching on critical criteria.`
  return `Call scored ${score}/100. Minor issues in: ${categorySummary}. Generally good performance with room for refinement.`
}

export async function GET(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const { supabase } = await createServerSupabase(request)
      // MUST use getSession() to refresh cookies
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
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
        const evaluatedResults = evaluateRubric(transcript.toLowerCase(), RUBRIC_CRITERIA, aiResults)
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
