<script lang="ts">
  export let instance;
  // Accepted from the uniform mount props but unused here. `export const` declares
  // them as props (no unknown-prop warning at mount) without an unused-export warning.
  export const app = undefined;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: text = cfg.text ?? "My Vault";
  // Back-compat: old config used `size` as a CSS string; new uses `fontSize` (px number).
  $: fontSize = typeof cfg.fontSize === "number" ? `${cfg.fontSize}px` : (cfg.size ?? "2.5rem");
  $: align = cfg.align ?? "left";
  $: justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  $: valign = cfg.valign ?? "center";
  $: weight = cfg.weight ?? "700";
  $: family =
    cfg.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif"
    : cfg.fontFamily === "monospace" ? "var(--font-monospace, monospace)"
    : "inherit";
  $: color = cfg.customColor && typeof cfg.color === "string" ? cfg.color : "var(--atrium-accent, var(--text-normal))";
  $: transform = cfg.uppercase ? "uppercase" : "none";
  $: fontStyle = cfg.italic ? "italic" : "normal";
  $: letterSpacing = `${typeof cfg.letterSpacing === "number" ? cfg.letterSpacing : 0}px`;

  $: style =
    `font-size:${fontSize};color:${color};font-weight:${weight};font-family:${family};` +
    `text-transform:${transform};font-style:${fontStyle};letter-spacing:${letterSpacing};` +
    `justify-content:${justify};align-items:${valign};text-align:${align};`;
</script>

<div class="atrium-title" {style} title={text}>{text}</div>

<style>
  .atrium-title { display: flex; height: 100%; width: 100%; overflow: hidden; }
</style>
