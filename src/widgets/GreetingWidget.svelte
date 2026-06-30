<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { greeting } from "../lib/greeting";

  export let instance;
  export const app = undefined;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: name = cfg.name ?? "";
  $: showClock = cfg.showClock ?? true;
  $: showDate = cfg.showDate ?? true;
  $: use24h = cfg.use24h ?? true;

  let now = new Date();
  let timer: ReturnType<typeof setInterval> | undefined;
  onMount(() => { timer = setInterval(() => (now = new Date()), 1000); });
  onDestroy(() => { if (timer) clearInterval(timer); });

  $: hello = greeting(now.getHours()) + (name ? `, ${name}` : "");
  $: time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: !use24h });
  $: date = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
</script>

<div class="atrium-greeting">
  <div class="atrium-greeting-hello">{hello}</div>
  {#if showClock}<div class="atrium-greeting-time">{time}</div>{/if}
  {#if showDate}<div class="atrium-greeting-date">{date}</div>{/if}
</div>

<style>
  .atrium-greeting { height: 100%; display: flex; flex-direction: column; justify-content: center; }
  .atrium-greeting-hello { font-size: 1.4em; font-weight: 600; color: var(--text-normal); }
  .atrium-greeting-time { font-size: 2em; font-weight: 700; color: var(--atrium-accent, var(--text-normal)); line-height: 1.1; }
  .atrium-greeting-date { color: var(--text-muted); font-size: 0.9em; }
</style>
