import React from 'react'
import Card from '@/components/ui/Card'
import type { CriterionResult } from '@/lib/ai'

interface CoachingInsightsCardProps {
  rubricResults?: CriterionResult[]
  score: number
  disposition?: string
}

// Coaching tips mapped to criterion IDs
const COACHING_TIPS: Record<string, { tip: string; category: string }> = {
  '1.1': {
    tip: 'Always start with "Hello Flyland, this is [Your Name]" - never use informal greetings like "Hi there" or "Help line". The approved greeting establishes credibility and brand identity.',
    category: 'Opening'
  },
  '1.2': {
    tip: 'Ask for the caller\'s name AND their relationship to the person seeking help (e.g., "What\'s your name, and are you calling for yourself or on behalf of someone else?"). This builds rapport and clarifies context.',
    category: 'Opening'
  },
  '1.3': {
    tip: 'Let the caller explain their reason for calling without assuming. Ask "What brings you to call us today?" before diving into questions. Avoid jumping to conclusions about their situation.',
    category: 'Opening'
  },
  '1.4': {
    tip: 'Always ask and confirm the caller\'s state/location: "Can you tell me what state you\'re located in?" This is critical for insurance verification and finding appropriate facilities.',
    category: 'Opening'
  },
  '2.1': {
    tip: 'Ask about clean/sobriety timeline using neutral language: "When was the last time you or your loved one used alcohol or drugs?" Never say "How long have you been sober?" as this implies they've already stopped.',
    category: 'Probing'
  },
  '2.2': {
    tip: 'Ask about substance type without giving advice: "What substance are you struggling with?" or "Is alcohol, drugs, or both part of the situation?" Never provide detox advice or imply treatment recommendations.',
    category: 'Probing'
  },
  '2.3': {
    tip: 'Verify insurance type specifically: "Do you have private insurance through work/family, or state insurance like Medicaid/Medicare?" Never just ask "Do you have insurance?" - this misses the qualification detail needed.',
    category: 'Probing'
  },
  '2.4': {
    tip: 'Gather information concisely within 3 conversational turns. Avoid repetitive questions. Confirm key details: insurance type, state, substance, timeline.',
    category: 'Probing'
  },
  '2.5': {
    tip: 'Always confirm a callback number: "What\'s the best number to reach you if we need to follow up?" This enables proper documentation and follow-up coordination.',
    category: 'Probing'
  },
  '3.1': {
    tip: 'Verify insurance BEFORE transferring. State insurance (Medicaid/Medicare) requires facilities that accept those plans. Self-pay callers need facilities with self-pay options. Never transfer without verification.',
    category: 'Qualification'
  },
  '3.2': {
    tip: 'Identify caller type (treatment seeker, family/Al-Anon, facility inquiry) and provide appropriate resources. Treatment seekers need facilities; family members need support groups like Al-Anon.',
    category: 'Qualification'
  },
  '3.3': {
    tip: 'Use approved scripts when handling objections: "We are a helpline focused on resources" and "To best help you, I need to understand your situation first." Never pressure callers.',
    category: 'Qualification'
  },
  '3.4': {
    tip: 'CRITICAL - ZTP VIOLATION: Never transfer state insurance callers to facilities that don\'t accept Medicaid/Medicare. Never transfer self-pay callers to facilities requiring large deposits. Verify before transferring!',
    category: 'Qualification'
  },
  '3.5': {
    tip: 'Once a caller qualifies (has appropriate insurance + substance issue + readiness), initiate transfer within 60 seconds. Delays reduce successful warm transfers.',
    category: 'Qualification'
  },
  '3.6': {
    tip: 'For non-qualifying callers (no insurance, not ready for treatment), provide SAMHSA\'s 988 helpline and general resources. Never leave them without next steps.',
    category: 'Qualification'
  },
  '3.7': {
    tip: 'Use the caller\'s name at least twice and include empathetic statements: "I understand this must be difficult" or "Thank you for sharing that with me."',
    category: 'Qualification'
  },
  '4.1': {
    tip: 'End professionally with clear next steps: "I\'m transferring you now to [Facility]. They will follow up with you shortly." Or provide specific resources with expected timelines.',
    category: 'Closing'
  },
  '5.1': {
    tip: 'CRITICAL - HIPAA VIOLATION: Never discuss caller details where others can hear. Never share information with unauthorized third parties. Verify caller identity before sharing any information.',
    category: 'Compliance'
  },
  '5.2': {
    tip: 'CRITICAL - MEDICAL ADVICE: Never provide detox advice, withdrawal timelines, or treatment recommendations. Always say "I\'m not a medical professional - please consult with your doctor."',
    category: 'Compliance'
  },
  '5.3': {
    tip: 'Answer calls promptly (within 30 seconds). Acknowledge if caller had to wait: "Thank you for holding."',
    category: 'Compliance'
  },
  '5.4': {
    tip: 'Practice active listening: don\'t interrupt, use proper tone, speak clearly. Avoid filler words and keep communication professional throughout.',
    category: 'Compliance'
  },
  '5.5': {
    tip: 'Use only approved tools (CTM for calls, ZohoChat for messaging). Never deviate to unapproved communication channels or personal devices.',
    category: 'Compliance'
  },
}

