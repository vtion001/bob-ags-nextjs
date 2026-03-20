# QA Analysis System — Knowledge Base

## Overview

The BOB QA Analysis system evaluates substance abuse helpline call recordings against a structured 25-criterion rubric. It uses a **dual-layer analysis engine** that combines an AI language model (Claude via OpenRouter) with a deterministic keyword-matching fallback, producing a score from 0–100 along with per-criterion pass/fail results, category breakdowns, sentiment analysis, and call disposition recommendations.

---

## Architecture

```
Call Recording (CTM)
        │
        ▼
AssemblyAI Transcription
(v2 transcript endpoint — polling-based)
        │
        ▼
analyzeTranscript()  ←  lib/ai.ts
        │
        ├──────────────────────┐
        ▼                      ▼
  OpenRouter API          Keyword Fallback
  (Claude-3-Haiku)       (rule-based)
        │                      │
        ▼                      │
  parseRubricResults()          │
        │                      │
        ▼                      ▼
  evaluateRubric()  ◄───────────┘
   (AI results override fallback)
        │
        ├──► calculateBreakdown()  → RubricBreakdown (per-category scores)
        ├──► calculateScore()      → 0–100 overall score
        ├──► generateTags()         → classification tags
        ├──► generateSummary()      → human-readable summary
        ├──► getDisposition()       → lead qualification/disposition
        ├──► extractNames()        → caller names
        ├──► extractLocations()    → US states mentioned
        ├──► detectInsurance()      → insurance type
        ├──► detectCallType()      → treatment/Al-Anon/facility
        └──► generateSalesforceNotes() → CRM-ready notes
        │
        ▼
  Supabase Storage
  (calls.rubric_results + rubric_breakdown)
        │
        ▼
  Dashboard Display
  (AIAnalysisCard + QAAnalysisCard)
```

---

## The Dual-Layer Engine

### Layer 1 — OpenRouter AI (Primary)

When an API key is configured, the system sends the full transcript to OpenRouter using **Claude-3-Haiku** with a carefully crafted prompt. The prompt instructs the AI to:

1. Act as a QA analyst for a substance abuse helpline
2. Evaluate all 25 criteria
3. Return exactly 25 lines in the format: `CRITERION_ID|PASS/FAIL|Brief reason`

The response is parsed by `parseRubricResults()` — each line is split by `|` into:
- `id`: The criterion ID (e.g., `3.4`)
- `pass`: Boolean — `true` for PASS, `false` for FAIL
- `details`: Free-text reason (up to 200 chars)

### Layer 2 — Keyword Fallback (Secondary)

When no OpenRouter key is configured (or the API call fails), the system falls back to **keyword matching**. Each criterion has:
- `passPhrases[]`: Text snippets that indicate the agent performed this action correctly
- `failPhrases[]`: Text snippets that indicate a failure or violation

The `keywordMatch()` function:
1. Counts how many `passPhrases` appear in the transcript
2. Counts how many `failPhrases` appear
3. For ZTP criteria (3.4, 5.1, 5.2): **pass only if zero fail phrases** (failures are critical)
4. For all other criteria: **pass if pass phrases > fail phrases**

The AI layer overrides the keyword fallback — if the AI returns a result for a criterion, that result is used. Keyword fallback only applies to criteria the AI didn't evaluate.

---

## The 25-Criterion Rubric

Criteria are organized into **5 categories**. Each criterion belongs to exactly one category.

### Category Structure

| Category | ID Range | Description |
|---|---|---|
| **Opening** | 1.1 – 1.4 | First 30 seconds: greeting, name, reason, location |
| **Probing** | 2.1 – 2.5 | Information gathering: sobriety, substance, insurance, phone |
| **Qualification** | 3.1 – 3.7 | Eligibility assessment and lead handling |
| **Closing** | 4.1 – 4.4 | Professional wrap-up and documentation |
| **Compliance** | 5.1 – 5.5 | Legal/regulatory adherence and SOP compliance |

---

### Opening (4 criteria, max 14 points)

| ID | Criterion | Severity | Points | ZTP | Key Pass Triggers |
|---|---|---|---|---|---|
| 1.1 | Used approved greeting | Minor | 2 | No | "Hello Flyland", "Flyland this is [Name]" |
| 1.2 | Confirmed caller name | Minor | 2 | No | "what's your name", "can I get your name" |
| 1.3 | Identified reason for call promptly | Major | 5 | No | "how can I help", "what brings you" |
| 1.4 | Verified caller location (state) | Major | 5 | No | "what state", "which state", "located in" |

