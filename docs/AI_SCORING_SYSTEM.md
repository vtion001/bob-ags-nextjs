# BOB Call Analysis - AI Scoring System

## Overview

BOB (Business Operations Butler) uses AI-powered call analysis to evaluate agent performance on substance abuse helpline calls. The scoring system analyzes call transcripts against a 25-criterion rubric to generate quality assurance scores.

**Responsible AI:** OpenRouter (Claude-3-Haiku) with keyword-based fallback analysis

---

## Scoring Architecture

### Analysis Flow

```
Transcript → OpenRouter AI (Claude-3-Haiku) → Keyword Fallback → Rubric Evaluation → Score Calculation
```

1. **OpenRouter Analysis**: Sends transcript to Claude-3-Haiku via OpenRouter API
2. **Keyword Fallback**: If AI fails, uses keyword matching against pass/fail phrases
3. **Rubric Evaluation**: Each criterion is evaluated as PASS or FAIL
4. **Score Calculation**: Points are summed and normalized to 0-100 scale

---

## 25-Criterion Rubric

### Opening Section (14 points max)

| ID | Criterion | Pass Phrases | Fail Phrases | Severity | Points |
|----|-----------|--------------|--------------|----------|--------|
| 1.1 | Used approved greeting | "hello flyland", "flyland this is" | "hi there", "flyland help line" | Minor | 2 |
| 1.2 | Confirmed caller name and relationship | "what's your name", "can i get your name", "may i have your name" | (none) | Minor | 2 |
| 1.3 | Identified reason for call promptly | "how can i help", "what brings you", "reason for your call" | "assumed reason", "jumped to questions" | Major | 5 |
| 1.4 | Verified caller location (state) | "what state", "which state", "located in", "state are you" | "never asks state" | Major | 5 |

### Probing Section (19 points max)

| ID | Criterion | Pass Phrases | Fail Phrases | Severity | Points |
|----|-----------|--------------|--------------|----------|--------|
| 2.1 | Asked about sober/clean time | "last drink", "last drug use", "when was your last", "how long has it been" | "how long sober", "skips time" | Major | 5 |
| 2.2 | Inquired about substance/type of struggle | "what substance", "struggling with", "alcohol drugs", "drug or alcohol" | "gives detox advice" | Major | 5 |
| 2.3 | Asked about insurance type and details | "type of insurance", "private or state", "medicaid", "medicare", "insurance do you have" | "only asks do you have insurance", "skips insurance" | Major | 5 |
| 2.4 | Gathered additional info concisely | "openness to help", "facility name", "follow-up" | "probes too many times", "repeated questions" | Minor | 2 |
| 2.5 | Verified caller phone number | "best number", "phone number", "reach you" | "skips phone when needed" | Minor | 2 |

### Qualification Section (37 points max)

| ID | Criterion | Pass Phrases | Fail Phrases | Severity | Points |
|----|-----------|--------------|--------------|----------|--------|
| 3.1 | Correctly assessed eligibility | "transferring you", "referring to", "qualified" | "wrong transfer", "wrong referral", "offers self-pay when prohibited" | Major | 5 |
| 3.2 | Handled caller-specific needs correctly | "treatment", "samhsa", "al-anon", "aa", "na" | "wrong resource", "incorrect referral" | Major | 5 |
| 3.3 | Used approved rebuttals/scripts | "we are a helpline", "to best help you", "approved rebuttal" | "deviates script", "pressures caller" | Major | 5 |
| 3.4 | **Avoided unqualified transfers** | "does not transfer state insurance", "no transfer for self-pay", "correctly disqualified" | "transfers state insurance", "transfers self-pay", "unqualified transfer" | **ZTP** | **Auto-FAIL** |
| 3.5 | Escalated qualified leads promptly | "transferring now", "let me get you", "transfer in" | "delays transfer", "fails to tag" | Major | 5 |
| 3.6 | Provided correct referrals for non-qualifying | "988", "samhsa", "here are resources" | "wrong referral", "missing referral" | Major | 5 |
| 3.7 | Maintained empathy and professionalism | "i understand", "thank you for", "that's understandable", "appreciate you" | "irritation", "no empathy", "dismissive" | Minor | 2 |

