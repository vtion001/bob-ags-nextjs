export const KNOWN_GROUPS = [
  "Phillies", "Referrals", "Virtual", "Opener", "Alumni", "Finance",
  "General", "MA", "Hulk Onsite", "Hulk Offsite", "Legit MH",
  "Legit Beacon", "Travel Liason", "Daylight Misc", "Ember 12 Step",
  "Marty Direct", "Trost Virtual Admissions", "Retention Team", "Direct"
]

export const PHILLIES_GROUP_NAME = "Phillies"

import { formatDuration } from '@/lib/utils/formatters'

export function extractGroup(agentName: string | undefined, source?: string): string {
  if (!agentName || agentName === "Unknown Agent") {
    if (source) return source;
    return "Unassigned";
  }
  for (const group of KNOWN_GROUPS) {
    if (agentName.includes(group)) {
      return group;
    }
  }
  const parts = agentName.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1].trim() : "General";
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive":
      return "text-green-600 bg-green-50 border-green-200";
    case "negative":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-navy-700 bg-navy-50 border-navy-200";
  }
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-navy-700";
  return "text-red-600";
}

export function isPhilliesAgent(agentName: string | undefined | null): boolean {
  if (!agentName || agentName === "Unknown Agent") return false;
  return agentName.includes(PHILLIES_GROUP_NAME);
}

export function filterCallsByPhillies<T extends { agent?: { name?: string } | null; agentName?: string | null }>(calls: T[]): T[] {
  return calls.filter(call => {
    const agentName = call.agent?.name ?? call.agentName;
    return isPhilliesAgent(agentName);
  });
}
