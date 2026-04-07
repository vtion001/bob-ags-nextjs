"use client";

import React, { useState, useEffect } from "react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import { Call } from "@/lib/ctm"
import { RUBRIC_CRITERIA } from "@/lib/ai"
import { useMonitorPage } from "@/hooks/monitor/useMonitorPage"
import { useLiveAIInsights } from "@/hooks/monitor/useLiveAIInsights"
import { useAuth } from "@/contexts/AuthContext"

function toISOString(value: any): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (typeof value.toISOString === 'function') return value.toISOString()
  return undefined
}
import NotesDispositionPanel from "@/components/call-detail/NotesDispositionPanel"
import LiveAIInsightsPanel from "@/components/monitor/LiveAIInsightsPanel"
import {
  ActiveCallsList,
  CallDetailsCard,
  LiveInsightsPanel,
  MonitorHeader,
  ScoreProgress,
  TranscriptPanel,
} from "@/components/monitor"
import LiveAnalysisLogHistory from "@/components/monitor/LiveAnalysisLogHistory"
import {
  extractGroup,
  formatDuration,
  getSentimentColor,
  getScoreColor,
} from "@/lib/monitor/helpers"

export default function MonitorPage() {
  const { role, isAgent } = useAuth()
  const [assignedAgentId, setAssignedAgentId] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/users/settings')
        if (res.ok) {
          const data = await res.json()
          setAssignedAgentId(data.settings?.ctm_agent_id || null)
        }
      } catch (e) {
        console.warn('Failed to fetch settings:', e)
      }
    }
    fetchSettings()
  }, [])

  const {
    activeCalls,
    selectedCallId,
    selectedCallData,
    callsError,
    selectedGroup,
    setSelectedGroup,
    groups,
    filteredCalls,
    isMonitoring,
    isRecording,
    liveState,
    recentInsights,
    error,
    handleSelectCall,
    handleStartMonitoring,
    handleStopMonitoring,
    isCrisis,
    isViewerWithAssignment,
    hasAgentAssignment,
    gracePeriodRemaining,
    isInGracePeriod,
  } = useMonitorPage({ role: role as 'admin' | 'manager' | 'viewer' | 'qa' | 'agent', assignedAgentId })

  const {
    aiInsights,
    suggestedDisposition,
    isAnalyzing: isAIAnalyzing,
    analyzeNow,
    resetInsights,
  } = useLiveAIInsights({
    callId: selectedCallId || undefined,
    callPhone: selectedCallData?.phone || undefined,
    callDirection: selectedCallData?.direction || undefined,
    callTimestamp: toISOString(selectedCallData?.timestamp),
  })

  const byCategory = (category: string) => {
    return RUBRIC_CRITERIA.filter((c) => c.category === category)
  }

  React.useEffect(() => {
    if (!isMonitoring) {
      resetInsights()
      return
    }
    const transcript = liveState.transcript || []
    if (transcript.length < 3) return
    const text = transcript.map((t: any) => `${t.speaker}: ${t.text}`).join('\n')
    analyzeNow(text, {
      callerName: liveState.callerName,
      insurance: liveState.insurance,
      state: liveState.callerLocation,
    })
  }, [liveState.transcript, isMonitoring])

  const handleBackToLiveView = () => {
    handleStopMonitoring()
  }

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
              {isInGracePeriod ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Analysis Ending Soon</p>
                    <p className="text-xs text-amber-600">Finalizing results in {gracePeriodRemaining}s</p>
                  </div>
                </div>
              ) : !isMonitoring ? (
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
                      {isViewerWithAssignment ? 'Waiting for incoming calls...' : 'Select a call from the list below to monitor'}
                    </span>
                  )}
                  {!isViewerWithAssignment && (
                    <Button variant="primary" size="md" onClick={handleStartMonitoring}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Start Live Analysis
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-semibold text-green-700">Monitoring Active</span>
                  </div>
                  {!isViewerWithAssignment && (
                    <Button variant="secondary" size="md" onClick={handleStopMonitoring}>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Stop Monitoring
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {role === 'viewer' && !hasAgentAssignment && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-amber-800">No Agent Assigned</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You have not been assigned a CTM agent. Please contact your administrator to assign you an agent for call monitoring.
                  </p>
                </div>
              </div>
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
                  role={role}
                  assignedAgentId={assignedAgentId}
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
            <div className="space-y-4">
              {role === 'viewer' && (
                <div className="flex items-center justify-between p-4 bg-navy-50 border border-navy-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center">
                      {isInGracePeriod ? (
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-navy-900">
                        {isInGracePeriod ? 'Finalizing Analysis...' : 'Auto-Monitoring Active'}
                      </p>
                      <p className="text-sm text-navy-600">
                        {isInGracePeriod 
                          ? `Recording ending. Final results in ${gracePeriodRemaining} seconds.`
                          : 'New calls will automatically start analysis'}
                      </p>
                    </div>
                  </div>
                  {isInGracePeriod && (
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-amber-600">{gracePeriodRemaining}</div>
                      <span className="text-sm text-amber-500">seconds remaining</span>
                    </div>
                  )}
                </div>
              )}

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
                      expanded={true}
                      onToggle={() => {}}
                    />
                  </Card>

                  <Card className="p-0 overflow-hidden">
                    <LiveAIInsightsPanel
                      insights={aiInsights}
                      suggestedDisposition={suggestedDisposition}
                      isAnalyzing={isAIAnalyzing}
                      expanded={true}
                      onToggle={() => {}}
                    />
                  </Card>
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
                    missingCriteria={Object.entries(liveState.criteriaStatus || {}).filter(([, v]: [string, any]) => !v.triggered).map(([k]) => k)}
                    suggestedDisposition={suggestedDisposition}
                    aiNotes={aiInsights.length > 0 ? aiInsights.map(i => `[${i.priority.toUpperCase()}] ${i.title}: ${i.message}`).join('\n') : null}
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
            </div>
          )}
        </div>
      </div>
      <LiveAnalysisLogHistory />
    </div>
  )
}
