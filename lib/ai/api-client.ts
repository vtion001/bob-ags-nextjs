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
import { buildRubricPrompt } from './prompt-builder'
import { parseRubricResults } from './result-parser'

export async function analyzeTranscript(
  transcript: string,
  phone: string,
  client?: string,
  ctmStarRating?: number
): Promise<Analysis> {
  const apiKey = process.env.OPENAI_API_KEY
  const lower = transcript.toLowerCase()

  let aiResults: Record<string, { pass: boolean; details: string }> = {}

  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
      console.error('OpenAI analysis error:', err)
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
