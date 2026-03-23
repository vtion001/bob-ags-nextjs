import { useState, useCallback, useRef, useEffect } from "react";
import {
  AssemblyAIRealtime,
  type RealtimeTranscript,
  type RealtimeInsight,
  type LiveCallState,
} from "@/lib/realtime";

interface UseLiveAnalysisOptions {
  onError?: (error: string) => void;
  onClose?: () => void;
}

interface UseLiveAnalysisReturn {
  isMonitoring: boolean;
  isRecording: boolean;
  liveState: Partial<LiveCallState>;
  recentInsights: RealtimeInsight[];
  error: string | null;
  startMonitoring: (callId?: string) => Promise<void>;
  stopMonitoring: () => void;
}

export function useLiveAnalysis(options: UseLiveAnalysisOptions = {}): UseLiveAnalysisReturn {
  const { onError, onClose } = options;

  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);
  onErrorRef.current = onError;
  onCloseRef.current = onClose;

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveState, setLiveState] = useState<Partial<LiveCallState>>({
    isConnected: false,
    isRecording: false,
    duration: 0,
    transcript: [],
    insights: [],
    sentiment: "neutral",
    sentimentScore: 50,
    criteriaStatus: {},
    score: 100,
  });
  const [recentInsights, setRecentInsights] = useState<RealtimeInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const realtimeRef = useRef<AssemblyAIRealtime | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const startingRef = useRef(false);

  const startMonitoring = useCallback(async (callId?: string) => {
    if (startingRef.current) return;
    startingRef.current = true;

    try {
      const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;

      if (!apiKey) {
        const errMsg = "AssemblyAI API key not configured. Check NEXT_PUBLIC_ASSEMBLYAI_API_KEY in your environment variables.";
        setError(errMsg);
        onErrorRef.current?.(errMsg);
        return;
      }

      setError(null);
      setIsMonitoring(true);
      setIsRecording(false);
      setLiveState({
        isConnected: false,
        isRecording: false,
        duration: 0,
        transcript: [],
        insights: [],
        sentiment: "neutral",
        sentimentScore: 50,
        criteriaStatus: {},
        score: 100,
      });
      setRecentInsights([]);

      console.log('[LiveAnalysis] Creating AssemblyAIRealtime instance...');
      const rt = new AssemblyAIRealtime({
        apiKey,
        onTranscript: (t: RealtimeTranscript) => {
          setLiveState((prev) => ({
            ...prev,
            transcript: [...(prev.transcript || []), t],
          }));
        },
        onInsight: (i: RealtimeInsight) => {
          setRecentInsights((prev) => [i, ...prev].slice(0, 50));
          setLiveState((prev) => ({
            ...prev,
            insights: [i, ...(prev.insights || [])].slice(0, 50),
          }));
        },
        onStateChange: (s: Partial<LiveCallState>) => {
          setLiveState((prev) => ({ ...prev, ...s }));
        },
        onError: (e: Error) => {
          console.error('[LiveAnalysis] onError:', e.message);
          setError(e.message);
          setIsRecording(false);
          setIsMonitoring(false);
          onErrorRef.current?.(e.message);
        },
        onClose: () => {
          console.log('[LiveAnalysis] onClose called');
          setIsRecording(false);
          setIsMonitoring(false);
          onCloseRef.current?.();
        },
      });

      realtimeRef.current = rt;
      console.log('[LiveAnalysis] Calling rt.connect()...');

      try {
        await rt.connect(callId || undefined);
        console.log('[LiveAnalysis] rt.connect() completed successfully');
      } catch (err) {
        console.error('[LiveAnalysis] rt.connect() threw error:', err);
        const errMsg = err instanceof Error ? err.message : "Failed to start live analysis. Please check your microphone and API key.";
        setError(errMsg);
        setIsMonitoring(false);
        setIsRecording(false);
        onErrorRef.current?.(errMsg);
      }

      durationRef.current = setInterval(() => {
        setLiveState((prev) => ({
          ...prev,
          duration: (prev.duration || 0) + 1,
        }));
      }, 1000);
    } finally {
      startingRef.current = false;
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    if (realtimeRef.current) {
      realtimeRef.current.stop();
      realtimeRef.current = null;
    }
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
    setIsMonitoring(false);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.stop();
      }
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, []);

  return {
    isMonitoring,
    isRecording,
    liveState,
    recentInsights,
    error,
    startMonitoring,
    stopMonitoring,
  };
}
