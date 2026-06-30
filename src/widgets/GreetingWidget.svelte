<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { periodOf, emojiForPeriod, isoWeek, daysUntil } from "../lib/datetime";

  export let instance;
  export const app = undefined;
  export const plugin = undefined;

  $: cfg = instance?.config ?? {};
  $: elements = Array.isArray(cfg.elements) ? (cfg.elements as string[]) : ["greeting", "clock", "date"];
  $: alignment = cfg.alignment ?? "left";

  $: name = cfg.name ?? "";
  $: showEmoji = cfg.showEmoji ?? false;
  $: greetingSize = typeof cfg.greetingSize === "number" ? cfg.greetingSize : 22;
  $: use24h = cfg.use24h ?? true;
  $: showSeconds = cfg.showSeconds ?? false;
  $: blinkColon = cfg.blinkColon ?? false;
  $: clockSize = typeof cfg.clockSize === "number" ? cfg.clockSize : 32;
  $: dateStyle = cfg.dateStyle ?? "full";
  $: showWeekNumber = cfg.showWeekNumber ?? false;
  $: dateSize = typeof cfg.dateSize === "number" ? cfg.dateSize : 14;
  $: worldTimezone = cfg.worldTimezone ?? "";
  $: worldLabel = cfg.worldLabel ?? "";
  $: worldSize = typeof cfg.worldSize === "number" ? cfg.worldSize : 18;
  $: countdownDate = cfg.countdownDate ?? "";
  $: countdownLabel = cfg.countdownLabel ?? "";
  $: countdownSize = typeof cfg.countdownSize === "number" ? cfg.countdownSize : 16;

  let now = new Date();
  let timer: ReturnType<typeof setInterval> | undefined;
  onMount(() => { timer = setInterval(() => (now = new Date()), 1000); });
  onDestroy(() => { if (timer) clearInterval(timer); });

  $: period = periodOf(now.getHours());
  $: baseMsg =
    period === "morning" ? (cfg.msgMorning || "Good morning")
    : period === "afternoon" ? (cfg.msgAfternoon || "Good afternoon")
    : period === "evening" ? (cfg.msgEvening || "Good evening")
    : (cfg.msgNight || "Good night");
  $: hello = baseMsg + (name ? `, ${name}` : "");
  $: emoji = showEmoji ? emojiForPeriod(period) : "";

  function clockParts(d: Date, h24: boolean) {
    let h = d.getHours();
    let ampm = "";
    if (!h24) { ampm = h >= 12 ? " PM" : " AM"; h = h % 12 || 12; }
    return {
      hh: h24 ? String(h).padStart(2, "0") : String(h),
      mm: String(d.getMinutes()).padStart(2, "0"),
      ss: String(d.getSeconds()).padStart(2, "0"),
      ampm,
    };
  }
  $: t = clockParts(now, use24h);

  function fmtDate(d: Date, style: string): string {
    if (style === "short") return d.toLocaleDateString(undefined, { day: "numeric", month: "numeric", year: "numeric" });
    if (style === "long") return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  }
  $: dateText = fmtDate(now, dateStyle) + (showWeekNumber ? ` · W${isoWeek(now)}` : "");

  function worldTime(d: Date, tz: string, h24: boolean): string {
    if (!tz) return "";
    try {
      return new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: !h24 }).format(d);
    } catch { return "—"; }
  }
  $: worldText = worldTime(now, worldTimezone, use24h);

  $: countdownText = (() => {
    if (!countdownDate) return "";
    const target = Date.parse(countdownDate);
    if (isNaN(target)) return "";
    const days = daysUntil(target, now.getTime());
    const body = days === 0 ? "Today" : days > 0 ? `${days} day${days > 1 ? "s" : ""} left` : `${-days} day${-days > 1 ? "s" : ""} ago`;
    return countdownLabel ? `${countdownLabel}: ${body}` : body;
  })();
</script>

<div class="atrium-greeting" style={`text-align:${alignment};`}>
  {#each elements as el (el)}
    {#if el === "greeting"}
      <div class="atrium-greeting-hello" style={`font-size:${greetingSize}px`}>{emoji ? emoji + " " : ""}{hello}</div>
    {:else if el === "clock"}
      <div class="atrium-greeting-time" class:is-blink={blinkColon} style={`font-size:${clockSize}px`}>{t.hh}<span class="colon">:</span>{t.mm}{#if showSeconds}<span class="colon">:</span>{t.ss}{/if}{t.ampm}</div>
    {:else if el === "worldClock"}
      {#if worldText}<div class="atrium-greeting-world" style={`font-size:${worldSize}px`}>{worldLabel ? worldLabel + " " : ""}{worldText}</div>{/if}
    {:else if el === "date"}
      <div class="atrium-greeting-date" style={`font-size:${dateSize}px`}>{dateText}</div>
    {:else if el === "countdown"}
      {#if countdownText}<div class="atrium-greeting-countdown" style={`font-size:${countdownSize}px`}>{countdownText}</div>{/if}
    {/if}
  {/each}
</div>

<style>
  .atrium-greeting { height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
  .atrium-greeting-hello { font-weight: 600; color: var(--text-normal); }
  .atrium-greeting-time { font-weight: 700; color: var(--atrium-accent, var(--text-normal)); line-height: 1.1; }
  .atrium-greeting-world { color: var(--text-muted); }
  .atrium-greeting-date { color: var(--text-muted); }
  .atrium-greeting-countdown { color: var(--text-muted); }
  .atrium-greeting-time.is-blink .colon { animation: atrium-blink 1s steps(1) infinite; }
  @keyframes atrium-blink { 50% { opacity: 0; } }
</style>