### Closing Section (14 points max)

| ID | Criterion | Pass Phrases | Fail Phrases | Severity | Points |
|----|-----------|--------------|--------------|----------|--------|
| 4.1 | Ended call professionally | "let me get you", "here are the resources", "thank you for calling", "transferring now" | "abrupt hang-up", "unclear next steps" | Minor | 2 |
| 4.2 | Documented in Salesforce within 5 minutes | "documented", "logged", "salesforce", "notes taken" | "no documentation", "late documentation" | Major | 5 |
| 4.3 | Applied correct star rating/disposition | "4 stars", "qualified transfer", "correct rating" | "wrong stars", "incorrect disposition" | Major | 5 |
| 4.4 | Noted follow-up/callback requests | "callback request", "follow-up noted", "will call back" | "callback omitted" | Minor | 2 |

### Compliance Section (26 points max)

| ID | Criterion | Pass Phrases | Fail Phrases | Severity | Points |
|----|-----------|--------------|--------------|----------|--------|
| 5.1 | **Upheld patient confidentiality (HIPAA)** | "hipaa", "confidential", "protected health" | "shares info unauthorized", "hipaa breach", "unauthorized disclosure" | **ZTP** | **Auto-FAIL** |
| 5.2 | **Avoided providing medical advice** | "i cannot advise", "not a medical", "consult a professional" | "detox advice", "withdrawal advice", "dosage", "treatment recommendation" | **ZTP** | **Auto-FAIL** |
| 5.3 | Maintained response time | "responding promptly", "answered quickly" | "delayed response" | Minor | 2 |
| 5.4 | Demonstrated soft skills | "active listening", "clear communication", "professional" | "interruptions", "unclear" | Minor | 2 |
| 5.5 | Adhered to SOP/tools | "using ctm", "using zoho", "approved tools" | "unapproved script", "deviates from tools" | Major | 5 |

---

## Severity Levels

| Severity | Points Deducted | Description |
|----------|-----------------|-------------|
| Minor | 2 | Small issues, coaching opportunities |
| Major | 5 | Significant issues, require improvement |
| **ZTP** | **Auto-FAIL** | Zero Tolerance Policy - Immediate failure if violated |

---

## Score Calculation

### Maximum Possible Points

| Section | Max Points |
|---------|------------|
| Opening | 14 |
| Probing | 19 |
| Qualification | 37 |
| Closing | 14 |
| Compliance | 26 |
| **Total** | **110** |

### Formula

```
Score = (Earned Points / Maximum Points) × 100
```

### Special Rules

1. **ZTP Violations**: If any ZTP criterion (3.4, 5.1, 5.2) fails, score is set to **0**
2. **Multiple ZTP Failures**: If 2+ ZTP criteria fail, score is set to **0**
3. **Auto-Fail Triggers**: Any of these conditions set score to **0**:
   - Criterion 3.4 (Unqualified Transfer) fails
   - Criterion 5.1 (HIPAA Violation) fails
   - Criterion 5.2 (Medical Advice) fails

---

## Sentiment Classification

| Score Range | Sentiment |
|-------------|-----------|
| 70-100 | Positive |
| 40-69 | Neutral |
| 0-39 | Negative |

---

## Disposition Mapping

| Score Range | Disposition | Action |
|-------------|-------------|--------|
| 80-100 | **Qualified Lead** | Transfer to treatment facility (4 stars) |
| 60-79 | **Warm Lead** | Provide resources and schedule callback (3 stars) |
| 40-59 | **Refer** | Provide SAMHSA/988 and general resources (2 stars) |
| 0-39 | **Do Not Refer** | Outside scope or not interested (1 star) |
| Auto-Fail | **Critical Violation** | Requires supervisor review |

