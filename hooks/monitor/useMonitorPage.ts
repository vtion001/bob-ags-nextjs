import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Call } from "@/lib/ctm"
import { useLiveAnalysis } from "@/hooks/monitor"
import { extractGroup, KNOWN_GROUPS } from "@/lib/monitor/helpers"
import { RUBRIC_CRITERIA } from "@/lib/ai/rubric"

const GRACE_PERIOD_SECONDS = 30

interface UseMonitorPageOptions {
  role?: 'admin' | 'manager' | 'viewer' | 'qa' | 'agent'
  assignedAgentId?: string | null
  onNewCallAutoStart?: (call: Call) => void
  enabled?: boolean
}

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
  isViewerWithAssignment: boolean
  hasAgentAssignment: boolean
  gracePeriodRemaining: number
  isInGracePeriod: boolean
}

export function useMonitorPage(options?: UseMonitorPageOptions): UseMonitorPageReturn {
  const { role = 'viewer', assignedAgentId = null, onNewCallAutoStart, enabled = true } = options || {}
  const [activeCalls, setActiveCalls] = useState<Call[]>([])
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [selectedCallData, setSelectedCallData] = useState<Call | null>(null)
  const [callsError, setCallsError] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>("All")
  const [pollingInterval] = useState(2)
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState(0)
  const [isInGracePeriod, setIsInGracePeriod] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const previousCallsRef = useRef<Call[]>([])
  const hasAutoStartedRef = useRef(false)
  const monitoredCallIdRef = useRef<string | null>(null)
  const gracePeriodTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isViewerWithAssignment = (role === 'viewer' || role === 'agent') && !!assignedAgentId
  const hasAgentAssignment = !!assignedAgentId

  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = 880
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      console.warn('Audio beep failed:', e)
    }
  }, [])

  const clearGracePeriod = useCallback(() => {
    if (gracePeriodTimerRef.current) {
      clearInterval(gracePeriodTimerRef.current)
      gracePeriodTimerRef.current = null
    }
    setGracePeriodRemaining(0)
    setIsInGracePeriod(false)
  }, [])

  const startGracePeriodCountdown = useCallback(() => {
    clearGracePeriod()
    setGracePeriodRemaining(GRACE_PERIOD_SECONDS)
    setIsInGracePeriod(true)
    
    gracePeriodTimerRef.current = setInterval(() => {
      setGracePeriodRemaining(prev => {
        if (prev <= 1) {
          clearGracePeriod()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearGracePeriod])

  const handleClose = useCallback(() => {
    hasAutoStartedRef.current = false
    setSelectedCallId(null)
    setSelectedCallData(null)
    clearGracePeriod()
  }, [clearGracePeriod])

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
    onClose: handleClose,
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
      if (res.status === 401) {
        setCallsError("Session expired. Please refresh the page or log in again.")
        return
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch active calls")
      }
      const data = await res.json()
      const calls: Call[] = Array.isArray(data) ? data : data.calls || []

      const prevCallIds = new Set(previousCallsRef.current.map(c => c.id))
      const newCalls = calls.filter(c => !prevCallIds.has(c.id))

      if (newCalls.length > 0 && isViewerWithAssignment && !isMonitoring && !hasAutoStartedRef.current) {
        const newCall = newCalls[0]
        hasAutoStartedRef.current = true
        playBeep()
        setSelectedCallId(newCall.id)
        setSelectedCallData(newCall)
        monitoredCallIdRef.current = newCall.id
        setTimeout(() => {
          startMonitoring(newCall.id)
        }, 100)
      }

      if (isMonitoring && monitoredCallIdRef.current) {
        const currentCallStillActive = calls.some(c => c.id === monitoredCallIdRef.current)
        if (!currentCallStillActive && !isInGracePeriod) {
          console.log('[MonitorPage] Monitored call ended, starting grace period')
          startGracePeriodCountdown()
        }
      }

      previousCallsRef.current = calls
      setActiveCalls(calls)
    } catch (err) {
      setCallsError(err instanceof Error ? err.message : "Failed to load active calls")
    }
  }, [isViewerWithAssignment, isMonitoring, startMonitoring, playBeep, isInGracePeriod, startGracePeriodCountdown])

  useEffect(() => {
    if (isInGracePeriod && gracePeriodRemaining === 0) {
      console.log('[MonitorPage] Grace period ended, stopping monitoring')
      hasAutoStartedRef.current = false
      monitoredCallIdRef.current = null
      stopMonitoring()
    }
  }, [gracePeriodRemaining, isInGracePeriod, stopMonitoring])

  useEffect(() => {
    // Don't set up polling if disabled (e.g., no active session)
    if (!enabled) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }
    if (isMonitoring) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }
    fetchActiveCalls()
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(fetchActiveCalls, pollingInterval * 1000)
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [fetchActiveCalls, pollingInterval, isMonitoring, enabled])

  const handleStartMonitoring = useCallback(async () => {
    const callIdToUse = selectedCallId || selectedCallData?.id
    if (!callIdToUse) {
      setCallsError('Please select a call first')
      return
    }
    monitoredCallIdRef.current = callIdToUse
    await startMonitoring(callIdToUse)
  }, [selectedCallId, selectedCallData, startMonitoring])

  const handleStopMonitoring = useCallback(() => {
    hasAutoStartedRef.current = false
    monitoredCallIdRef.current = null
    clearGracePeriod()
    stopMonitoring()
  }, [stopMonitoring, clearGracePeriod])

  const handleSelectCall = useCallback((call: Call) => {
    setSelectedCallId(call.id)
    setSelectedCallData(call)
    monitoredCallIdRef.current = call.id
    if (isMonitoring) {
      stopMonitoring()
      setTimeout(() => {
        startMonitoring(call.id)
      }, 100)
    }
  }, [isMonitoring, startMonitoring, stopMonitoring])

  const byCategory = useCallback((category: string) => {
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
    isViewerWithAssignment,
    hasAgentAssignment,
    gracePeriodRemaining,
    isInGracePeriod,
  }
}