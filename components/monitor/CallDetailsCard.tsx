import React from "react";
import Card from "@/components/ui/Card";
import type { Call } from "@/lib/ctm";

interface CallDetailsCardProps {
  call: Call | null;
  liveState: {
    callerName?: string;
    callerPhone?: string;
    callerLocation?: string;
    insurance?: string;
    duration?: number;
  };
  formatDuration: (seconds: number) => string;
}

interface DetailItem {
  label: string;
  value: string | null;
  icon: string;
  highlight?: boolean;
}

export default function CallDetailsCard({ call, liveState, formatDuration }: CallDetailsCardProps) {
  const callerLocation = liveState.callerLocation || (call?.city || call?.state ? [call?.city, call?.state].filter(Boolean).join(', ') : null)
  const insurance = liveState.insurance || call?.analysis?.detected_insurance || null

  const items: DetailItem[] = [
    {
      label: "Agent",
      value: call?.agent?.name || null,
      icon: "A",
      highlight: true,
    },
    {
      label: "Tracking Number",
      value: call?.trackingNumber || null,
      icon: "T",
    },
    {
      label: "Destination",
      value: call?.destinationNumber || null,
      icon: "D",
    },
    {
      label: "Pool Number",
      value: call?.poolNumber || null,
      icon: "P",
    },
    {
      label: "Source / Label",
      value: call?.trackingLabel || null,
      icon: "S",
    },
    {
      label: "Caller Location",
      value: callerLocation,
      icon: "L",
    },
    {
      label: "Insurance Type",
      value: insurance,
      icon: "I",
    },
    {
      label: "Duration",
      value: liveState.duration !== undefined ? formatDuration(liveState.duration) : null,
      icon: "T",
    },
  ];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-navy-100">
        <h3 className="text-lg font-bold text-navy-900">
          Call Details
        </h3>
      </div>
      <div className="divide-y divide-navy-100">
        {items.map((item) => (
          <div key={item.label} className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-sm font-bold text-navy-600">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-navy-500">{item.label}</p>
              <p className={`text-sm font-semibold truncate ${item.value ? (item.highlight ? "text-navy-900" : "text-navy-800") : "text-navy-300"}`}>
                {item.value || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