### Probing (5 criteria, max 21 points)

| ID | Criterion | Severity | Points | ZTP | Key Pass Triggers |
|---|---|---|---|---|---|
| 2.1 | Asked about sober/clean time | Major | 5 | No | "last drink", "last drug use", "when was your last" |
| 2.2 | Inquired about substance/type of struggle | Major | 5 | No | "what substance", "struggling with", "alcohol drugs" |
| 2.3 | Asked about insurance type and details | Major | 5 | No | "type of insurance", "private or state", "medicaid", "medicare" |
| 2.4 | Gathered additional info concisely | Minor | 2 | No | "openness to help", "facility name", "follow-up" |
| 2.5 | Verified caller phone number | Minor | 2 | No | "best number", "phone number", "reach you" |

### Qualification (7 criteria, max 35 points)

| ID | Criterion | Severity | Points | ZTP | Key Pass Triggers |
|---|---|---|---|---|---|
| 3.1 | Correctly assessed eligibility | Major | 5 | No | "transferring you", "referring to", "qualified" |
| 3.2 | Handled caller-specific needs correctly | Major | 5 | No | "treatment", "samhsa", "al-anon", "aa", "na" |
| 3.3 | Used approved rebuttals/scripts | Major | 5 | No | "we are a helpline", "to best help you" |
| 3.4 | **Avoided unqualified transfers** | ZTP | 10 | **Yes** | "does not transfer state insurance", "correctly disqualified" |
| 3.5 | Escalated qualified leads promptly | Major | 5 | No | "transferring now", "let me get you", "transfer in" |
| 3.6 | Provided correct referrals for non-qualifying | Major | 5 | No | "988", "samhsa", "here are resources" |
| 3.7 | Maintained empathy and professionalism | Minor | 2 | No | "I understand", "thank you for", "that's understandable" |

### Closing (4 criteria, max 14 points)

| ID | Criterion | Severity | Points | ZTP | Key Pass Triggers |
|---|---|---|---|---|---|
| 4.1 | Ended call professionally | Minor | 2 | No | "thank you for calling", "transferring now", "here are the resources" |
| 4.2 | Documented in Salesforce within 5 min | Major | 5 | No | "documented", "logged", "salesforce", "notes taken" |
| 4.3 | Applied correct star rating/disposition | Major | 5 | No | "4 stars", "qualified transfer", "correct rating" |
| 4.4 | Noted follow-up/callback requests | Minor | 2 | No | "callback request", "follow-up noted", "will call back" |

### Compliance (5 criteria, max 21 points)

| ID | Criterion | Severity | Points | ZTP | Key Pass Triggers |
|---|---|---|---|---|---|
| 5.1 | **Upheld patient confidentiality (HIPAA)** | ZTP | 10 | **Yes** | "hipaa", "confidential", "protected health" |
| 5.2 | **Avoided providing medical advice** | ZTP | 10 | **Yes** | "I cannot advise", "not a medical", "consult a professional" |
| 5.3 | Maintained response time | Minor | 2 | No | "responding promptly", "answered quickly" |
| 5.4 | Demonstrated soft skills | Minor | 2 | No | "active listening", "clear communication", "professional" |
| 5.5 | Adhered to SOP/tools | Major | 5 | No | "using CTM", "using ZohoChat", "approved tools" |

**Total possible: 105 points across 25 criteria**

---

## Severity Levels Explained

| Severity | Points | Deduction if Failed | ZTP Flag | Auto-Fail | Notes |
|---|---|---|---|---|---|
| **Minor** | 2 | -2 | No | No | Small coaching opportunities |
| **Major** | 5 | -5 | No | No | Requires targeted coaching |
| **ZTP** | 10 | -10 | **Yes** | **Yes** | Zero-Tolerance Policy — single violation auto-fails the call |

### What is ZTP (Zero-Tolerance Policy)?

Three criteria carry **zero-tolerance** status:

- **3.4 — Avoided Unqualified Transfers**: Agents must NOT transfer callers with state insurance, self-pay, out-of-state, VA, or Kaiser. Transferring these callers wastes facility resources.
- **5.1 — HIPAA Compliance**: Agents must NOT share caller information unauthorized. A single HIPAA breach carries legal liability.
- **5.2 — No Medical Advice**: Agents must NOT give detox advice, withdrawal guidance, dosage recommendations, or treatment referrals. Doing so creates clinical and legal risk.

When a ZTP criterion fails:
1. The call is **immediately set to score 0** regardless of other performance
2. The call is **auto-failed** — disposition becomes "Critical violation - Requires supervisor review"
3. A `ztp-violation` tag is added to the call record

