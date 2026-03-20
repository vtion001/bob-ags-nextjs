import { KnowledgeEntry } from './types'

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    category: 'transfer',
    title: 'Medicaid Transfer',
    content: 'If caller has Medicaid insurance: Transfer to 1-800-662-4357 (SAMHSA National Helpline). They provide free, confidential treatment referrals 24/7. Do NOT transfer to treatment centers directly for Medicaid callers.',
    metadata: { insurance: 'medicaid' }
  },
  {
    category: 'transfer',
    title: 'Medicare Transfer',
    content: 'If caller has Medicare: Transfer to 1-800-MEDICARE (1-800-633-4227). For substance abuse treatment, ask caller if they have Part A for inpatient or Part B for outpatient coverage.',
    metadata: { insurance: 'medicare' }
  },
  {
    category: 'transfer',
    title: 'Private Insurance Transfer',
    content: 'If caller has private insurance: Verify their specific benefits. Transfer to their insurance providers behavioral health line (usually on back of insurance card). May also offer to connect to treatment centers in their network.',
    metadata: { insurance: 'private' }
  },
  {
    category: 'transfer',
    title: 'Self-Pay Transfer',
    content: 'If caller is self-pay: Offer payment plans and sliding scale options. Provide list of low-cost treatment facilities in their area. Transfer to 988 Suicide and Crisis Lifeline if in crisis.',
    metadata: { insurance: 'self-pay' }
  },
  {
    category: 'transfer',
    title: 'No Insurance Transfer',
    content: 'If caller has no insurance: Provide 988 Lifeline (call or text 988), SAMHSA Helpline 1-800-662-4357, and information about state-funded treatment programs. Many areas have sober living homes with no cost.',
    metadata: { insurance: 'none' }
  },
  {
    category: 'transfer',
    title: 'State-Specific Resources',
    content: 'Each state has a behavioral health authority. For California: DMHC 1-888-466-2219. For Texas: HHSC 1-800-252-8154. For Florida: DCF 1-850-487-2921. Provide the appropriate state resource based on callers location.',
    metadata: {}
  },
  {
    category: 'transfer',
    title: '988 Suicide and Crisis Lifeline',
    content: 'For callers in crisis or expressing suicidal ideation: Transfer to 988 (call or text). This is a free, confidential crisis service available 24/7. Available in Spanish at 1-888-628-9454.',
    metadata: { crisis: true }
  },
  {
    category: 'transfer',
    title: 'Family/Al-Anon Resources',
    content: 'For family members of someone with substance use: Transfer to Al-Anon 1-888-425-2666, Nar-Anon 1-800-477-6291, or SAMHSAs family support line. Provide meeting information for local groups.',
    metadata: { caller_type: 'family' }
  },
  {
    category: 'script',
    title: 'Approved Greeting',
    content: 'Agent must say: Hello Flyland, this is [Agent Name]. Thank you for calling. How can I help you today? Do NOT say hi there or Flyland help line.',
    metadata: { criterion: '1.1' }
  },
  {
    category: 'script',
    title: 'Insurance Verification',
    content: 'Ask: Can you tell me what type of insurance you have? Is it private insurance through an employer, Medicaid, Medicare, or are you self-pay? Do NOT just ask do you have insurance - this is insufficient.',
    metadata: { criterion: '2.3' }
  },
  {
    category: 'script',
    title: 'Sobriety Question',
    content: 'Ask: When was your last drink or drug use? Wait for specific timeframe. Do NOT ask how long have you been sober as this assumes sobriety. Do NOT provide detox advice.',
    metadata: { criterion: '2.1' }
  },
  {
    category: 'script',
    title: 'State Verification',
    content: 'Ask: What state are you located in? Repeat the state back to confirm. This is required for transfer purposes and insurance verification.',
    metadata: { criterion: '1.4' }
  },
  {
    category: 'script',
    title: 'Reason for Call',
    content: 'Ask open-ended: What brings you to our helpline today? or How can I best help you? Do NOT assume the reason for the call. Let caller explain in their own words.',
    metadata: { criterion: '1.3' }
  },
  {
    category: 'script',
    title: 'Substance Inquiry',
    content: 'Ask: What substance or substances are you struggling with? or Are you using alcohol, drugs, or both? Get specifics. Do NOT give medical advice or recommend detox timelines.',
    metadata: { criterion: '2.2' }
  },
  {
    category: 'script',
    title: 'Transfer Script',
    content: 'When transferring a qualified lead: I am going to transfer you now to our admissions team. They will verify your insurance and connect you with the appropriate treatment facility. Please hold for just a moment.',
    metadata: { criterion: '3.5' }
  },
  {
    category: 'script',
    title: 'Non-Qualifying Callers',
    content: 'For callers who do not qualify for treatment referral: I understand. Here are some resources that may help you: [provide 988, SAMHSA, or local resources]. Is there anything else I can help you with today?',
    metadata: { criterion: '3.6' }
  },
  {
    category: 'sop',
    title: 'HIPAA Compliance',
    content: 'NEVER share caller information with unauthorized parties. Do NOT repeat caller details loudly. Do NOT leave voicemails with specific treatment information. Document in secure CRM only.',
    metadata: { criterion: '5.1', ztp: true }
  },
  {
    category: 'sop',
    title: 'No Medical Advice',
    content: 'Agents cannot provide medical advice including: detox timelines, medication recommendations, treatment efficacy claims, or medical diagnoses. Always defer to medical professionals. Use phrase: I am not a medical professional, but...',
    metadata: { criterion: '5.2', ztp: true }
  },
  {
    category: 'sop',
    title: 'Unqualified Transfer Prevention',
    content: 'NEVER transfer state insurance (Medicaid/Medicare) to treatment centers without verifying benefits first. This violates ZTP policy. Always use SAMHSA helpline as fallback for state insurance callers.',
    metadata: { criterion: '3.4', ztp: true }
  },
  {
    category: 'sop',
    title: 'Documentation Requirements',
    content: 'Document all calls in Salesforce within 5 minutes of call end. Include: caller name, phone, state, insurance type, substance(s), sobriety date, and recommended disposition. Use approved disposition codes only.',
    metadata: { criterion: '4.2' }
  },
  {
    category: 'sop',
    title: 'Empathy Standards',
    content: 'Use empathy phrases: I understand this is difficult, Thank you for sharing, That sounds challenging, I appreciate you telling me. Avoid: sighing, long pauses, monotone, or dismissive language.',
    metadata: { criterion: '3.7' }
  },
  {
    category: 'disposition',
    title: 'Qualified Transfer - Hot Lead',
    content: 'Disposition: QUALIFIED TRANSFER. Criteria: Insurance verified, substance identified, location confirmed, caller ready for treatment. Action: Transfer to admissions.',
    metadata: { score_min: 85, score_max: 100 }
  },
  {
    category: 'disposition',
    title: 'Warm Lead - Follow Up Needed',
    content: 'Disposition: WARM LEAD. Criteria: Some information gathered but missing key elements. Action: Schedule callback, document in CRM for follow-up within 24 hours.',
    metadata: { score_min: 50, score_max: 84 }
  },
  {
    category: 'disposition',
    title: 'Informational Only',
    content: 'Disposition: INFO ONLY. Criteria: Caller not seeking treatment, family member, or does not meet criteria. Action: Provide resources, document, no follow-up required.',
    metadata: { score_min: 0, score_max: 49 }
  },
  {
    category: 'disposition',
    title: 'ZTP Violation - Supervisor Review',
    content: 'Disposition: SUPERVISOR REVIEW REQUIRED. Criteria: Any ZTP criterion failed (3.4, 5.1, 5.2). Action: Tag for immediate supervisor review, do not transfer, document incident.',
    metadata: { ztp_violation: true }
  }
]

export function getRelevantKnowledge(
  context: {
    insurance?: string
    state?: string
    substance?: string
    callerType?: string
    missingCriteria?: string[]
    isCrisis?: boolean
  }
): KnowledgeEntry[] {
  const results: KnowledgeEntry[] = []
  const { insurance, state, substance, callerType, missingCriteria, isCrisis } = context

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0

    if (entry.metadata.insurance && entry.metadata.insurance === insurance) {
      score += 10
    }
    if (entry.metadata.state && String(entry.metadata.state).toLowerCase() === state?.toLowerCase()) {
      score += 5
    }
    if (entry.metadata.crisis && isCrisis) {
      score += 10
    }
    if (entry.metadata.caller_type && entry.metadata.caller_type === callerType) {
      score += 10
    }
    if (entry.metadata.criterion && missingCriteria?.includes(entry.metadata.criterion as string)) {
      score += 15
    }

    if (score > 0) {
      results.push({ ...entry, metadata: { ...entry.metadata, relevanceScore: score } })
    }
  }

  return results.sort((a, b) =>
    ((b.metadata.relevanceScore as number) || 0) - ((a.metadata.relevanceScore as number) || 0)
  )
}