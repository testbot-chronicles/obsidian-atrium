<script lang="ts">
  export let instance;
  export let app;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: showNotes = cfg.showNotes ?? true;
  $: showAttachments = cfg.showAttachments ?? true;
  $: showFiles = cfg.showFiles ?? false;

  $: notes = app?.vault?.getMarkdownFiles?.().length ?? 0;
  $: files = app?.vault?.getFiles?.().length ?? 0;
  $: attachments = Math.max(0, files - notes);

  $: rows = [
    showNotes ? { label: "Notes", value: notes } : null,
    showAttachments ? { label: "Attachments", value: attachments } : null,
    showFiles ? { label: "All files", value: files } : null,
  ].filter(Boolean);
</script>

<div class="atrium-stats">
  {#each rows as r}
    <div class="atrium-stat"><span class="atrium-stat-num">{r.value}</span><span class="atrium-stat-label">{r.label}</span></div>
  {/each}
</div>

<style>
  .atrium-stats { height: 100%; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .atrium-stat { display: flex; flex-direction: column; }
  .atrium-stat-num { font-size: 1.6em; font-weight: 700; color: var(--text-normal); line-height: 1; }
  .atrium-stat-label { color: var(--text-muted); font-size: 0.8em; }
</style>
