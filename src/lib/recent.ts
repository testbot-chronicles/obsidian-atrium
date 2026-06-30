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

/** Lucide icon name for a file extension. */
export function iconFor(ext: string): string {
  if (ext === "md") return "file-text";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext)) return "image";
  if (ext === "pdf") return "file-text";
  if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)) return "music";
  if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "film";
  return "file";
}

/** A node in the nested folder tree: either a folder (with children) or a file (a leaf). */
export interface TreeNode {
  key: string;
  name: string;
  type: "folder" | "file";
  path?: string;
  ext?: string;
  mtime?: number;
  children?: TreeNode[];
}

/**
 * Build a nested folder tree from a flat list of items, deriving folder nodes
 * from each item's path segments. Folder and file order follow first-seen order;
 * root-level files appear at the top level.
 *
 * @param items - Already-ordered items.
 * @returns The top-level tree nodes (the synthetic root's children).
 */
export function buildTree(items: RecentItem[]): TreeNode[] {
  const root: TreeNode = { key: "", name: "", type: "folder", children: [] };
  const byPrefix = new Map<string, TreeNode>([["", root]]);
  for (const it of items) {
    const segs = it.folder ? it.folder.split("/") : [];
    let parent = root;
    let prefix = "";
    for (const seg of segs) {
      prefix = prefix ? `${prefix}/${seg}` : seg;
      let node = byPrefix.get(prefix);
      if (!node) {
        node = { key: prefix, name: seg, type: "folder", children: [] };
        byPrefix.set(prefix, node);
        parent.children!.push(node);
      }
      parent = node;
    }
    parent.children!.push({ key: it.path, name: it.name, type: "file", path: it.path, ext: it.ext, mtime: it.mtime });
  }
  return root.children!;
}
