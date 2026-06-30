<script lang="ts">
  export let instance;
  export let app;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: src = cfg.src ?? "";
  $: fit = cfg.fit ?? "contain";
  $: rounded = cfg.rounded ?? false;

  function resolve(s: string): string {
    if (!s) return "";
    if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
    try {
      return app?.vault?.adapter?.getResourcePath ? app.vault.adapter.getResourcePath(s) : s;
    } catch {
      return "";
    }
  }
  $: url = resolve(src);
</script>

<div class="atrium-logo">
  {#if url}
    <img src={url} alt="" style="object-fit:{fit}; border-radius:{rounded ? '12px' : '0'};" />
  {:else}
    <div class="atrium-logo-empty">Set an image path or URL in settings ⚙</div>
  {/if}
</div>

<style>
  .atrium-logo { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  /* The image fills the widget box so `object-fit` (contain/cover/fill) actually applies. */
  .atrium-logo img { width: 100%; height: 100%; display: block; }
  .atrium-logo-empty { color: var(--text-faint); font-size: 0.85em; text-align: center; padding: 8px; }
</style>
