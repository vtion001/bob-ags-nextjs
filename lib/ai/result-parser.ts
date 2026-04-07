export function parseRubricResults(content: string): Record<string, { pass: boolean; details: string; na?: boolean }> {
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
