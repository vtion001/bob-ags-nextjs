"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Call } from "@/lib/ctm";
import { RUBRIC_CRITERIA } from "@/lib/ai";
import { useLiveAnalysis } from "@/hooks/monitor";
import AgentAssistantPanel from "@/components/call-detail/AgentAssistantPanel";
import NotesDispositionPanel from "@/components/call-detail/NotesDispositionPanel";
import {
  ActiveCallsList,
  CallDetailsCard,
  LiveInsightsPanel,
  MonitorHeader,
  QAChecklist,
  ScoreProgress,
  TranscriptPanel,
} from "@/components/monitor";

const ALL_CATEGORIES = ["Opening", "Probing", "Qualification", "Closing", "Compliance"];

const KNOWN_GROUPS = [
  "Phillies", "Referrals", "Virtual", "Opener", "Alumni", "Finance",
  "General", "MA", "Hulk Onsite", "Hulk Offsite", "Legit MH",
  "Legit Beacon", "Travel Liason", "Daylight Misc", "Ember 12 Step",
  "Marty Direct", "Trost Virtual Admissions", "Retention Team", "Direct"
];

function extractGroup(agentName: string | undefined, source?: string): string {
  if (!agentName || agentName === "Unknown Agent") {
    if (source) return source;
    return "Unassigned";
  }
  for (const group of KNOWN_GROUPS) {
    if (agentName.endsWith(group)) {
      return group;
    }
  }
  const parts = agentName.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1].trim() : "General";
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive":
      return "text-green-600 bg-green-50 border-green-200";
    case "negative":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-navy-700 bg-navy-50 border-navy-200";
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-navy-700";
  return "text-red-600";
}

