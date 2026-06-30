<script lang="ts">
  import { setIcon, TFile } from "obsidian";
  import { orderRecent, buildTree, type RecentItem } from "../lib/recent";
  import RecentTree from "./RecentTree.svelte";

  export let instance;
  export let app;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: source = cfg.source ?? "opened";
  $: type = cfg.type ?? "markdown";
  $: count = typeof cfg.count === "number" ? cfg.count : 7;
  $: view = cfg.view ?? (cfg.groupByFolder ? "tree" : "list");
  $: showIcon = cfg.showIcon ?? true;
  $: showDate = cfg.showDate ?? false;
  $: textColor = typeof cfg.textColor === "string" ? cfg.textColor : "";
  $: subColor = typeof cfg.subColor === "string" ? cfg.subColor : "";
  $: iconColor = typeof cfg.iconColor === "string" ? cfg.iconColor : "";
  $: colorVars =
    (textColor ? `--atrium-recent-text:${textColor};` : "") +
    (subColor ? `--atrium-recent-sub:${subColor};` : "") +
    (iconColor ? `--atrium-recent-icon-color:${iconColor};` : "");

  function iconFor(ext: string): string {
    if (ext === "md") return "file-text";
    if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext)) return "image";
    if (ext === "pdf") return "file-text";
    if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)) return "music";
    if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "film";
    return "file";
  }
  function icon(node: HTMLElement, name: string) {
    setIcon(node, name);
    return { update(n: string) { node.empty(); setIcon(node, n); } };
  }
  function fmtDate(ms: number): string {
    if (!ms) return "";
    return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }

  function gather(source: string, type: string, count: number, app: any): RecentItem[] {
    if (!app) return [];
    const toItem = (f: any): RecentItem => ({
      path: f.path,
      name: f.basename ?? f.path,
      folder: f.parent && f.parent.path && f.parent.path !== "/" ? f.parent.path : "",
      ext: (f.extension ?? "").toLowerCase(),
      mtime: f.stat?.mtime ?? 0,
      ctime: f.stat?.ctime ?? 0,
    });
    let items: RecentItem[] = [];
    let openedOrder: string[] = [];
    if (source === "opened") {
      openedOrder = app.workspace.getLastOpenFiles?.() ?? [];
      items = openedOrder
        .map((p: string) => app.vault.getAbstractFileByPath(p))
        .filter((f: unknown) => f instanceof TFile)
        .map(toItem);
    } else {
      const files = type === "markdown" ? app.vault.getMarkdownFiles() : app.vault.getFiles();
      items = files.map(toItem);
    }
    return orderRecent(items, openedOrder, { source: source as any, type: type as any, count });
  }

  $: items = gather(source, type, count, app);

  function open(path: string): void {
    app?.workspace?.openLinkText?.(path, "", false);
  }
</script>

<div class="atrium-recent-root" style={colorVars}>
  {#if items.length === 0}
    <div class="atrium-empty">No recent files</div>
  {:else if view === "tree"}
    <RecentTree nodes={buildTree(items)} {showIcon} {showDate} onOpen={open} />
  {:else}
    <ul class="atrium-recent-list">
      {#each items as it (it.path)}
        <li>
          {#if showIcon}<span class="atrium-recent-icon" use:icon={iconFor(it.ext)}></span>{/if}
          <!-- svelte-ignore a11y-invalid-attribute -->
          <a href="#" on:click|preventDefault={() => open(it.path)}>{it.name}</a>
          {#if it.folder}<span class="atrium-sub">· {it.folder}</span>{/if}
          {#if showDate}<span class="atrium-sub">{fmtDate(it.mtime)}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .atrium-recent-root { height: 100%; }
  .atrium-recent-list { list-style: none; margin: 0 0 6px; padding: 0; }
  .atrium-recent-list li { display: flex; align-items: center; gap: 6px; padding: 2px 0; min-width: 0; }
  .atrium-recent-icon { display: inline-flex; width: 15px; height: 15px; color: var(--atrium-recent-icon-color, var(--text-muted)); flex: 0 0 auto; }
  .atrium-recent-icon :global(svg) { width: 15px; height: 15px; }
  .atrium-recent-list a { color: var(--atrium-recent-text, var(--text-normal)); cursor: pointer; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .atrium-recent-list a:hover { color: var(--text-accent); }
  .atrium-sub { color: var(--atrium-recent-sub, var(--text-faint)); font-size: 0.85em; flex: 0 0 auto; }
  .atrium-empty { color: var(--text-faint); font-size: 0.85em; }
</style>
