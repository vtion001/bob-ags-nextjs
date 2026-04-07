const US_STATES = [
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware',
  'florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky',
  'louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi',
  'missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico',
  'new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania',
  'rhode island','south carolina','south dakota','tennessee','texas','utah','vermont',
  'virginia','washington','west virginia','wisconsin','wyoming'
]

export function extractNames(transcript: string): string[] {
  const names: string[] = []
  const namePattern = /(?:my name is|I'm|this is|name's)\s+([A-Z][a-z]+)/gi
  let match
  while ((match = namePattern.exec(transcript)) !== null) names.push(match[1])
  return [...new Set(names)]
}

export function extractLocations(transcript: string): string[] {
  const locations: string[] = []
  const lower = transcript.toLowerCase()
  for (const state of US_STATES) {
    if (lower.includes(state)) locations.push(state.charAt(0).toUpperCase() + state.slice(1))
  }
  return [...new Set(locations)]
}

export function detectInsurance(transcript: string): string {
  const lower = transcript.toLowerCase()
  if (lower.includes('medicaid')) return 'medicaid'
  if (lower.includes('medicare')) return 'medicare'
  if (lower.includes('tricare')) return 'tricare'
  if (lower.includes('kaiser')) return 'kaiser'
  if (lower.includes('private') || lower.includes('blue cross') || lower.includes('aetna') || lower.includes('cigna') || lower.includes('united')) return 'private'
  if (lower.includes('self pay') || lower.includes('self-pay')) return 'self-pay'
  return ''
}

export function detectCallType(transcript: string): string {
  const lower = transcript.toLowerCase()
  if (lower.includes('al-anon') || lower.includes('family')) return 'al-anon'
  if (lower.includes('facility') || lower.includes('treatment center')) return 'facility'
  if (lower.includes('looking for help') || lower.includes('addiction')) return 'treatment'
  return 'general'
}