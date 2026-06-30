<script lang="ts">
  import { setIcon } from "obsidian";
  import { iconFor, type TreeNode } from "../lib/recent";

  export let nodes: TreeNode[];
  export let showIcon: boolean;
  export let showDate: boolean;
  export let onOpen: (path: string) => void;

  function icon(node: HTMLElement, name: string) {
    setIcon(node, name);
    return { update(n: string) { node.empty(); setIcon(node, n); } };
  }
  function fmtDate(ms: number | undefined): string {
    if (!ms) return "";
    return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }
</script>

<ul class="atrium-tree-list">
  {#each nodes as n (n.key)}
    <li class:is-folder={n.type === "folder"}>
      {#if n.type === "folder"}
        <div class="atrium-tree-folder">
          <span class="atrium-recent-icon" use:icon={"folder"}></span><span class="atrium-tree-name">{n.name}</span>
        </div>
        {#if n.children && n.children.length}
          <svelte:self nodes={n.children} {showIcon} {showDate} {onOpen} />
        {/if}
      {:else}
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a class="atrium-tree-file" href="#" on:click|preventDefault={() => onOpen(n.path ?? "")}>
          {#if showIcon}<span class="atrium-recent-icon" use:icon={iconFor(n.ext ?? "")}></span>{/if}
          <span class="atrium-tree-name">{n.name}</span>
          {#if showDate}<span class="atrium-sub">{fmtDate(n.mtime)}</span>{/if}
        </a>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .atrium-tree-list { list-style: none; margin: 0; padding-left: 14px; }
  .atrium-tree-list .atrium-recent-icon { display: inline-flex; width: 14px; height: 14px; color: var(--text-muted); flex: 0 0 auto; }
  .atrium-tree-list .atrium-recent-icon :global(svg) { width: 14px; height: 14px; }
  /* connector lines */
  li { position: relative; padding-left: 14px; }
  li::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; border-left: 1px solid var(--atrium-accent, var(--background-modifier-border)); }
  li::after { content: ""; position: absolute; left: 0; top: 0.7em; width: 9px; border-top: 1px solid var(--atrium-accent, var(--background-modifier-border)); }
  li:last-child::before { bottom: auto; height: 0.7em; }
  .atrium-tree-folder, .atrium-tree-file { display: flex; align-items: center; gap: 6px; padding: 2px 0; min-width: 0; }
  .atrium-tree-folder { color: var(--text-muted); font-weight: 600; }
  .atrium-tree-file { color: var(--text-normal); text-decoration: none; cursor: pointer; }
  .atrium-tree-file:hover { color: var(--text-accent); }
  .atrium-tree-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .atrium-sub { color: var(--text-faint); font-size: 0.85em; flex: 0 0 auto; }
</style>
