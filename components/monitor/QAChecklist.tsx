import React from "react";
import Card from "@/components/ui/Card";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import { RUBRIC_CRITERIA } from "@/lib/ai";

interface CriteriaStatus {
  pass: boolean;
  triggered: boolean;
}

interface QAChecklistProps {
  criteriaStatus: Record<string, CriteriaStatus>;
  score: number;
  expanded: boolean;
  onToggle: () => void;
}

const ALL_CATEGORIES = ["Opening", "Probing", "Qualification", "Closing", "Compliance"];

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-navy-600";
  return "text-red-600";
}

function ChecklistIcon() {
  return (
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
  )
}

export default function QAChecklist({
  criteriaStatus,
  score,
  expanded,
  onToggle,
}: QAChecklistProps) {
  const byCategory = (category: string) =>
    RUBRIC_CRITERIA.filter((c) => c.category === category);

  return (
    <Card className="p-0 overflow-hidden">
      <CollapsiblePanel
        title="QA Checklist"
        icon={<ChecklistIcon />}
        expanded={expanded}
        onToggle={onToggle}
        rightElement={<span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>}
      >
        <div className="divide-y divide-navy-100">
          {ALL_CATEGORIES.map((category) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide border-l-4 border-l-navy-800 bg-navy-50/30">
                {category}
              </div>
              {byCategory(category).map((criterion) => {
                const status = criteriaStatus?.[criterion.id];
                const isPending = !status?.triggered;
                const isPass = status?.triggered && status.pass;
                const isFail = status?.triggered && !status.pass;

                return (
                  <div
                    key={criterion.id}
                    className="px-4 py-2.5 flex items-center gap-3"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isPass
                          ? "bg-green-500 text-white"
                          : isFail
                            ? "bg-red-500 text-white"
                            : "bg-navy-200"
                      }`}
                    >
                      {isPass ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isFail ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-navy-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isFail ? "text-red-700 font-medium" : isPass ? "text-green-700" : "text-navy-600"}`}>
                        {criterion.name}
                      </p>
                    </div>
                    {criterion.ztp && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">
                        ZTP
                      </span>
                    )}
                    <span className="text-[10px] text-navy-400 font-mono">
                      {criterion.id}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CollapsiblePanel>
    </Card>
  );
}
