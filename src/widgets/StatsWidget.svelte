<script lang="ts">
  import { onMount } from "svelte";
  import { setIcon, TFolder } from "obsidian";
  import { countWords, countSince, sumLinkMap, startOfDay } from "../lib/stats";

  export let instance;
  export let app;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: orientation = cfg.orientation ?? "row";
  $: columns = typeof cfg.columns === "number" ? cfg.columns : 2;
  $: numberSize = typeof cfg.numberSize === "number" ? cfg.numberSize : 24;
  $: showIcons = cfg.showIcons ?? false;
  $: compact = cfg.compact ?? false;

  const DEFS = [
    { key: "notes", label: "Notes", icon: "file-text" },
    { key: "attachments", label: "Attachments", icon: "paperclip" },
    { key: "allFiles", label: "All files", icon: "files" },
    { key: "folders", label: "Folders", icon: "folder" },
    { key: "links", label: "Links", icon: "link" },
    { key: "unresolvedLinks", label: "Unresolved", icon: "unlink" },
    { key: "tags", label: "Tags", icon: "tag" },
    { key: "tasks", label: "Tasks", icon: "check-square" },
    { key: "words", label: "Words", icon: "type" },
    { key: "characters", label: "Characters", icon: "a-large-small" },
    { key: "readingTime", label: "Read (min)", icon: "clock" },
    { key: "createdToday", label: "Created today", icon: "calendar-plus" },
    { key: "createdWeek", label: "Created (7d)", icon: "calendar" },
    { key: "modifiedToday", label: "Edited today", icon: "pencil" },
  ];
  const CONTENT_KEYS = ["words", "characters", "readingTime"];

  $: selected = DEFS.filter((d) => cfg["show_" + d.key]);
  $: needContent = selected.some((d) => CONTENT_KEYS.includes(d.key));

  let cheap: Record<string, number | string> = {};
  let content: Record<string, number | null> = { words: null, characters: null, readingTime: null };

  function recomputeCheap(): void {
    if (!app) return;
    const md = app.vault.getMarkdownFiles();
    const all = app.vault.getFiles();
    const folders = app.vault.getAllLoadedFiles().filter((f: unknown) => f instanceof TFolder).length;
    const now = Date.now();
    const sod = startOfDay(now);
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    let done = 0, total = 0;
    for (const f of md) {
      const items = app.metadataCache.getFileCache(f)?.listItems ?? [];
      for (const li of items) {
        if (li.task !== undefined) { total++; if (li.task !== " ") done++; }
      }
    }
    cheap = {
      notes: md.length,
      attachments: all.length - md.length,
      allFiles: all.length,
      folders: Math.max(0, folders - 1),
      links: sumLinkMap(app.metadataCache.resolvedLinks ?? {}),
      unresolvedLinks: sumLinkMap(app.metadataCache.unresolvedLinks ?? {}),
      tags: Object.keys(app.metadataCache.getTags?.() ?? {}).length,
      tasks: `${done}/${total}`,
      createdToday: countSince(md.map((f: any) => f.stat.ctime), sod),
      createdWeek: countSince(md.map((f: any) => f.stat.ctime), weekAgo),
      modifiedToday: countSince(md.map((f: any) => f.stat.mtime), sod),
    };
  }

  async function recomputeContent(): Promise<void> {
    if (!app) return;
    const md = app.vault.getMarkdownFiles();
    let words = 0, chars = 0;
    for (const f of md) {
      const text = await app.vault.cachedRead(f);
      words += countWords(text);
      chars += text.length;
    }
    content = { words, characters: chars, readingTime: Math.max(1, Math.round(words / 200)) };
  }

  onMount(() => { recomputeCheap(); });
  $: if (needContent && content.words === null && app) recomputeContent();

  function valueOf(key: string): string {
    if (key in cheap) return String(cheap[key]);
    if (key in content) return content[key] === null ? "…" : String(content[key]);
    return "…";
  }
  function icon(node: HTMLElement, name: string) {
    setIcon(node, name);
    return { update(n: string) { node.empty(); setIcon(node, n); } };
  }

  $: gridStyle = orientation === "grid" ? `grid-template-columns:repeat(${columns},minmax(0,1fr));` : "";
</script>

<div class="atrium-stats" class:is-compact={compact} class:is-list={orientation === "list"} class:is-grid={orientation === "grid"} style={gridStyle}>
  {#each selected as d (d.key)}
    <div class="atrium-stat">
      {#if showIcons}<span class="atrium-stat-icon" use:icon={d.icon}></span>{/if}
      {#if compact}
        <span class="atrium-stat-label">{d.label}</span>
        <span class="atrium-stat-num" style={`font-size:${Math.max(12, Math.round(numberSize * 0.6))}px`}>{valueOf(d.key)}</span>
      {:else}
        <span class="atrium-stat-num" style={`font-size:${numberSize}px`}>{valueOf(d.key)}</span>
        <span class="atrium-stat-label">{d.label}</span>
      {/if}
    </div>
  {/each}
  {#if selected.length === 0}<div class="atrium-empty">Pick stats in settings ⚙</div>{/if}
</div>

<style>
  .atrium-stats { display: flex; flex-wrap: wrap; gap: 12px 18px; align-items: flex-start; }
  .atrium-stats.is-list { flex-direction: column; }
  .atrium-stats.is-grid { display: grid; gap: 12px; }
  .atrium-stat { display: flex; flex-direction: column; min-width: 0; }
  .atrium-stats.is-compact .atrium-stat { flex-direction: row; align-items: baseline; gap: 6px; }
  .atrium-stat-icon { display: inline-flex; width: 14px; height: 14px; color: var(--text-muted); }
  .atrium-stat-icon :global(svg) { width: 14px; height: 14px; }
  .atrium-stat-num { font-weight: 700; color: var(--atrium-accent, var(--text-normal)); line-height: 1.05; }
  .atrium-stat-label { color: var(--text-muted); font-size: 0.8em; }
  .atrium-empty { color: var(--text-faint); font-size: 0.85em; }
</style>
