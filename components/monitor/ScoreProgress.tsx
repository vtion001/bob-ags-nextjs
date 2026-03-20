import React from "react";
import Card from "@/components/ui/Card";
import { RUBRIC_CRITERIA } from "@/lib/ai";

interface ScoreProgressProps {
  score: number;
  criteriaStatus: Record<string, { triggered: boolean }>;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-navy-600";
  return "text-red-600";
}

function getProgressBarColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-navy-600";
  return "bg-red-500";
}

export default function ScoreProgress({ score, criteriaStatus }: ScoreProgressProps) {
  const triggeredCount = Object.values(criteriaStatus).filter((s) => s.triggered).length;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold text-navy-900 mb-3">
        Score Progress
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-navy-500">
          <span>QA Score</span>
          <span className={`font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
        <div className="h-3 bg-navy-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-navy-500">
          <span>Criteria</span>
          <span>
            {triggeredCount} / {RUBRIC_CRITERIA.length}
          </span>
        </div>
      </div>
    </Card>
  );
}
