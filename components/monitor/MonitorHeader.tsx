import React from "react";
import type { Call } from "@/lib/ctm";
import type { LiveCallState } from "@/lib/realtime";

interface MonitorHeaderProps {
  call: Call | null;
  liveState: Partial<LiveCallState>;
  isRecording: boolean;
  isMonitoring: boolean;
  formatDuration: (seconds: number) => string;
  getSentimentColor: (sentiment: string) => string;
  getScoreColor: (score: number) => string;
  extractGroup: (agentName: string | undefined, source?: string) => string;
}

export default function MonitorHeader({
  call,
  liveState,
  isRecording,
  isMonitoring,
  formatDuration,
  getSentimentColor,
  getScoreColor,
  extractGroup,
}: MonitorHeaderProps) {
  return (
    <div className="p-4 border-b border-navy-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-slate-400"}`}
          />
          <span className="text-sm font-semibold text-navy-900">
            {isMonitoring ? (isRecording ? "Recording" : "Connecting...") : "Idle"}
          </span>
        </div>
        {liveState.duration !== undefined && liveState.duration > 0 && (
          <span className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded text-sm font-mono">
            {formatDuration(liveState.duration)}
          </span>
        )}
        {call?.agent?.name && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-sm font-semibold">
            {call.agent.name}
            <span className="ml-1.5 text-xs font-normal opacity-70">
              {extractGroup(call.agent.name)}
            </span>
          </span>
        )}
        {call?.trackingNumber && (
          <span className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded text-sm font-mono">
            {call.trackingNumber}
          </span>
        )}
        {call?.destinationNumber && (
          <span className="px-2 py-0.5 bg-navy-50 text-navy-700 rounded text-sm font-mono">
            → {call.destinationNumber}
          </span>
        )}
        {call?.trackingLabel && (
          <span className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded text-sm font-medium">
            {call.trackingLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {liveState.sentiment && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSentimentColor(liveState.sentiment)}`}>
            {liveState.sentiment === "positive" ? "Positive" : liveState.sentiment === "negative" ? "Negative" : "Neutral"}
          </span>
        )}
        {liveState.score !== undefined && (
          <span className={`text-xl font-bold ${getScoreColor(liveState.score)}`}>
            {liveState.score}
          </span>
        )}
      </div>
    </div>
  );
}