const ZTP_CRITERIA = ['3.4', '5.1', '5.2']

export default function CoachingInsightsCard({ rubricResults, score, disposition }: CoachingInsightsCardProps) {
  if (!rubricResults || rubricResults.length === 0) {
    return null
  }

  const passedCriteria = rubricResults.filter(r => r.pass && !r.na)
  const failedCriteria = rubricResults.filter(r => !r.pass && !r.na)
  const ztpViolations = rubricResults.filter(r => !r.pass && ZTP_CRITERIA.includes(r.id))
  const naCriteria = rubricResults.filter(r => r.na)

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' }
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (score >= 40) return { label: 'Needs Improvement', color: 'text-orange-600', bg: 'bg-orange-50' }
    return { label: 'Requires Coaching', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const scoreInfo = getScoreLabel(score)

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-lg font-bold text-navy-900">Coaching Insights & Recommendations</h3>
      </div>

      {/* Score Summary */}
      <div className={`${scoreInfo.bg} rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-navy-500">Overall Performance</p>
            <p className={`text-2xl font-bold ${scoreInfo.color}`}>{scoreInfo.label}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-navy-900">{score}</p>
            <p className="text-xs text-navy-400">out of 100</p>
          </div>
        </div>
      </div>

      {/* ZTP Violations Alert */}
      {ztpViolations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-bold text-red-700">Critical ZTP Violations - Immediate Action Required</p>
          </div>
          <ul className="text-sm text-red-600 space-y-1">
            {ztpViolations.map(v => (
              <li key={v.id}>• {v.criterion}: {v.details}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-navy-800">Strengths ({passedCriteria.length})</p>
          </div>
          {passedCriteria.length > 0 ? (
            <ul className="text-sm space-y-1.5 max-h-48 overflow-y-auto">
              {passedCriteria.map(c => (
                <li key={c.id} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-navy-600">{c.criterion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-navy-400 italic">No criteria passed</p>
          )}
        </div>

        {/* Areas for Improvement */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-navy-800">Areas for Improvement ({failedCriteria.length})</p>
          </div>
          {failedCriteria.length > 0 ? (
            <ul className="text-sm space-y-1.5 max-h-48 overflow-y-auto">
              {failedCriteria.map(c => (
                <li key={c.id} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">!</span>
                  <span className="text-navy-600">{c.criterion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-500 italic">All criteria passed!</p>
          )}
        </div>
      </div>

      {/* Coaching Tips */}
      {failedCriteria.length > 0 && (
        <div className="mt-4 pt-4 border-t border-navy-100">
          <p className="font-semibold text-navy-800 mb-2">Coaching Recommendations</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {failedCriteria.map(c => {
              const coachingTip = COACHING_TIPS[c.id]
              return (
                <div key={c.id} className="bg-cyan-50 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-600 font-bold mt-0.5">{c.id}</span>
                    <div>
                      <p className="font-medium text-navy-800">{c.criterion}</p>
                      {coachingTip && (
                        <p className="text-navy-600 mt-1">{coachingTip.tip}</p>
                      )}
                      {c.details && c.details !== 'Not clearly detected in transcript' && (
                        <p className="text-xs text-navy-400 mt-1">Detected: {c.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Action Tips */}
      <div className="mt-4 pt-4 border-t border-navy-100">
        <p className="font-semibold text-navy-800 mb-2">Quick Reference for Next Call</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="bg-navy-50 rounded p-2">
            <p className="font-medium text-navy-700">Opening</p>
            <p className="text-navy-500">Greet properly • Confirm name • Ask reason • Verify state</p>
          </div>
          <div className="bg-navy-50 rounded p-2">
            <p className="font-medium text-navy-700">Probing</p>
            <p className="text-navy-500">Ask timeline • Identify substance • Verify insurance • Get callback #</p>
          </div>
          <div className="bg-navy-50 rounded p-2">
            <p className="font-medium text-navy-700">Qualification</p>
            <p className="text-navy-500">Verify before transfer • Use scripts • Provide 988 for non-qualifying</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
