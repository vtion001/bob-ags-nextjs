import React from "react";
import type { RealtimeTranscript } from "@/lib/realtime";

interface TranscriptPanelProps {
  transcript: RealtimeTranscript[];
  formatDuration: (seconds: number) => string;
}

function TranscriptMessage({ 
  text, 
  timestamp, 
  isAgent,
  formatDuration 
}: { 
  text: string; 
  timestamp: number; 
  isAgent: boolean;
  formatDuration: (seconds: number) => string;
}) {
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
  );
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
  );
}

export default function TranscriptPanel({ transcript, formatDuration }: TranscriptPanelProps) {
  const agentMessages = transcript.filter((t) => t.speaker === "Agent");
  const callerMessages = transcript.filter((t) => t.speaker === "Caller");

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
            <div className="flex-1 overflow-y-auto space-y-3">
              {agentMessages.length === 0 ? (
                <p className="text-sm text-navy-400 italic">
                  Agent messages will appear here
                </p>
              ) : (
                agentMessages.map((t, i) => (
                  <TranscriptMessage
                    key={i}
                    text={t.text}
                    timestamp={t.startTime}
                    isAgent={true}
                    formatDuration={formatDuration}
                  />
                ))
              )}
            </div>
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
            <div className="flex-1 overflow-y-auto space-y-3">
              {callerMessages.length === 0 ? (
                <p className="text-sm text-navy-400 italic">
                  Caller messages will appear here
                </p>
              ) : (
                callerMessages.map((t, i) => (
                  <TranscriptMessage
                    key={i}
                    text={t.text}
                    timestamp={t.startTime}
                    isAgent={false}
                    formatDuration={formatDuration}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
