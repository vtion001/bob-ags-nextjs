import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Call } from "@/lib/ctm"
import { useLiveAnalysis } from "@/hooks/monitor"
import { extractGroup, KNOWN_GROUPS } from "@/lib/monitor/helpers"

interface UseMonitorPageReturn {
  activeCalls: Call[]
  selectedCallId: string | null
  selectedCallData: Call | null
  callsError: string | null
  selectedGroup: string
  setSelectedGroup: (group: string) => void
  groups: string[]
  filteredCalls: Call[]
  isMonitoring: boolean
  isRecording: boolean
  liveState: any
  recentInsights: any[]
  error: string | null
  startMonitoring: (callId?: string) => Promise<void>
  stopMonitoring: () => void
  handleSelectCall: (call: Call) => void
  handleStartMonitoring: () => Promise<void>
  handleStopMonitoring: () => void
  byCategory: (category: string) => any[]
  isCrisis: boolean
  pollingInterval: number
}

export function useMonitorPage(): UseMonitorPageReturn {
  const [activeCalls, setActiveCalls] = useState<Call[]>([])
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [selectedCallData, setSelectedCallData] = useState<Call | null>(null)
  const [callsError, setCallsError] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>("All")
  const [pollingInterval] = useState(5)
  const autoStartDoneRef = useRef(false)

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
  })

  const groups = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const call of activeCalls) {
      const group = extractGroup(call.agent?.name, call.source)
      if (!seen.has(group)) {
        seen.add(group)
        list.push(group)
      }
    }
    return list.sort()
  }, [activeCalls])

  const filteredCalls = useMemo(() => {
    if (selectedGroup === "All") return activeCalls
    return activeCalls.filter(
      (call) => extractGroup(call.agent?.name, call.source) === selectedGroup
    )
  }, [activeCalls, selectedGroup])

  const fetchActiveCalls = useCallback(async () => {
    try {
      setCallsError(null)
      const res = await fetch("/api/ctm/active-calls")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      const calls: Call[] = Array.isArray(data) ? data : data.calls || []
      setActiveCalls(calls)
    } catch (err) {
      setCallsError("Failed to load active calls")
    }
  }, [])

  useEffect(() => {
    fetchActiveCalls()
    const interval = setInterval(fetchActiveCalls, pollingInterval * 1000)
    return () => clearInterval(interval)
  }, [fetchActiveCalls, pollingInterval])

  useEffect(() => {
    if (!isMonitoring && selectedCallData && !autoStartDoneRef.current) {
      autoStartDoneRef.current = true
      startMonitoring(selectedCallData.id)
    }
  }, [isMonitoring, selectedCallData, startMonitoring])

  const handleStartMonitoring = useCallback(async () => {
    autoStartDoneRef.current = true
    await startMonitoring(selectedCallId || undefined)
  }, [startMonitoring, selectedCallId])

  const handleStopMonitoring = useCallback(() => {
    stopMonitoring()
  }, [stopMonitoring])

  const handleSelectCall = useCallback((call: Call) => {
    autoStartDoneRef.current = false
    setSelectedCallId(call.id)
    setSelectedCallData(call)
    if (isMonitoring) {
      stopMonitoring()
      setTimeout(() => {
        startMonitoring(call.id)
      }, 100)
    }
  }, [isMonitoring, startMonitoring, stopMonitoring])

  const byCategory = useCallback((category: string) => {
    const { RUBRIC_CRITERIA } = require("@/lib/ai")
    return RUBRIC_CRITERIA.filter((c: any) => c.category === category)
  }, [])

  const isCrisis = useMemo(() => {
    return (liveState.transcript || []).some(
      (t: any) => t.text.toLowerCase().includes("suicide") || t.text.toLowerCase().includes("kill myself")
    )
  }, [liveState.transcript])

  return {
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
    startMonitoring,
    stopMonitoring,
    handleSelectCall,
    handleStartMonitoring,
    handleStopMonitoring,
    byCategory,
    isCrisis,
    pollingInterval,
  }
}
