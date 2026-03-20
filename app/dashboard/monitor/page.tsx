"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Call } from "@/lib/ctm";
import {
  AssemblyAIRealtime,
  type RealtimeTranscript,
  type RealtimeInsight,
  type LiveCallState,
} from "@/lib/realtime/assemblyai-realtime";

interface MonitorMeta {
  isAdmin: boolean;
  assignedAgentId: string | null;
  assignedGroupId: string | null;
}

const CRITERIA_ORDER = [
  { id: "1.1", label: "Approved Greeting", category: "Opening" },
  { id: "1.2", label: "Caller Name Confirmed", category: "Opening" },
  { id: "1.3", label: "Reason for Call (< 30s)", category: "Opening" },
  { id: "1.4", label: "Location Verified (State)", category: "Opening" },
  { id: "2.1", label: "Sobriety Time Asked", category: "Probing" },
  { id: "2.2", label: "Substance Type Asked", category: "Probing" },
  { id: "2.3", label: "Insurance Type Asked", category: "Probing" },
  { id: "2.4", label: "Concise Additional Info", category: "Probing" },
  { id: "2.5", label: "Phone Number Verified", category: "Probing" },
  {
    id: "3.4",
    label: "Avoided Unqualified Transfers",
    category: "Qualification",
    ztp: true,
  },
  { id: "3.7", label: "Empathy & Professionalism", category: "Qualification" },
  { id: "5.1", label: "HIPAA Compliance", category: "Compliance", ztp: true },
  { id: "5.2", label: "No Medical Advice", category: "Compliance", ztp: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  Opening: "border-l-blue-500 bg-blue-50/50",
  Probing: "border-l-purple-500 bg-purple-50/50",
  Qualification: "border-l-amber-500 bg-amber-50/50",
  Compliance: "border-l-red-500 bg-red-50/50",
};

const CATEGORY_BADGE: Record<string, string> = {
  Opening: "bg-blue-100 text-blue-700",
  Probing: "bg-purple-100 text-purple-700",
  Qualification: "bg-amber-100 text-amber-700",
  Compliance: "bg-red-100 text-red-700",
};

export default function MonitorPage() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [monitorMeta, setMonitorMeta] = useState<MonitorMeta>({
    isAdmin: true,
    assignedAgentId: null,
    assignedGroupId: null,
  });
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
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCallData, setSelectedCallData] = useState<Call | null>(null);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [pollingInterval] = useState(5);
  const realtimeRef = useRef<AssemblyAIRealtime | null>(null);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [criteriaExpanded, setCriteriaExpanded] = useState(true);
  const autoStartDoneRef = useRef(false);

  const extractGroup = (
    agentName: string | undefined,
    source?: string,
  ): string => {
    if (!agentName || agentName === "Unknown Agent") {
      if (source) return source;
      return "Unassigned";
    }
    const parts = agentName.split(" - ");
    return parts.length > 1 ? parts[parts.length - 1].trim() : "General";
  };

  const groups = React.useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const call of activeCalls) {
      const group = extractGroup(call.agent?.name, call.source);
      if (!seen.has(group)) {
        seen.add(group);
        list.push(group);
      }
    }
    return list.sort();
  }, [activeCalls]);

  const filteredCalls = React.useMemo(() => {
    if (selectedGroup === "All") return activeCalls;
    return activeCalls.filter(
      (call) => extractGroup(call.agent?.name, call.source) === selectedGroup,
    );
  }, [activeCalls, selectedGroup]);

  const fetchActiveCalls = useCallback(async () => {
    try {
      setCallsError(null);
      const params = new URLSearchParams();
      if (monitorMeta.assignedAgentId)
        params.set("agentId", monitorMeta.assignedAgentId);
      if (monitorMeta.assignedGroupId)
        params.set("groupId", monitorMeta.assignedGroupId);

      const url = `/api/ctm/monitor/active-calls${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        setCallsError(`API error: ${res.status} ${res.statusText}`);
        return;
      }
      const data = await res.json();
      if (data.error) {
        setCallsError(data.error);
        return;
      }
      const calls: Call[] = data.calls || [];
      setActiveCalls(calls);

      const isAdmin = data.meta?.isAdmin ?? true;
      const assignedAgentId = data.meta?.assignedAgentId ?? null;
      const assignedGroupId = data.meta?.assignedGroupId ?? null;
      setMonitorMeta({ isAdmin, assignedAgentId, assignedGroupId });

      if (
        !isAdmin &&
        !selectedCallId &&
        !autoStartDoneRef.current &&
        calls.length > 0
      ) {
        autoStartDoneRef.current = true;
        setSelectedCallId(calls[0].id);
        setSelectedCallData(calls[0]);
      }
    } catch (err) {
      console.error("Error fetching active calls:", err);
      setCallsError(String(err));
    }
  }, [
    monitorMeta.assignedAgentId,
    monitorMeta.assignedGroupId,
    selectedCallId,
  ]);

  useEffect(() => {
    fetchActiveCalls();
    const interval = setInterval(fetchActiveCalls, pollingInterval * 1000);
    return () => clearInterval(interval);
  }, [pollingInterval, fetchActiveCalls]);

  const handleStartMonitoring = async () => {
    const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;
    console.log(
      "[BOB Monitor] START - apiKey:",
      apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING/EMPTY",
    );
    console.log("[BOB Monitor] START - selectedCallId:", selectedCallId);
    console.log(
      "[BOB Monitor] START - NEXT_PUBLIC_ASSEMBLYAI_API_KEY env:",
      JSON.stringify(process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY),
    );

    if (!apiKey) {
      const msg =
        "AssemblyAI API key not configured. NEXT_PUBLIC_ASSEMBLYAI_API_KEY is empty.";
      console.error("[BOB Monitor]", msg);
      setError(msg);
      return;
    }

    setError(null);
    setIsMonitoring(true);
    setIsRecording(true);
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

    const rt = new AssemblyAIRealtime({
      apiKey,
      onTranscript: (t: RealtimeTranscript) => {
        setLiveState((prev) => ({
          ...prev,
          transcript: [...(prev.transcript || []), t],
        }));
        setTimeout(
          () =>
            transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      },
      onInsight: (i: RealtimeInsight) => {
        setRecentInsights((prev) => [i, ...prev].slice(0, 50));
        setLiveState((prev) => ({
          ...prev,
          insights: [i, ...(prev.insights || [])].slice(0, 50),
        }));
      },
      onStateChange: (s: Partial<LiveCallState>) => {
        console.log("[BOB Monitor] stateChange:", JSON.stringify(s));
        setLiveState((prev) => ({ ...prev, ...s }));
      },
      onError: (e: Error) => {
        console.error("[BOB Monitor] AssemblyAI error:", e.message);
        setError(e.message);
        setIsRecording(false);
      },
      onClose: () => {
        console.log("[BOB Monitor] AssemblyAI WebSocket closed");
        setIsRecording(false);
        setIsMonitoring(false);
      },
    });

    realtimeRef.current = rt;

    try {
      console.log("[BOB Monitor] Connecting to AssemblyAI WebSocket...");
      await rt.connect(selectedCallId || undefined);
      console.log("[BOB Monitor] AssemblyAI WebSocket connected!");
    } catch (err) {
      console.error("[BOB Monitor] Connect failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start monitoring",
      );
      setIsMonitoring(false);
      setIsRecording(false);
    }

    durationRef.current = setInterval(() => {
      setLiveState((prev) => ({
        ...prev,
        duration: (prev.duration || 0) + 1,
      }));
    }, 1000);
  };

  const handleStopMonitoring = () => {
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
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 bg-green-50 border-green-200";
      case "negative":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "pass":
        return (
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "fail":
        return (
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "pass":
        return "bg-green-50 border-green-200 text-green-800";
      case "fail":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const byCategory = (category: string) =>
    CRITERIA_ORDER.filter((c) => c.category === category);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-navy-900 mb-1">
                Live Monitor
              </h1>
              <p className="text-navy-500">
                Real-time call analysis powered by AssemblyAI
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isMonitoring ? (
                <>
                  {selectedCallData ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-navy-50 border border-navy-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-navy-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="text-sm font-semibold text-navy-900">
                          {selectedCallData.agent?.name || "Unknown Agent"}
                        </span>
                      </div>
                      <div className="w-px h-4 bg-navy-200" />
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-navy-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="text-xs text-navy-600 font-mono">
                          {selectedCallData.trackingNumber ||
                            selectedCallData.phone}
                        </span>
                      </div>
                      {selectedCallData.destinationNumber && (
                        <>
                          <div className="w-px h-4 bg-navy-200" />
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-navy-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="text-xs text-navy-600 font-mono">
                              {selectedCallData.destinationNumber}
                            </span>
                          </div>
                        </>
                      )}
                      {selectedCallData.trackingLabel && (
                        <>
                          <div className="w-px h-4 bg-navy-200" />
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">
                            {selectedCallData.trackingLabel}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-navy-400 italic px-3">
                      Select a call from the list below to monitor
                    </span>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleStartMonitoring}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    Start Live Analysis
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleStopMonitoring}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Stop Monitoring
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {!isMonitoring ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 rounded-2xl bg-navy-100 flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-10 h-10 text-navy-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-navy-900 mb-3">
                      Real-Time Call Analysis
                    </h2>
                    <p className="text-navy-500 mb-8">
                      Click &quot;Start Live Analysis&quot; to begin real-time
                      transcription and QA scoring. The microphone will capture
                      audio and AssemblyAI will provide instant insights as the
                      call progresses.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left">
                      {[
                        {
                          icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                          label: "Live Transcription",
                          desc: "Real-time speaker detection",
                        },
                        {
                          icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                          label: "Live QA Scoring",
                          desc: "25-criteria real-time evaluation",
                        },
                        {
                          icon: "M13 10V3L4 14h7v7l9-11h-7z",
                          label: "Instant Insights",
                          desc: "Flag pass/fail as call happens",
                        },
                        {
                          icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                          label: "Duration Tracking",
                          desc: "Know exactly where you are",
                        },
                      ].map((feature) => (
                        <div
                          key={feature.label}
                          className="flex items-start gap-3 p-3 rounded-lg bg-navy-50"
                        >
                          <svg
                            className="w-5 h-5 text-navy-600 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={feature.icon}
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-navy-900">
                              {feature.label}
                            </p>
                            <p className="text-xs text-navy-500">
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
              <div>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-navy-900">
                      Active Calls
                    </h3>
                    {groups.length > 1 && (
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="text-xs border border-navy-200 rounded-lg px-2 py-1.5 bg-white text-navy-700 font-medium focus:outline-none focus:ring-2 focus:ring-navy-300 cursor-pointer"
                      >
                        <option value="All">
                          All Groups ({activeCalls.length})
                        </option>
                        {groups.map((group) => (
                          <option key={group} value={group}>
                            {group} (
                            {
                              activeCalls.filter(
                                (c) => extractGroup(c.agent?.name) === group,
                              ).length
                            }
                            )
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {callsError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      <p className="font-semibold mb-1">Error loading calls:</p>
                      <p>{callsError}</p>
                      <p className="mt-1 text-red-600">
                        User:{" "}
                        {monitorMeta.isAdmin
                          ? "Admin (dev)"
                          : `Agent ID: ${monitorMeta.assignedAgentId || "none"}, Group: ${monitorMeta.assignedGroupId || "none"}`}
                      </p>
                    </div>
                  )}
                  {filteredCalls.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs text-navy-400 mb-2">
                        {selectedGroup === "All"
                          ? monitorMeta.isAdmin
                            ? "Admin view — all agents"
                            : `Filtered: agent ${monitorMeta.assignedAgentId || "all"}, group ${monitorMeta.assignedGroupId || "all"}`
                          : `Showing: ${selectedGroup} (${filteredCalls.length} of ${activeCalls.length} calls)`}
                      </div>
                      {filteredCalls.map((call, idx) => {
                        const isSelected = selectedCallId === call.id;
                        return (
                          <button
                            key={`${call.id}-${idx}`}
                            onClick={() => {
                              setSelectedCallId(call.id);
                              setSelectedCallData(call);
                            }}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              isSelected
                                ? "bg-navy-900 text-white border-navy-900 shadow-md"
                                : "bg-white hover:bg-navy-50 border-navy-100 hover:border-navy-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-mono font-bold text-base truncate ${isSelected ? "text-white" : "text-navy-900"}`}
                                >
                                  {call.phone}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <svg
                                    className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-white/60" : "text-navy-400"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                  <p
                                    className={`text-xs font-semibold truncate ${isSelected ? "text-white/90" : "text-navy-700"}`}
                                  >
                                    {call.agent?.name || "Unknown Agent"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span
                                  className={`text-xs font-mono ${isSelected ? "text-white/70" : "text-navy-400"}`}
                                >
                                  {formatDuration(call.duration || 0)}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              {call.trackingNumber && (
                                <div className="flex items-center gap-1.5">
                                  <svg
                                    className={`w-3 h-3 flex-shrink-0 ${isSelected ? "text-green-400" : "text-green-600"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                  </svg>
                                  <span
                                    className={`text-xs ${isSelected ? "text-white/70" : "text-navy-500"}`}
                                  >
                                    <span
                                      className={`font-medium ${isSelected ? "text-white/50" : "text-navy-400"}`}
                                    >
                                      Called:{" "}
                                    </span>
                                    <span className="font-mono">
                                      {call.trackingNumber}
                                    </span>
                                  </span>
                                </div>
                              )}
                              {call.destinationNumber && (
                                <div className="flex items-center gap-1.5">
                                  <svg
                                    className={`w-3 h-3 flex-shrink-0 ${isSelected ? "text-blue-400" : "text-blue-600"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  <span
                                    className={`text-xs ${isSelected ? "text-white/70" : "text-navy-500"}`}
                                  >
                                    <span
                                      className={`font-medium ${isSelected ? "text-white/50" : "text-navy-400"}`}
                                    >
                                      Route to:{" "}
                                    </span>
                                    <span className="font-mono">
                                      {call.destinationNumber}
                                    </span>
                                  </span>
                                </div>
                              )}
                              {call.poolNumber && (
                                <div className="flex items-center gap-1.5">
                                  <svg
                                    className={`w-3 h-3 flex-shrink-0 ${isSelected ? "text-purple-400" : "text-purple-600"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2M5 11a2 2 0 00-2 2v6a2 2 0 002 2m14-10V5a2 2 0 00-2-2M9 7a2 2 0 100-4 2 2 0 000 4zM7 3v4M11 3v4M15 3v4"
                                    />
                                  </svg>
                                  <span
                                    className={`text-xs ${isSelected ? "text-white/70" : "text-navy-500"}`}
                                  >
                                    <span
                                      className={`font-medium ${isSelected ? "text-white/50" : "text-navy-400"}`}
                                    >
                                      Pool:{" "}
                                    </span>
                                    <span className="font-mono">
                                      {call.poolNumber}
                                    </span>
                                  </span>
                                </div>
                              )}
                              {call.trackingLabel && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <svg
                                    className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-white/60" : "text-navy-400"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                  <p
                                    className={`text-xs font-semibold truncate ${isSelected ? "text-white/90" : "text-navy-700"}`}
                                  >
                                    {call.agent?.name || "Unknown Agent"}
                                  </p>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? "bg-white/20 text-white/80" : "bg-navy-100 text-navy-500"}`}
                                  >
                                    {extractGroup(
                                      call.agent?.name,
                                      call.source,
                                    )}
                                  </span>
                                </div>
                              )}
                              {call.source && (
                                <div className="flex items-center gap-1.5">
                                  <svg
                                    className={`w-3 h-3 flex-shrink-0 ${isSelected ? "text-cyan-400" : "text-cyan-600"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                    />
                                  </svg>
                                  <span
                                    className={`text-xs truncate ${isSelected ? "text-white/70" : "text-navy-500"}`}
                                  >
                                    <span
                                      className={`font-medium ${isSelected ? "text-white/50" : "text-navy-400"}`}
                                    >
                                      Source:{" "}
                                    </span>
                                    {call.source}
                                  </span>
                                </div>
                              )}
                            </div>

                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-white/20">
                                <span className="text-xs text-white/60 font-medium">
                                  Click Start Live Analysis to begin monitoring
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : activeCalls.length === 0 ? (
                    <>
                      <p className="text-navy-400 text-sm text-center py-6">
                        No active calls detected.
                        <br />
                        Select a call above, or start analysis to test the
                        microphone.
                      </p>
                      <button
                        onClick={handleStartMonitoring}
                        className="w-full mt-2 px-4 py-2 text-sm border-2 border-dashed border-navy-200 rounded-lg text-navy-500 hover:border-navy-400 hover:text-navy-600 transition-colors"
                      >
                        Test Microphone
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-navy-400 text-sm">
                        No calls for group <strong>{selectedGroup}</strong>
                      </p>
                      <button
                        onClick={() => setSelectedGroup("All")}
                        className="mt-2 text-xs text-navy-600 underline hover:text-navy-800"
                      >
                        Show all groups
                      </button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 space-y-4">
                <Card className="p-0 overflow-hidden">
                  <div className="p-4 border-b border-navy-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-slate-400"}`}
                        />
                        <span className="text-sm font-semibold text-navy-900">
                          {isRecording ? "Recording" : "Connecting..."}
                        </span>
                      </div>
                      {liveState.duration !== undefined &&
                        liveState.duration > 0 && (
                          <span className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded text-sm font-mono">
                            {formatDuration(liveState.duration)}
                          </span>
                        )}
                      {selectedCallData?.agent?.name && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-sm font-semibold">
                          {selectedCallData.agent.name}
                          <span className="ml-1.5 text-xs font-normal opacity-70">
                            {extractGroup(selectedCallData.agent.name)}
                          </span>
                        </span>
                      )}
                      {selectedCallData?.trackingNumber && (
                        <span className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded text-sm font-mono">
                          {selectedCallData.trackingNumber}
                        </span>
                      )}
                      {selectedCallData?.destinationNumber && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-sm font-mono">
                          → {selectedCallData.destinationNumber}
                        </span>
                      )}
                      {selectedCallData?.trackingLabel && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-sm font-medium">
                          {selectedCallData.trackingLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {liveState.sentiment && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSentimentColor(liveState.sentiment)}`}
                        >
                          {liveState.sentiment === "positive"
                            ? "Positive"
                            : liveState.sentiment === "negative"
                              ? "Negative"
                              : "Neutral"}
                        </span>
                      )}
                      {liveState.score !== undefined && (
                        <span
                          className={`text-xl font-bold ${getScoreColor(liveState.score)}`}
                        >
                          {liveState.score}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-[400px] overflow-y-auto p-4 bg-slate-50/50">
                    {(liveState.transcript || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center mb-3 animate-pulse">
                          <svg
                            className="w-6 h-6 text-navy-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                        </div>
                        <p className="text-navy-500 font-medium">
                          Waiting for audio...
                        </p>
                        <p className="text-navy-400 text-sm">
                          Start speaking to see the transcript
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-navy-200">
                            <div className="w-6 h-6 rounded-full bg-navy-900 flex items-center justify-center text-xs font-bold text-white">
                              A
                            </div>
                            <span className="text-sm font-semibold text-navy-900">
                              Agent
                            </span>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-3">
                            {(liveState.transcript || [])
                              .filter((t) => t.speaker === "Agent")
                              .map((t, i) => (
                                <div key={i} className="flex gap-2">
                                  <div className="flex-1">
                                    <div className="inline-block px-3 py-2 rounded-2xl rounded-bl-sm text-sm bg-navy-900 text-white">
                                      {t.text}
                                    </div>
                                    <p className="text-xs mt-1 text-navy-400">
                                      {formatDuration(t.startTime)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            {(liveState.transcript || []).filter(
                              (t) => t.speaker === "Agent",
                            ).length === 0 && (
                              <p className="text-sm text-navy-400 italic">
                                Agent messages will appear here
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col border-l border-navy-200 pl-4">
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-navy-200">
                            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                              C
                            </div>
                            <span className="text-sm font-semibold text-navy-900">
                              Caller
                            </span>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-3">
                            {(liveState.transcript || [])
                              .filter((t) => t.speaker === "Caller")
                              .map((t, i) => (
                                <div key={i} className="flex gap-2">
                                  <div className="flex-1">
                                    <div className="inline-block px-3 py-2 rounded-2xl rounded-br-sm text-sm bg-purple-100 text-navy-900">
                                      {t.text}
                                    </div>
                                    <p className="text-xs mt-1 text-navy-400">
                                      {formatDuration(t.startTime)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            {(liveState.transcript || []).filter(
                              (t) => t.speaker === "Caller",
                            ).length === 0 && (
                              <p className="text-sm text-navy-400 italic">
                                Caller messages will appear here
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                  <button
                    onClick={() => setInsightsExpanded(!insightsExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-navy-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <h3 className="text-lg font-bold text-navy-900">
                        Live Insights
                      </h3>
                      {recentInsights.length > 0 && (
                        <span className="px-2 py-0.5 bg-navy-900 text-white text-xs rounded-full">
                          {recentInsights.length}
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-navy-400 transition-transform ${insightsExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {insightsExpanded && (
                    <div className="max-h-60 overflow-y-auto divide-y divide-navy-100">
                      {recentInsights.length === 0 ? (
                        <p className="text-navy-400 text-sm text-center py-6">
                          Insights will appear as the call progresses
                        </p>
                      ) : (
                        recentInsights.map((insight) => (
                          <div
                            key={insight.id}
                            className={`px-4 py-3 flex items-start gap-3 ${getInsightColor(insight.type)}`}
                          >
                            <span
                              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                insight.type === "pass"
                                  ? "bg-green-500 text-white"
                                  : insight.type === "fail"
                                    ? "bg-red-500 text-white"
                                    : insight.type === "warning"
                                      ? "bg-amber-500 text-white"
                                      : "bg-blue-500 text-white"
                              }`}
                            >
                              {getInsightIcon(insight.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded font-semibold ${CATEGORY_BADGE[insight.category] || "bg-gray-100 text-gray-700"}`}
                                >
                                  {insight.category}
                                </span>
                                <span className="text-sm font-semibold text-navy-900">
                                  {insight.criterion}
                                </span>
                                {insight.ztp && (
                                  <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">
                                    ZTP
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-navy-600 mt-0.5 truncate">
                                {insight.message}
                              </p>
                            </div>
                            <span className="text-xs text-navy-400 flex-shrink-0">
                              {formatDuration(insight.timestamp)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              </div>

              <div className="xl:col-span-5 space-y-4">
                <Card className="p-0 overflow-hidden">
                  <button
                    onClick={() => setCriteriaExpanded(!criteriaExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-navy-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      <h3 className="text-lg font-bold text-navy-900">
                        QA Checklist
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${getScoreColor(liveState.score || 100)}`}
                      >
                        {liveState.score || 100}%
                      </span>
                      <svg
                        className={`w-5 h-5 text-navy-400 transition-transform ${criteriaExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                  {criteriaExpanded && (
                    <div className="divide-y divide-navy-100">
                      {[
                        "Opening",
                        "Probing",
                        "Qualification",
                        "Compliance",
                      ].map((category) => (
                        <div key={category}>
                          <div
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-l-4 ${CATEGORY_COLORS[category]}`}
                          >
                            {category}
                          </div>
                          {byCategory(category).map((criterion) => {
                            const status =
                              liveState.criteriaStatus?.[criterion.id];
                            const isPending = !status?.triggered;
                            const isPass = status?.triggered && status.pass;
                            const isFail = status?.triggered && !status.pass;

                            return (
                              <div
                                key={criterion.id}
                                className="px-4 py-2.5 flex items-center gap-3"
                              >
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isPass
                                      ? "bg-green-500 text-white"
                                      : isFail
                                        ? "bg-red-500 text-white"
                                        : "bg-slate-200"
                                  }`}
                                >
                                  {isPass ? (
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  ) : isFail ? (
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm ${isFail ? "text-red-700 font-medium" : isPass ? "text-green-700" : "text-navy-600"}`}
                                  >
                                    {criterion.label}
                                  </p>
                                </div>
                                {criterion.ztp && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">
                                    ZTP
                                  </span>
                                )}
                                <span className="text-[10px] text-navy-400 font-mono">
                                  {criterion.id}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-0 overflow-hidden">
                  <div className="p-4 border-b border-navy-100">
                    <h3 className="text-lg font-bold text-navy-900">
                      Call Details
                    </h3>
                  </div>
                  <div className="divide-y divide-navy-100">
                    {[
                      {
                        label: "Agent",
                        value:
                          selectedCallData?.agent?.name || liveState.callerName,
                        icon: "👤",
                        highlight: true,
                      },
                      {
                        label: "Tracking Number",
                        value:
                          selectedCallData?.trackingNumber ||
                          liveState.callerPhone,
                        icon: "📞",
                      },
                      {
                        label: "Destination",
                        value: selectedCallData?.destinationNumber || null,
                        icon: "📍",
                      },
                      {
                        label: "Pool Number",
                        value: selectedCallData?.poolNumber || null,
                        icon: "🔗",
                      },
                      {
                        label: "Source / Label",
                        value:
                          selectedCallData?.trackingLabel ||
                          selectedCallData?.source ||
                          null,
                        icon: "🏷️",
                      },
                      {
                        label: "Caller Location",
                        value: liveState.callerLocation,
                        icon: "🗺️",
                      },
                      {
                        label: "Insurance Type",
                        value: liveState.insurance,
                        icon: "🏥",
                      },
                      {
                        label: "Duration",
                        value:
                          liveState.duration !== undefined
                            ? formatDuration(liveState.duration)
                            : null,
                        icon: "⏱️",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="px-4 py-3 flex items-center gap-3"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-navy-500">{item.label}</p>
                          <p
                            className={`text-sm font-semibold truncate ${item.value ? (item.highlight ? "text-navy-900" : "text-navy-800") : "text-navy-300"}`}
                          >
                            {item.value || "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-bold text-navy-900 mb-3">
                    Score Progress
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-navy-500">
                      <span>QA Score</span>
                      <span
                        className={`font-bold ${getScoreColor(liveState.score || 100)}`}
                      >
                        {liveState.score || 100}%
                      </span>
                    </div>
                    <div className="h-3 bg-navy-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (liveState.score || 100) >= 85
                            ? "bg-green-500"
                            : (liveState.score || 100) >= 70
                              ? "bg-blue-500"
                              : (liveState.score || 100) >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                        }`}
                        style={{ width: `${liveState.score || 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-navy-500">
                      <span>Criteria</span>
                      <span>
                        {
                          Object.values(liveState.criteriaStatus || {}).filter(
                            (s) => s.triggered,
                          ).length
                        }{" "}
                        / {CRITERIA_ORDER.length}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