---

## ZTP (Zero Tolerance Policy) Violations

These are the most critical criteria that result in immediate call failure:

### 3.4 - Avoided Unqualified Transfers
**Why Critical**: Transferring callers with state insurance (Medicaid/Medicare), self-pay, out-of-state, or VA benefits to facilities that don't accept them wastes resources and violates regulations.

**Red Flags**:
- "I'm going to transfer you now" when caller has state insurance
- Transferring to facility that doesn't accept caller's insurance type
- Not verifying insurance before transfer

### 5.1 - HIPAA Confidentiality
**Why Critical**: Sharing patient information without proper authorization is a federal crime (HIPAA violations can result in $100-$50,000 per violation).

**Red Flags**:
- Discussing caller details where others can hear
- Sharing information with unauthorized third parties
- Not verifying caller's identity before sharing information

### 5.2 - Medical Advice
**Why Critical**: Non-medical staff providing medical advice can cause harm and creates legal liability.

**Red Flags**:
- "You should detox at home"
- "Take this medication instead of what you're taking"
- "I think you should try this treatment"

---

## Score Breakdown Categories

### Excellent (85-100)
- All or nearly all criteria passed
- No ZTP violations
- Strong performance across all categories

### Good (70-84)
- Minor issues only
- No major failures
- Solid overall performance

### Needs Improvement (50-69)
- Some major criteria failed
- Coaching recommended on specific areas
- May have qualified leads incorrectly

### Poor (0-49)
- Multiple major failures or ZTP violations
- Immediate supervisor review recommended
- Retraining required

---

## Tags Generated

Based on scoring, calls receive automatic tags:

| Tag | Trigger Condition |
|-----|------------------|
| `excellent` | Score >= 85 |
| `good` | Score >= 70 |
| `needs-improvement` | Score >= 50 |
| `poor` | Score < 50 |
| `unqualified-transfer` | Criterion 3.4 failed |
| `hipaa-risk` | Criterion 5.1 failed |
| `medical-advice-risk` | Criterion 5.2 failed |
| `ztp-violation` | Any ZTP criterion failed |
| `insurance:{type}` | Detected insurance type |
| `state:{state}` | Detected caller state |

---

## Example Calculations

### Example 1: Perfect Call (100/100)
- 25/25 criteria passed
- No ZTP violations
- Score: (110/110) × 100 = **100**

### Example 2: Call with Minor Issues (78/100)
- Passed 23/25 criteria
- Failed 1.4 (Major -5) and 4.2 (Major -5)
- Score: (100/110) × 100 = **91** (rounded)

### Example 3: Call with ZTP Violation (0/100)
- Failed criterion 3.4 (unqualified transfer)
- ZTP violation triggers auto-fail
- Score: **0**

### Example 4: Partial Failure (4/100)
- Most criteria failed without AI enhancement
- Keyword fallback likely matched only a few pass phrases
- Score: **(4/110) × 100 ≈ 4**

---

## Implementation

**Location**: `/lib/ai.ts`

**Key Functions**:
- `analyzeTranscript()` - Main entry point
- `evaluateRubric()` - Evaluates each criterion
- `calculateScore()` - Computes final score
- `generateTags()` - Creates call tags
- `getDisposition()` - Determines call disposition

**API Integration**:
- OpenRouter API for AI analysis
- Environment variable: `OPENROUTER_API_KEY`

---

## Troubleshooting Low Scores

### If Score is 0:
1. Check for ZTP violations (3.4, 5.1, 5.2)
2. Review transcript for unqualified transfers
3. Check for HIPAA or medical advice issues

### If Score is Very Low (<10):
1. Verify OpenRouter API key is set
2. Check if AI analysis completed successfully
3. Review keyword matching - transcript may not contain expected phrases

### If Score Seems Incorrect:
1. Manually review transcript against rubric
2. Check if agent used alternative phrasing not in pass phrases
3. Verify all 25 criteria are being evaluated
