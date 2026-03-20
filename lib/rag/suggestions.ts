export type SuggestionType = 'script' | 'reminder' | 'transfer' | 'warning'
export type SuggestionPriority = 'high' | 'medium' | 'low'

export interface AgentSuggestion {
  id: string
  type: SuggestionType
  priority: SuggestionPriority
  title: string
  message: string
  criterion?: string
}

export const SUGGESTIONS: Record<string, Omit<AgentSuggestion, 'id' | 'criterion'>> = {
  '1.1': {
    title: 'Use Approved Greeting',
    message: 'Say: "Hello Flyland, this is [Your Name]. Thank you for calling. How can I help you today?"',
    type: 'script',
    priority: 'high'
  },
  '1.2': {
    title: 'Confirm Caller Name',
    message: 'Ask: "Can I get your name and your relationship to the person struggling with substance use?"',
    type: 'script',
    priority: 'medium'
  },
  '1.3': {
    title: 'Identify Reason for Call',
    message: 'Ask: "What brings you to our helpline today?" - Do not assume the reason.',
    type: 'script',
    priority: 'high'
  },
  '1.4': {
    title: 'Verify Location',
    message: 'Ask: "What state are you located in?" and repeat it back to confirm.',
    type: 'script',
    priority: 'high'
  },
  '2.1': {
    title: 'Ask About Sobriety',
    message: 'Ask: "When was your last drink or drug use?" - Wait for a specific timeframe. Do NOT ask "how long sober."',
    type: 'script',
    priority: 'high'
  },
  '2.2': {
    title: 'Identify Substance',
    message: 'Ask: "What substance or substances are you struggling with?"',
    type: 'script',
    priority: 'high'
  },
  '2.3': {
    title: 'Verify Insurance',
    message: 'Ask: "Can you tell me what type of insurance you have? Is it private, Medicaid, Medicare, or self-pay?"',
    type: 'script',
    priority: 'high'
  },
  '2.5': {
    title: 'Confirm Phone Number',
    message: 'Confirm the best phone number to reach them for follow-up.',
    type: 'reminder',
    priority: 'medium'
  },
  '3.4': {
    title: 'CRITICAL: No Unqualified Transfers',
    message: 'Do NOT transfer Medicaid/Medicare callers to treatment centers. Use SAMHSA helpline first.',
    type: 'warning',
    priority: 'high'
  },
  '3.5': {
    title: 'Prepare for Transfer',
    message: 'When ready: "I am going to transfer you now to our admissions team. Please hold for just a moment."',
    type: 'transfer',
    priority: 'high'
  },
  '3.6': {
    title: 'Provide Resources',
    message: 'For non-qualifying callers: "Here is the 988 Lifeline number you can call anytime: 988."',
    type: 'transfer',
    priority: 'medium'
  },
  '3.7': {
    title: 'Show Empathy',
    message: 'Use phrases: "I understand this is difficult" or "Thank you for sharing with me."',
    type: 'script',
    priority: 'medium'
  },
  '5.1': {
    title: 'HIPAA WARNING',
    message: 'Do NOT repeat caller information loudly. Document securely. Never leave voicemails with treatment details.',
    type: 'warning',
    priority: 'high'
  },
  '5.2': {
    title: 'No Medical Advice',
    message: 'Do NOT give medical advice. Say: "I am not a medical professional, but I can connect you with resources."',
    type: 'warning',
    priority: 'high'
  }
}

export interface GetSuggestionsOptions {
  missingCriteria: string[]
  currentContext: {
    insurance?: string
    state?: string
    substance?: string
    callerName?: string
    isCrisis?: boolean
  }
  limit?: number
}

export function getAgentSuggestions(options: GetSuggestionsOptions): AgentSuggestion[] {
  const { missingCriteria, currentContext, limit = 6 } = options
  const suggestions: AgentSuggestion[] = []

  for (const criterion of missingCriteria.slice(0, limit)) {
    const suggestion = SUGGESTIONS[criterion]
    if (suggestion) {
      suggestions.push({
        id: criterion,
        ...suggestion,
        criterion
      })
    }
  }

  if (currentContext.isCrisis) {
    suggestions.unshift({
      id: 'crisis',
      type: 'warning',
      priority: 'high',
      title: 'Crisis Detected',
      message: 'Transfer to 988 Suicide & Crisis Lifeline. Available 24/7: Call or text 988.'
    })
  }

  if (missingCriteria.length === 0 && currentContext.insurance && currentContext.state) {
    suggestions.push({
      id: 'ready',
      type: 'transfer',
      priority: 'medium',
      title: 'Ready to Transfer',
      message: 'All qualification criteria met. Prepare caller for transfer to admissions.'
    })
  }

  return suggestions
}

export function getSimpleSuggestions(
  missingCriteria: string[],
  currentState: { insurance?: string; state?: string; substance?: string; callerName?: string }
): string[] {
  const suggestions: string[] = []

  for (const criterion of missingCriteria) {
    const suggestion = SUGGESTIONS[criterion]
    if (suggestion) {
      suggestions.push(suggestion.message)
    }
  }

  return suggestions.slice(0, 5)
}