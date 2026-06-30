/** Number of whitespace-separated tokens. */
export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

/** How many of the given timestamps are >= `since`. */
export function countSince(times: number[], since: number): number {
  return times.filter((t) => t >= since).length;
}

/** Sum every nested count in a link map (resolvedLinks / unresolvedLinks shape). */
export function sumLinkMap(map: Record<string, Record<string, number>>): number {
  let total = 0;
  for (const dests of Object.values(map)) {
    for (const n of Object.values(dests)) total += n;
  }
  return total;
}

/** Start-of-local-day timestamp for the day containing `now`. */
export function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
