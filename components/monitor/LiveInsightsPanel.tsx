import React from "react";
import type { RealtimeInsight } from "@/lib/realtime";

interface LiveInsightsPanelProps {
  insights: RealtimeInsight[];
  formatDuration: (seconds: number) => string;
  expanded: boolean;
  onToggle: () => void;
}

function getInsightColor(type: RealtimeInsight["type"]): string {
  switch (type) {
    case "pass":
      return "bg-navy-50 border-navy-200";
    case "fail":
      return "bg-navy-100 border-navy-300";
    case "warning":
      return "bg-navy-50 border-navy-200";
    default:
      return "bg-navy-50 border-navy-200";
  }
}

function getInsightIcon(type: RealtimeInsight["type"]): string {
  switch (type) {
    case "pass":
      return "P";
    case "fail":
      return "X";
    case "warning":
      return "!";
    default:
      return "i";
  }
}

function InsightItem({ insight, formatDuration }: { insight: RealtimeInsight; formatDuration: (seconds: number) => string }) {
  return (
    <div className={`px-4 py-3 flex items-start gap-3 ${getInsightColor(insight.type)}`}>
      <span
        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
          insight.type === "pass"
            ? "bg-navy-900 text-white"
            : insight.type === "fail"
              ? "bg-navy-700 text-white"
              : "bg-navy-600 text-white"
        }`}
      >
        {getInsightIcon(insight.type)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-navy-800 text-white">
            {insight.category}
          </span>
          <span className="text-sm font-semibold text-navy-900">
            {insight.criterion}
          </span>
          {insight.ztp && (
            <span className="text-xs px-1.5 py-0.5 bg-navy-200 text-navy-800 rounded font-bold">
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
  );
}

export default function LiveInsightsPanel({
  insights,
  formatDuration,
  expanded,
  onToggle,
}: LiveInsightsPanelProps) {
  return (
    <div className="p-0 overflow-hidden">
      <button
        onClick={onToggle}
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
          {insights.length > 0 && (
            <span className="px-2 py-0.5 bg-navy-900 text-white text-xs rounded-full">
              {insights.length}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-navy-400 transition-transform ${expanded ? "rotate-180" : ""}`}
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
      {expanded && (
        <div className="max-h-60 overflow-y-auto divide-y divide-navy-100">
          {insights.length === 0 ? (
            <p className="text-navy-400 text-sm text-center py-6">
              Insights will appear as the call progresses
            </p>
          ) : (
            insights.map((insight) => (
              <InsightItem
                key={insight.id}
                insight={insight}
                formatDuration={formatDuration}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
