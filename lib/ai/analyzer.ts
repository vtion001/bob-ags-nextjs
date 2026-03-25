import { Analysis } from './types'
import {
  evaluateRubric,
  calculateBreakdown,
  calculateScore,
  generateTags,
  generateSummary,
  getDisposition,
  generateSalesforceNotes,
  extractNames,
  extractLocations,
  detectInsurance,
  detectCallType
} from './helpers'

function buildRubricPrompt(transcript: string): string {
  return `You are a quality assurance analyst for a substance abuse helpline. Analyze the following call transcript and evaluate it against each criterion.

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

export async function analyzeTranscript(
  transcript: string,
  phone: string,
  client?: string,
  ctmStarRating?: number
): Promise<Analysis> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const lower = transcript.toLowerCase()

  let aiResults: Record<string, { pass: boolean; details: string }> = {}

  if (apiKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002',
          'X-Title': 'BOB Call Analysis',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [{ role: 'user', content: buildRubricPrompt(transcript) }],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''
        aiResults = parseRubricResults(content)
      }
    } catch (err) {
      console.error('OpenRouter analysis error:', err)
    }
  }

  const results = evaluateRubric(lower, aiResults)
  
  if (ctmStarRating !== undefined) {
    const starRatingMap: Record<number, string> = {
      4: '4 stars (Qualified Transfer)',
      3: '3 stars (Warm Lead)',
      2: '2 stars (Refer)',
      1: '1 star (Do Not Refer)'
    }
    const ratingDetails = starRatingMap[ctmStarRating] || `${ctmStarRating} stars`
    const idx = results.findIndex(r => r.id === '4.3')
    if (idx !== -1) {
      results[idx].details = `CTM Star Rating: ${ratingDetails}`
    }
  }
  
  const { breakdown, ztpFailures, autoFailed } = calculateBreakdown(results)
  const score = calculateScore(breakdown, ztpFailures, autoFailed)

  const mentionedNames = extractNames(transcript)
  const mentionedLocations = extractLocations(transcript)
  const detectedState = mentionedLocations[0] || ''
  const detectedInsurance = detectInsurance(transcript)
  const callType = detectCallType(transcript)
  const tags = generateTags(results, score, detectedInsurance, detectedState)
  const sentiment = score >= 70 ? 'positive' : score >= 40 ? 'neutral' : 'negative'
  const disposition = getDisposition(results, score, autoFailed)

  return {
    qualification_score: score,
    sentiment,
    summary: generateSummary(results, score, autoFailed),
    tags,
    suggested_disposition: disposition,
    follow_up_required: results.some(r => r.id === '2.5' && !r.pass) || score >= 60,
    call_type: callType,
    detected_state: detectedState,
    detected_insurance: detectedInsurance,
    mentioned_names: mentionedNames,
    mentioned_locations: mentionedLocations,
    salesforce_notes: generateSalesforceNotes(results, score, autoFailed, mentionedNames),
    rubric_results: results,
    rubric_breakdown: breakdown,
    ctm_star_rating: ctmStarRating,
  }
}