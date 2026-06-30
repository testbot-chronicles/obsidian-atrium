<script lang="ts">
  export let instance;
  export let app;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: src = cfg.src ?? "";
  $: fit = cfg.fit ?? "contain";
  $: scale = typeof cfg.scale === "number" ? cfg.scale : 100;
  $: halign = cfg.halign ?? "center";  // flex justify-content value
  $: valign = cfg.valign ?? "center";  // flex align-items value
  $: grayscale = cfg.grayscale ?? false;
  $: opacity = typeof cfg.opacity === "number" ? cfg.opacity : 100;
  $: link = (cfg.link ?? "").toString();

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

  $: containerStyle = `justify-content:${halign};align-items:${valign};`;
  // Sizing applies to the outer box (img or link button); look applies to the img itself.
  $: boxStyle = `width:${scale}%;height:${scale}%;`;
  $: imgStyle =
    `object-fit:${fit};` +
    `filter:grayscale(${grayscale ? 1 : 0});opacity:${opacity / 100};`;

  function activate(): void {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) window.open(link, "_blank");
    else app?.workspace?.openLinkText?.(link, "", false);
  }
</script>

<div class="atrium-logo" style={containerStyle}>
  {#if url}
    {#if link}
      <button type="button" class="atrium-logo-link" style={boxStyle} on:click={activate}>
        <img class="atrium-logo-img" src={url} alt="" style={imgStyle} />
      </button>
    {:else}
      <img class="atrium-logo-img" src={url} alt="" style={boxStyle + imgStyle} />
    {/if}
  {:else}
    <div class="atrium-logo-empty">Set an image path or URL in settings ⚙</div>
  {/if}
</div>

<style>
  .atrium-logo { width: 100%; height: 100%; display: flex; overflow: hidden; }
  .atrium-logo-img { display: block; }
  /* A linked logo wraps the image in a button; strip native chrome so only the image shows. */
  .atrium-logo-link {
    padding: 0; border: none; background: none; cursor: pointer;
    box-shadow: none; display: block; line-height: 0;
  }
  .atrium-logo-link .atrium-logo-img { width: 100%; height: 100%; }
  .atrium-logo-empty { color: var(--text-faint); font-size: 0.85em; text-align: center; padding: 8px; margin: auto; }
</style>