If **2 or more ZTP criteria fail**, the call is also set to score 0.

---

## Scoring Mechanism

### Step 1 — Per-Category Breakdown

Each criterion contributes its point value to its category max. The `calculateBreakdown()` function builds this:

```
Opening:    2 + 2 + 5 + 5 = 14 pts max
Probing:    5 + 5 + 5 + 2 + 2 = 19 pts max
Qualification: 5 + 5 + 5 + 10(ZTP) + 5 + 5 + 2 = 37 pts max
Closing:    2 + 5 + 5 + 2 = 14 pts max
Compliance: 10(ZTP) + 10(ZTP) + 2 + 2 + 5 = 29 pts max
─────────────────────────────────────────────
TOTAL MAX:                              113 pts
```

### Step 2 — Overall Score Calculation

```
score = (total_points_earned / total_points_possible) × 100
```

The score is rounded to the nearest integer.

**Auto-fail shortcut**: If `autoFailed === true` OR `ztpFailures >= 2`, score is forced to **0**.

### Step 3 — Sentiment Derivation

Sentiment is derived directly from the score:

| Score Range | Sentiment | Classification |
|---|---|---|
| 70–100 | Positive | Warm Lead |
| 40–69 | Neutral | Unqualified/Refer |
| 0–39 | Negative | Cold / Auto-fail |

---

## Disposition Logic

Disposition is the **lead qualification recommendation** based on rubric results and score:

```
If auto-failed (ZTP violation):
  → "Auto-fail: Critical violation - Requires supervisor review"

If 3.4 failed (unqualified transfer attempted):
  → "Unqualified - Do not transfer (state insurance/self-pay/out-of-state/VA/Kaiser)"

If score >= 80:
  → "Qualified Lead - Transfer to treatment facility (tag: Qualified Transfer, 4 stars)"

If score >= 60:
  → "Warm Lead - Provide resources and schedule callback (3 stars)"

If score >= 40:
  → "Refer - Provide SAMHSA/988 and general resources (2 stars)"

If score < 40:
  → "Do Not Refer - Outside scope or not interested (1 star)"
```

---

## Tags Generated

Tags provide at-a-glance classification. They are stored as a JSON array on each call:

| Tag | Trigger Condition |
|---|---|
| `excellent` | Score ≥ 85 |
| `good` | Score ≥ 70 |
| `needs-improvement` | Score ≥ 50 |
| `poor` | Score < 50 |
| `opening-gap` | Any Opening criterion failed |
| `probing-gap` | Any Probing criterion failed |
| `qualification-gap` | Any Qualification criterion failed |
| `closing-gap` | Any Closing criterion failed |
| `compliance-gap` | Any Compliance criterion failed |
| `unqualified-transfer` | Criterion 3.4 failed |
| `hipaa-risk` | Criterion 5.1 failed |
| `medical-advice-risk` | Criterion 5.2 failed |
| `ztp-violation` | Any ZTP criterion failed |
| `insurance:{type}` | Detected insurance (medicaid/medicare/tricare/kaiser/private/self-pay) |
| `state:{name}` | Detected US state in caller communication |

---

## Data Extraction Functions

Beyond rubric scoring, the system extracts structured data from the transcript:

### `extractNames()`
- Pattern: `my name is`, `I'm`, `this is`, `name's`, `they call me` + capitalized name
- Returns: unique first names mentioned by the caller

### `extractLocations()`
- Matches all 50 US states against the transcript text
- Returns: unique state names mentioned

### `detectInsurance()`
Scans for insurance keywords in priority order:
1. `medicaid` → `"medicaid"`
2. `medicare` → `"medicare"`
3. `tricare` → `"tricare"`
4. `kaiser` → `"kaiser"`
5. `private`, `blue cross`, `aetna`, `cigna`, `united` → `"private"`
6. `self pay`, `self-pay` → `"self-pay"`
7. None found → `""` (empty string)

### `detectCallType()`
Determines the call category:
- `al-anon`: mentions "al-anon" or "family"
- `facility`: mentions "facility" or "treatment center"
- `treatment`: mentions "looking for help" or "addiction"
- `general`: fallback default

---

## Salesforce Notes Format

When a call is analyzed, a one-line summary is generated for CRM logging:

```
QA Score: {score}/100 | {passed}/25 criteria passed | {failed} failed | STATUS: AUTO-FAIL if ZTP | ZTP Violations: {count} | Caller: {firstName} | Critical: {failedIds}
```

