/** A vault file reduced to the fields the Recent widget needs. */
export interface RecentItem {
  path: string;
  name: string;
  folder: string;
  ext: string;
  mtime: number;
  ctime: number;
}

/** Options controlling how recent items are filtered and ordered. */
export interface RecentOptions {
  source: "opened" | "modified" | "created";
  type: "markdown" | "all";
  count: number;
}

/**
 * Filter by type, order by source, and cap to count.
 *
 * @param items - Candidate files.
 * @param openedOrder - The workspace's recent-paths list (most-recent first),
 *   used only when `source === "opened"`.
 * @param opts - Source/type/count options.
 * @returns A new array, filtered, ordered and sliced to `count`.
 */
export function orderRecent(items: RecentItem[], openedOrder: string[], opts: RecentOptions): RecentItem[] {
  let list = opts.type === "markdown" ? items.filter((i) => i.ext === "md") : items.slice();
  if (opts.source === "opened") {
    const rank = new Map(openedOrder.map((p, i) => [p, i]));
    list = list.filter((i) => rank.has(i.path)).sort((a, b) => (rank.get(a.path) ?? 0) - (rank.get(b.path) ?? 0));
  } else if (opts.source === "modified") {
    list.sort((a, b) => b.mtime - a.mtime);
  } else {
    list.sort((a, b) => b.ctime - a.ctime);
  }
  return list.slice(0, opts.count);
}

/** A folder and the items it contains, in first-seen order. */
export interface RecentGroup {
  folder: string;
  items: RecentItem[];
}

/**
 * Group items by folder, preserving first-seen folder order and item order.
 * Root-level items (empty folder) are grouped under `"/"`.
 *
 * @param items - Already-ordered items.
 * @returns Groups in the order their folders were first encountered.
 */
export function groupByFolder(items: RecentItem[]): RecentGroup[] {
  const map = new Map<string, RecentItem[]>();
  for (const it of items) {
    const f = it.folder || "/";
    const arr = map.get(f);
    if (arr) arr.push(it);
    else map.set(f, [it]);
  }
  return [...map.entries()].map(([folder, items]) => ({ folder, items }));
}