export default function MonitorPage() {
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCallData, setSelectedCallData] = useState<Call | null>(null);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [pollingInterval] = useState(5);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [criteriaExpanded, setCriteriaExpanded] = useState(true);
  const autoStartDoneRef = React.useRef(false);

  const {
    isMonitoring,
    isRecording,
    liveState,
    recentInsights,
    error,
    startMonitoring,
    stopMonitoring,
  } = useLiveAnalysis({
    onError: setCallsError,
    onClose: () => {},
  });

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
      const res = await fetch("/api/ctm/active-calls");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const calls: Call[] = Array.isArray(data) ? data : data.calls || [];
      setActiveCalls(calls);
    } catch (err) {
      setCallsError("Failed to load active calls");
    }
  }, []);

  useEffect(() => {
    fetchActiveCalls();
    const interval = setInterval(fetchActiveCalls, pollingInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchActiveCalls, pollingInterval]);

  useEffect(() => {
    if (!isMonitoring && selectedCallData && !autoStartDoneRef.current) {
      autoStartDoneRef.current = true;
      startMonitoring(selectedCallData.id);
    }
  }, [isMonitoring, selectedCallData, startMonitoring]);

  const handleStartMonitoring = useCallback(async () => {
    autoStartDoneRef.current = true;
    await startMonitoring(selectedCallId || undefined);
  }, [startMonitoring, selectedCallId]);

  const handleStopMonitoring = useCallback(() => {
    stopMonitoring();
  }, [stopMonitoring]);

  const handleSelectCall = useCallback((call: Call) => {
    setSelectedCallId(call.id);
    setSelectedCallData(call);
    if (isMonitoring) {
      stopMonitoring();
      setTimeout(() => {
        startMonitoring(call.id);
      }, 100);
    }
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  const byCategory = useCallback((category: string) => {
    return RUBRIC_CRITERIA.filter((c) => c.category === category);
  }, []);

  const isCrisis = React.useMemo(() => {
    return (liveState.transcript || []).some(
      (t) => t.text.toLowerCase().includes("suicide") || t.text.toLowerCase().includes("kill myself")
    );
  }, [liveState.transcript]);

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
                        <svg className="w-4 h-4 text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-semibold text-navy-900">
                          {selectedCallData.agent?.name || "Unknown Agent"}
                        </span>
                      </div>
                      <div className="w-px h-4 bg-navy-200" />
                      <span className="text-xs text-navy-600 font-mono">
                        {selectedCallData.trackingNumber || selectedCallData.phone}
                      </span>
                      {selectedCallData.destinationNumber && (
                        <>
                          <div className="w-px h-4 bg-navy-200" />
                          <span className="text-xs text-navy-600 font-mono">
                            {selectedCallData.destinationNumber}
                          </span>
                        </>
                      )}
                      {selectedCallData.trackingLabel && (
                        <>
                          <div className="w-px h-4 bg-navy-200" />
                          <span className="px-1.5 py-0.5 bg-navy-100 text-navy-700 text-xs rounded font-medium">
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
                  <Button variant="primary" size="md" onClick={handleStartMonitoring}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Start Live Analysis
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="md" onClick={handleStopMonitoring}>
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
                      <svg className="w-10 h-10 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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
                        { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Live Transcription", desc: "Real-time speaker detection" },
                        { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Live QA Scoring", desc: "25-criteria real-time evaluation" },
                        { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "Instant Insights", desc: "Flag pass/fail as call happens" },
                        { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Duration Tracking", desc: "Know exactly where you are" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-navy-50 rounded-lg">
                          <svg className="w-5 h-5 text-navy-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-navy-900">{item.label}</p>
                            <p className="text-xs text-navy-500">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
              <div>
                <ActiveCallsList
                  calls={activeCalls}
                  selectedCallId={selectedCallId}
                  selectedGroup={selectedGroup}
                  groups={groups}
                  onSelectCall={handleSelectCall}
                  onGroupChange={setSelectedGroup}
                />
                {activeCalls.length === 0 && callsError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <p className="font-medium">Error loading calls:</p>
                    <p>{callsError}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 space-y-4">
                <Card className="p-0 overflow-hidden">
                  <MonitorHeader
                    call={selectedCallData}
                    liveState={liveState}
                    isRecording={isRecording}
                    isMonitoring={isMonitoring}
                    formatDuration={formatDuration}
                    getSentimentColor={getSentimentColor}
                    getScoreColor={getScoreColor}
                    extractGroup={extractGroup}
                  />
                  <TranscriptPanel
                    transcript={liveState.transcript || []}
                    formatDuration={formatDuration}
                  />
                </Card>

                <Card className="p-0 overflow-hidden">
                  <LiveInsightsPanel
                    insights={recentInsights}
                    formatDuration={formatDuration}
                    expanded={insightsExpanded}
                    onToggle={() => setInsightsExpanded(!insightsExpanded)}
                  />
                </Card>

                <AgentAssistantPanel
                  missingCriteria={Object.entries(liveState.criteriaStatus || {}).filter(([, v]) => !v.triggered).map(([k]) => k)}
                  currentContext={{
                    insurance: liveState.insurance,
                    state: liveState.callerLocation,
                    substance: liveState.substance,
                    callerName: liveState.callerName || selectedCallData?.name,
                    isCrisis,
                  }}
                  lastTranscript={liveState.transcript?.[liveState.transcript.length - 1]?.text}
                />
              </div>

              <div className="xl:col-span-5 space-y-4">
                <NotesDispositionPanel
                  currentState={{
                    callerName: liveState.callerName || selectedCallData?.name,
                    callerPhone: liveState.callerPhone || selectedCallData?.phone,
                    state: liveState.callerLocation,
                    insurance: liveState.insurance,
                    substance: liveState.substance,
                    sobrietyTime: liveState.sobrietyTime,
                  }}
                  score={liveState.score || 0}
                  missingCriteria={Object.entries(liveState.criteriaStatus || {}).filter(([, v]) => !v.triggered).map(([k]) => k)}
                />

                <QAChecklist
                  criteriaStatus={liveState.criteriaStatus || {}}
                  score={liveState.score || 100}
                  expanded={criteriaExpanded}
                  onToggle={() => setCriteriaExpanded(!criteriaExpanded)}
                />

                <CallDetailsCard
                  call={selectedCallData}
                  liveState={{
                    callerName: liveState.callerName,
                    callerPhone: liveState.callerPhone,
                    callerLocation: liveState.callerLocation,
                    insurance: liveState.insurance,
                    duration: liveState.duration,
                  }}
                  formatDuration={formatDuration}
                />

                <ScoreProgress
                  score={liveState.score || 100}
                  criteriaStatus={liveState.criteriaStatus || {}}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
