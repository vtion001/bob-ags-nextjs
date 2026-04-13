'use client'

import React, { useMemo, useRef } from "react"
import { useLiveMonitoringStore, selectTranscript } from "@/lib/stores/liveMonitoringStore"
import { useVirtualizer } from "@tanstack/react-virtual"

interface TranscriptPanelProps {
  formatDuration: (seconds: number) => string
}

interface TranscriptMessageProps {
  text: string
  timestamp: number
  isAgent: boolean
  formatDuration: (seconds: number) => string
}

function TranscriptMessage({
  text,
  timestamp,
  isAgent,
  formatDuration
}: TranscriptMessageProps) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${
          isAgent
            ? "rounded-bl-sm bg-navy-900 text-white"
            : "rounded-br-sm bg-navy-100 text-navy-900"
        }`}>
          {text}
        </div>
        <p className="text-xs mt-1 text-navy-400">
          {formatDuration(timestamp)}
        </p>
      </div>
    </div>
  )
}

function EmptyTranscriptState() {
  return (
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
  )
}

function VirtualizedMessageList({
  messages,
  isAgent,
  formatDuration
}: {
  messages: { text: string; startTime: number }[]
  isAgent: boolean
  formatDuration: (seconds: number) => string
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 5,
  })

  const items = virtualizer.getVirtualItems()

  if (messages.length === 0) {
    return (
      <p className="text-sm text-navy-400 italic">
        {isAgent ? "Agent messages will appear here" : "Caller messages will appear here"}
      </p>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {items.map((virtualItem) => {
          const message = messages[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TranscriptMessage
                text={message.text}
                timestamp={message.startTime}
                isAgent={isAgent}
                formatDuration={formatDuration}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TranscriptPanel({ formatDuration }: TranscriptPanelProps) {
  const transcript = useLiveMonitoringStore(selectTranscript)

  const { agentMessages, callerMessages } = useMemo(() => {
    const agent: { text: string; startTime: number }[] = []
    const caller: { text: string; startTime: number }[] = []

    for (const t of transcript) {
      if (t.speaker === "Agent") {
        agent.push({ text: t.text, startTime: t.startTime })
      } else {
        caller.push({ text: t.text, startTime: t.startTime })
      }
    }

    return { agentMessages: agent, callerMessages: caller }
  }, [transcript])

  return (
    <div className="h-[400px] overflow-y-auto p-4 bg-slate-50/50">
      {transcript.length === 0 ? (
        <EmptyTranscriptState />
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
            <VirtualizedMessageList
              messages={agentMessages}
              isAgent={true}
              formatDuration={formatDuration}
            />
          </div>

          <div className="flex flex-col border-l border-navy-200 pl-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-navy-200">
              <div className="w-6 h-6 rounded-full bg-navy-700 flex items-center justify-center text-xs font-bold text-white">
                C
              </div>
              <span className="text-sm font-semibold text-navy-900">
                Caller
              </span>
            </div>
            <VirtualizedMessageList
              messages={callerMessages}
              isAgent={false}
              formatDuration={formatDuration}
            />
          </div>
        </div>
      )}
    </div>
  )
}
