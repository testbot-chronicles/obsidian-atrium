<script lang="ts">
  export let instance;
  export let app;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: count = typeof cfg.count === "number" ? cfg.count : 7;
  $: showFolder = cfg.showFolder ?? false;

  function recents(): { path: string; name: string; folder: string }[] {
    const paths: string[] = app?.workspace?.getLastOpenFiles?.() ?? [];
    return paths
      .filter((p) => app?.vault?.getAbstractFileByPath?.(p))
      .slice(0, count)
      .map((p) => {
        const name = p.split("/").pop()?.replace(/\.md$/, "") ?? p;
        const folder = p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "";
        return { path: p, name, folder };
      });
  }
  $: items = recents();

  function open(path: string): void {
    app?.workspace?.openLinkText?.(path, "", false);
  }
</script>

<div class="atrium-recent">
  <div class="atrium-list-title">Recent</div>
  {#if items.length === 0}
    <div class="atrium-empty">No recent files</div>
  {:else}
    <ul>
      {#each items as it}
        <li><a href={"#"} on:click|preventDefault={() => open(it.path)}>
          {it.name}{#if showFolder && it.folder}<span class="atrium-sub"> · {it.folder}</span>{/if}
        </a></li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .atrium-recent { height: 100%; overflow: auto; }
  .atrium-list-title { font-weight: 600; color: var(--text-muted); margin-bottom: 6px; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.04em; }
  .atrium-recent ul { list-style: none; margin: 0; padding: 0; }
  .atrium-recent li { padding: 2px 0; }
  .atrium-recent a { color: var(--text-normal); cursor: pointer; text-decoration: none; }
  .atrium-recent a:hover { color: var(--text-accent); }
  .atrium-sub { color: var(--text-faint); font-size: 0.85em; }
  .atrium-empty { color: var(--text-faint); font-size: 0.85em; }
</style>
