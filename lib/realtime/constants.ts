import { RubricKeywordConfig, InsurancePattern } from './types'

export const RUBRIC_KEYWORDS: Record<string, RubricKeywordConfig> = {
  "1.1": {
    pass: ["hello flyland", "flyland this is"],
    fail: ["hi there", "flyland help line"],
    category: "Opening",
    autoFail: false,
    ztp: false,
  },
  "1.2": {
    pass: ["what's your name", "can i get your name", "may i have your name"],
    fail: [],
    category: "Opening",
    autoFail: false,
    ztp: false,
  },
  "1.3": {
    pass: ["how can i help", "what brings you", "reason for your call"],
    fail: ["assumed reason"],
    category: "Opening",
    autoFail: false,
    ztp: false,
  },
  "1.4": {
    pass: ["what state", "which state", "state are you"],
    fail: [],
    category: "Opening",
    autoFail: false,
    ztp: false,
  },
  "2.1": {
    pass: ["last drink", "last drug use", "when was your last"],
    fail: ["how long sober"],
    category: "Probing",
    autoFail: false,
    ztp: false,
  },
  "2.2": {
    pass: ["what substance", "struggling with", "alcohol drugs"],
    fail: ["detox advice"],
    category: "Probing",
    autoFail: false,
    ztp: false,
  },
  "2.3": {
    pass: ["type of insurance", "private or state", "medicaid", "medicare"],
    fail: ["do you have insurance"],
    category: "Probing",
    autoFail: false,
    ztp: false,
  },
  "2.4": {
    pass: ["openness to help", "facility name"],
    fail: ["repeated questions"],
    category: "Probing",
    autoFail: false,
    ztp: false,
  },
  "2.5": {
    pass: ["best number", "phone number", "reach you"],
    fail: [],
    category: "Probing",
    autoFail: false,
    ztp: false,
  },
  "3.4": {
    pass: [],
    fail: [
      "transfer state insurance",
      "transfer self-pay",
      "transfer out-of-state",
    ],
    category: "Qualification",
    autoFail: true,
    ztp: true,
  },
  "3.7": {
    pass: ["i understand", "thank you for", "that's understandable"],
    fail: ["irritation", "dismissive"],
    category: "Qualification",
    autoFail: false,
    ztp: false,
  },
  "5.1": {
    pass: ["hipaa", "confidential"],
    fail: ["shares info unauthorized"],
    category: "Compliance",
    autoFail: true,
    ztp: true,
  },
  "5.2": {
    pass: ["i cannot advise", "not a medical"],
    fail: ["detox advice", "withdrawal advice", "treatment recommendation"],
    category: "Compliance",
    autoFail: true,
    ztp: true,
  },
};

export const INSURANCE_PATTERNS: InsurancePattern[] = [
  { pattern: /medicaid/i, value: "medicaid" },
  { pattern: /medicare/i, value: "medicare" },
  { pattern: /tricare/i, value: "tricare" },
  { pattern: /kaiser/i, value: "kaiser" },
  { pattern: /private|brown|blue cross|aetna|cigna|united/i, value: "private" },
  { pattern: /self.pay|self pay/i, value: "self-pay" },
];

export const STATE_PATTERNS =
  /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/i;

export const NAME_PATTERNS = [
  /(?:my name is|I'm|this is|name's|they call me)\s+([A-Z][a-z]+)/i,
  /(?:caller|calling)\s+([A-Z][a-z]+)/i,
];

export const POSITIVE_WORDS = [
  "thank you",
  "appreciate",
  "helpful",
  "great",
  "perfect",
  "wonderful",
];

export const NEGATIVE_WORDS = [
  "frustrated",
  "angry",
  "upset",
  "disappointed",
  "terrible",
  "worst",
];

export const CRITERION_NAMES: Record<string, string> = {
  "1.1": "Approved Greeting",
  "1.2": "Caller Name Confirmed",
  "1.3": "Reason for Call Identified",
  "1.4": "Location Verified",
  "2.1": "Sobriety Time Asked",
  "2.2": "Substance Type Asked",
  "2.3": "Insurance Type Asked",
  "2.4": "Additional Info Gathered",
  "2.5": "Phone Number Verified",
  "3.4": "Qualified Transfer",
  "3.7": "Empathy Shown",
  "5.1": "HIPAA Compliance",
  "5.2": "No Medical Advice",
};