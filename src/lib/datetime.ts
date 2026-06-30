export type Period = "morning" | "afternoon" | "evening" | "night";

/** Time-of-day bucket for an hour 0–23. */
export function periodOf(hour: number): Period {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

/** Emoji representing a time-of-day period. */
export function emojiForPeriod(p: Period): string {
  return { morning: "☀️", afternoon: "🌤️", evening: "🌆", night: "🌙" }[p];
}

/** Local-midnight timestamp for the day containing the given epoch ms. */
function startOfDayLocal(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole calendar days from now to target (negative if past). */
export function daysUntil(targetMs: number, nowMs: number): number {
  return Math.round((startOfDayLocal(targetMs) - startOfDayLocal(nowMs)) / 86400000);
}

/** ISO 8601 week number (1–53). */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const fDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
}