Example: `QA Score: 72/100 | 19/25 criteria passed | 6 failed | ZTP Violations: 1 | Caller: Michael | Critical: 1.4, 3.4, 5.2`

---

## API Flow

### `/api/ctm/calls/analyze` (POST)

```
Request:
  { "callIds": ["123456789", "987654321"] }

For each call:
  1. Fetch call from CTM (recording URL)
  2. Transcribe via AssemblyAI (if no transcript exists)
  3. Run analyzeTranscript() — AI + keyword analysis
  4. Upsert results to Supabase (score, sentiment, summary, tags, disposition, rubric_results, rubric_breakdown)

Response:
  {
    success: true,
    results: [
      { callId, success, analysis: { score, sentiment, summary, tags, disposition, rubric_results, rubric_breakdown } },
      ...
    ],
    analyzed: 2,
    updatedInCache: 2
  }
```

### When Analysis Runs

1. **Auto-trigger** (call detail page): When a call with a `recordingUrl` is opened and has no prior analysis, the system auto-triggers transcription → analysis
2. **Manual trigger**: "Run QA Analysis" button on the call detail page
3. **Bulk trigger**: Future batch analysis via the agents dashboard

---

## Live Monitor vs. Historical Analysis

There are **two analysis modes**:

### Live Monitor (Real-Time)
- Uses `AssemblyAIRealtime` WebSocket streaming (browser mic input)
- Keyword-based only — no OpenRouter AI in live mode
- RUBRIC_KEYWORDS subset (12 criteria active in live mode: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 3.7, 5.1, 5.2)
- Scores update in real-time as keywords are detected
- Session is ephemeral — results are shown on-screen but not persisted

### Historical Analysis (Post-Call)
- Uses AssemblyAI v2 transcript API (recorded audio)
- Full 25-criterion rubric
- **AI-enhanced**: Claude-3-Haiku analyzes the complete transcript
- Results are **persisted** to Supabase
- Available on call detail page and history table

---

## Storage Schema (Supabase)

The `calls` table stores analysis results:

```sql
score           INTEGER,       -- 0-100 qualification score
sentiment       TEXT,          -- 'positive' | 'neutral' | 'negative'
summary         TEXT,          -- human-readable call summary
tags            JSONB,         -- array of classification tags
disposition     TEXT,          -- lead qualification recommendation
rubric_results  JSONB,         -- array of 25 CriterionResult objects
rubric_breakdown JSONB,       -- per-category score breakdown
```

### `rubric_results` JSONB shape (per criterion):
```json
{
  "id": "3.4",
  "criterion": "Avoided unqualified transfers",
  "pass": false,
  "ztp": true,
  "autoFail": true,
  "details": "Agent transferred a Medicaid caller to treatment facility",
  "deduction": 0,
  "severity": "ZTP",
  "category": "Qualification"
}
```

### `rubric_breakdown` JSONB shape:
```json
{
  "opening_score": 12,
  "opening_max": 14,
  "probing_score": 17,
  "probing_max": 19,
  "qualification_score_detail": 27,
  "qualification_max": 37,
  "closing_score": 9,
  "closing_max": 14,
  "compliance_score": 19,
  "compliance_max": 29
}
```

---

## Score Thresholds & Coaching Guide

| Score | Color | Classification | Action |
|---|---|---|---|
| 85–100 | Green | Excellent | Recognition, use as training example |
| 70–84 | Green | Good | Minor coaching on gaps |
| 50–69 | Navy | Needs Improvement | Targeted coaching on failed criteria |
| 40–49 | Red | Cold | Full rubric review, re-training required |
| 0 | Red | Auto-fail | Immediate supervisor review, ZTP investigation |

---

## Modifying the Rubric

To add, remove, or change criteria:

1. **Edit `RUBRIC_CRITERIA`** in `lib/ai.ts` — this is the single source of truth
2. Update `buildRubricPrompt()` — the AI prompt text must match the criteria IDs and descriptions exactly
3. The monitor page automatically picks up changes (it imports `RUBRIC_CRITERIA`)
4. The call detail QA card automatically picks up changes
5. Update `RUBRIC_KEYWORDS` in `lib/realtime/assemblyai-realtime.ts` for live monitor keyword coverage
6. Update `docs/QA_RUBRIC.md` to document changes

> **Important**: When modifying criteria, ensure `id` values are unique and match the prompt. The AI parses responses using `CRITERION_ID|PASS/FAIL|reason` format. IDs must match the pattern `^\d+\.\d+$` (e.g., `3.4`, `5.1`).
