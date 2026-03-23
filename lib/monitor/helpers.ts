export const KNOWN_GROUPS = [
  "Phillies", "Referrals", "Virtual", "Opener", "Alumni", "Finance",
  "General", "MA", "Hulk Onsite", "Hulk Offsite", "Legit MH",
  "Legit Beacon", "Travel Liason", "Daylight Misc", "Ember 12 Step",
  "Marty Direct", "Trost Virtual Admissions", "Retention Team", "Direct"
]

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

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
