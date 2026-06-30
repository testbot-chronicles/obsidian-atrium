<script lang="ts">
  export let instance;
  // Accepted from the uniform mount props but unused here. `export const` declares
  // them as props (no unknown-prop warning at mount) without an unused-export warning.
  export const app = undefined;
  export const plugin = undefined;
  $: cfg = instance?.config ?? {};
  $: text = cfg.text ?? "My Vault";
  $: size = cfg.size ?? "2.5rem";
  $: color = cfg.color ?? "var(--text-normal)";
</script>

<div class="atrium-title" style="font-size:{size}; color:{color};">{text}</div>

<style>
  .atrium-title { font-weight: 700; display: flex; align-items: center; height: 100%; }
</style>
