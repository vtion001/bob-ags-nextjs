export interface RealtimeTranscript {
  text: string;
  speaker: string;
  timestamp: number;
  confidence: number;
  startTime: number;
  endTime: number;
}

export interface RealtimeInsight {
  id: string;
  type: "pass" | "fail" | "warning" | "info";
  criterion: string;
  criterionId: string;
  category: string;
  message: string;
  timestamp: number;
  autoFail: boolean;
  ztp: boolean;
}

export interface LiveCallState {
  isConnected: boolean;
  isRecording: boolean;
  duration: number;
  transcript: RealtimeTranscript[];
  insights: RealtimeInsight[];
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  criteriaStatus: Record<string, { pass: boolean; triggered: boolean }>;
  score: number;
  callerName?: string;
  callerPhone?: string;
  callerLocation?: string;
  insurance?: string;
  sobrietyTime?: string;
  substance?: string;
  sessionId?: string;
  audioDuration?: number;
}

export interface RubricKeywordConfig {
  pass: string[];
  fail: string[];
  category: string;
  autoFail: boolean;
  ztp: boolean;
}

export interface InsurancePattern {
  pattern: RegExp;
  value: string;
}