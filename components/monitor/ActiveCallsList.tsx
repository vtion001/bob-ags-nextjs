import React from "react";
import Card from "@/components/ui/Card";
import type { Call } from "@/lib/ctm";

interface ActiveCallsListProps {
  calls: Call[];
  selectedCallId: string | null;
  selectedGroup: string;
  groups: string[];
  onSelectCall: (call: Call) => void;
  onGroupChange: (group: string) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function extractGroup(agentName: string | undefined, source?: string): string {
  if (!agentName || agentName === "Unknown Agent") {
    if (source) return source;
    return "Unassigned";
  }
  const KNOWN_GROUPS = ["Phillies", "Referrals", "Virtual", "Opener", "Alumni", "Finance", "General", "MA", "Hulk Onsite", "Hulk Offsite", "Legit MH", "Legit Beacon", "Travel Liason", "Daylight Misc", "Ember 12 Step", "Marty Direct", "Trost Virtual Admissions", "Retention Team", "Direct"];
  for (const group of KNOWN_GROUPS) {
    if (agentName.endsWith(group)) {
      return group;
    }
  }
  const parts = agentName.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1].trim() : "General";
}

interface CallButtonProps {
  call: Call;
  isSelected: boolean;
  onSelect: () => void;
}

function CallButton({ call, isSelected, onSelect }: CallButtonProps) {
  const group = extractGroup(call.agent?.name, call.source);
  const displayNumber = call.trackingNumber || call.phone || "Unknown";
  const duration = call.duration || 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg transition-all ${
        isSelected
          ? "bg-navy-900 text-white"
          : "bg-navy-50 hover:bg-navy-100 text-navy-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={`font-semibold text-sm truncate ${isSelected ? "text-white/90" : "text-navy-900"}`}>
          {call.agent?.name || "Unknown Agent"}
        </span>
        <span className={`text-xs font-mono ${isSelected ? "text-white/60" : "text-navy-400"}`}>
          {formatDuration(duration)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`font-mono truncate ${isSelected ? "text-white/70" : "text-navy-500"}`}>
          {displayNumber}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-xs ${isSelected ? "bg-white/20" : "bg-navy-200"}`}>
          {group}
        </span>
      </div>
      {call.source && (
        <div className={`mt-1 text-xs truncate ${isSelected ? "text-white/50" : "text-navy-400"}`}>
          Source: {call.source}
        </div>
      )}
    </button>
  );
}

export default function ActiveCallsList({
  calls,
  selectedCallId,
  selectedGroup,
  groups,
  onSelectCall,
  onGroupChange,
}: ActiveCallsListProps) {
  const filteredCalls = selectedGroup === "All" 
    ? calls 
    : calls.filter((call) => extractGroup(call.agent?.name, call.source) === selectedGroup);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-navy-900">Active Calls</h3>
        <span className="text-sm text-navy-500">{calls.length} calls</span>
      </div>
      
      {groups.length > 0 && (
        <select
          value={selectedGroup}
          onChange={(e) => onGroupChange(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
        >
          <option value="All">All Groups</option>
          {groups.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      )}

      {filteredCalls.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredCalls.map((call) => (
            <CallButton
              key={call.id}
              call={call}
              isSelected={call.id === selectedCallId}
              onSelect={() => onSelectCall(call)}
            />
          ))}
        </div>
      ) : calls.length === 0 ? (
        <p className="text-navy-400 text-sm text-center py-6">
          No active calls detected.
        </p>
      ) : (
        <p className="text-navy-400 text-sm text-center py-6">
          No calls for group <strong>{selectedGroup}</strong>
        </p>
      )}
    </Card>
  );
}
