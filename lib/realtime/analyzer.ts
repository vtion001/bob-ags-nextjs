import { RealtimeInsight, LiveCallState } from './types'
import {
  RUBRIC_KEYWORDS,
  INSURANCE_PATTERNS,
  STATE_PATTERNS,
  NAME_PATTERNS,
  POSITIVE_WORDS,
  NEGATIVE_WORDS,
  CRITERION_NAMES,
} from './constants'

export function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const posCount = POSITIVE_WORDS.filter((w) => text.includes(w)).length
  const negCount = NEGATIVE_WORDS.filter((w) => text.includes(w)).length

  if (posCount > negCount) return "positive"
  if (negCount > posCount) return "negative"
  return "neutral"
}

export function recalculateScore(
  criteria: Record<string, { pass: boolean; triggered: boolean }>,
  startTime: number
): number {
  let passed = 0
  let total = 0
  let autoFailed = false

  for (const [id, status] of Object.entries(criteria)) {
    if (id === "1.3") continue
    total++
    if (status.pass) passed++
    if (status.pass === false && RUBRIC_KEYWORDS[id]?.autoFail) {
      autoFailed = true
    }
  }

  if (Object.keys(criteria).length === 0) {
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    if (elapsed < 30) {
      return 100
    }
  }

  if (autoFailed) {
    return 0
  }

  return total > 0 ? Math.round((passed / total) * 100) : 100
}

export function getCriterionName(id: string): string {
  return CRITERION_NAMES[id] || id
}

export function analyzeTextForInsights(
  text: string,
  speaker: string,
  elapsed: number,
  state: Partial<LiveCallState>,
  onInsight: (insight: RealtimeInsight) => void,
  onStateChange: (update: Partial<LiveCallState>) => void,
  startTime: number
): void {
  const lower = text.toLowerCase()

  if (speaker === "Agent") {
    for (const [id, config] of Object.entries(RUBRIC_KEYWORDS)) {
      const criteria = state.criteriaStatus?.[id]
      if (criteria?.triggered) continue

      const passFound = config.pass.some((p) =>
        lower.includes(p.toLowerCase()),
      )
      const failFound = config.fail.some((p) =>
        lower.includes(p.toLowerCase()),
      )

      if (passFound || failFound) {
        const pass = !failFound && passFound

        onInsight({
          id: `${id}-${elapsed}`,
          type: failFound ? (config.autoFail ? "fail" : "warning") : "pass",
          criterion: getCriterionName(id),
          criterionId: id,
          category: config.category,
          message: pass
            ? `Agent: "${text.substring(0, 80)}..."`
            : `${failFound ? "FAILED" : "Triggered"}: "${text.substring(0, 80)}..."`,
          timestamp: elapsed,
          autoFail: config.autoFail,
          ztp: config.ztp,
        })

        const newCriteriaStatus = {
          ...state.criteriaStatus,
          [id]: { pass, triggered: true },
        }

        const newScore = recalculateScore(newCriteriaStatus, startTime)
        onStateChange({
          criteriaStatus: newCriteriaStatus,
          score: newScore,
        })
      }
    }

    if (elapsed > 30 && !state.criteriaStatus?.["1.3"]?.triggered) {
      onInsight({
        id: `timeout-${elapsed}`,
        type: "warning",
        criterion: "Opening - Promptness",
        criterionId: "1.3",
        category: "Opening",
        message: "Over 30 seconds without identifying reason for call",
        timestamp: elapsed,
        autoFail: false,
        ztp: false,
      })
      const newCriteriaStatus = {
        ...state.criteriaStatus,
        "1.3": { pass: false, triggered: true },
      }
      const newScore = recalculateScore(newCriteriaStatus, startTime)
      onStateChange({
        criteriaStatus: newCriteriaStatus,
        score: newScore,
      })
    }
  }

  if (
    INSURANCE_PATTERNS.some((ip) => ip.pattern.test(lower)) &&
    !state.insurance
  ) {
    const found = INSURANCE_PATTERNS.find((ip) => ip.pattern.test(lower))
    onStateChange({ insurance: found?.value })
    onInsight({
      id: `insurance-${elapsed}`,
      type: "info",
      criterion: "Insurance Detected",
      criterionId: "2.3",
      category: "Probing",
      message: `Detected insurance type: ${found?.value}`,
      timestamp: elapsed,
      autoFail: false,
      ztp: false,
    })
  }

  const stateMatch = lower.match(STATE_PATTERNS)
  if (stateMatch && !state.callerLocation) {
    onStateChange({ callerLocation: stateMatch[1] })
  }

  const nameMatch = NAME_PATTERNS.some((p) => p.test(text))
  if (nameMatch && speaker === "Caller" && !state.callerName) {
    for (const pattern of NAME_PATTERNS) {
      const match = text.match(pattern)
      if (match?.[1]) {
        onStateChange({ callerName: match[1] })
        break
      }
    }
  }

  const sentiment = detectSentiment(lower)
  onStateChange({
    sentiment,
    sentimentScore:
      sentiment === "positive" ? 70 : sentiment === "neutral" ? 50 : 30,
  })
}