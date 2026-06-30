import { registerWidget } from "../registry";
import TitleWidget from "./TitleWidget.svelte";
import LogoWidget from "./LogoWidget.svelte";
import RecentWidget from "./RecentWidget.svelte";
import StatsWidget from "./StatsWidget.svelte";
import GreetingWidget from "./GreetingWidget.svelte";

/** Register all built-in widgets. Call once during plugin onload. */
export function registerAllWidgets(): void {
  registerWidget({
    type: "title",
    title: "Title",
    icon: "type",
    defaultSize: { w: 12, h: 2 },
    Component: TitleWidget as never,
    defaultConfig: {
      text: "My Vault",
      fontSize: 40,
      align: "left",
      valign: "center",
      weight: "700",
      fontFamily: "default",
      uppercase: false,
      italic: false,
      letterSpacing: 0,
      customColor: false,
      color: "#888888",
    },
    settingsSchema: [
      { key: "text", label: "Text", type: "text" },
      { key: "fontSize", label: "Font size (px)", type: "slider", min: 12, max: 120, step: 1 },
      {
        key: "align",
        label: "Horizontal align",
        type: "buttons",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
      {
        key: "valign",
        label: "Vertical align",
        type: "buttons",
        options: [
          { value: "flex-start", label: "Top" },
          { value: "center", label: "Middle" },
          { value: "flex-end", label: "Bottom" },
        ],
      },
      {
        key: "weight",
        label: "Weight",
        type: "buttons",
        options: [
          { value: "300", label: "Light" },
          { value: "400", label: "Normal" },
          { value: "700", label: "Bold" },
        ],
      },
      {
        key: "fontFamily",
        label: "Font",
        type: "buttons",
        options: [
          { value: "default", label: "Default" },
          { value: "serif", label: "Serif" },
          { value: "monospace", label: "Mono" },
        ],
      },
      { key: "uppercase", label: "Uppercase", type: "toggle" },
      { key: "italic", label: "Italic", type: "toggle" },
      { key: "letterSpacing", label: "Letter spacing (px)", type: "slider", min: -2, max: 16, step: 0.5 },
      { key: "customColor", label: "Custom color", type: "toggle" },
      { key: "color", label: "Color", type: "color", showIf: { key: "customColor", equals: true } },
    ],
  });
  registerWidget({
    type: "logo", title: "Logo / Image", icon: "image", defaultSize: { w: 3, h: 3 },
    Component: LogoWidget as never,
    defaultConfig: {
      src: "", fit: "contain", scale: 100, halign: "center", valign: "center",
      link: "", grayscale: false, opacity: 100,
    },
    settingsSchema: [
      { key: "src", label: "Image path or URL", type: "image" },
      { key: "fit", label: "Fit", type: "buttons", options: [
        { value: "contain", label: "Contain" }, { value: "cover", label: "Cover" }, { value: "fill", label: "Fill" } ] },
      { key: "scale", label: "Image size (%)", type: "slider", min: 10, max: 100, step: 1 },
      { key: "halign", label: "Horizontal position", type: "buttons", options: [
        { value: "flex-start", label: "Left" }, { value: "center", label: "Center" }, { value: "flex-end", label: "Right" } ] },
      { key: "valign", label: "Vertical position", type: "buttons", options: [
        { value: "flex-start", label: "Top" }, { value: "center", label: "Middle" }, { value: "flex-end", label: "Bottom" } ] },
      { key: "link", label: "Open on click (note or URL)", type: "text" },
      { key: "grayscale", label: "Grayscale", type: "toggle" },
      { key: "opacity", label: "Opacity (%)", type: "slider", min: 10, max: 100, step: 1 },
    ],
  });
  registerWidget({
    type: "recent", title: "Recent files", icon: "history", defaultSize: { w: 4, h: 4 },
    Component: RecentWidget as never,
    defaultTitle: "Recent files",
    defaultConfig: { source: "opened", type: "markdown", count: 7, view: "list", showIcon: true, showDate: false, textColor: "", subColor: "", iconColor: "" },
    settingsSchema: [
      { key: "source", label: "Source", type: "select", options: [
        { value: "opened", label: "Recently opened" }, { value: "modified", label: "Recently modified" }, { value: "created", label: "Recently created" } ] },
      { key: "type", label: "File types", type: "buttons", options: [ { value: "markdown", label: "Notes" }, { value: "all", label: "All" } ] },
      { key: "count", label: "How many", type: "slider", min: 3, max: 20, step: 1 },
      { key: "view", label: "Layout", type: "buttons", options: [ { value: "list", label: "List" }, { value: "tree", label: "Tree" } ] },
      { key: "showIcon", label: "Show file icon", type: "toggle" },
      { key: "showDate", label: "Show date", type: "toggle" },
      { key: "textColor", label: "Text color", type: "color", group: "Colors" },
      { key: "subColor", label: "Secondary color", type: "color", group: "Colors" },
      { key: "iconColor", label: "Icon color", type: "color", group: "Colors" },
    ],
  });
  registerWidget({
    type: "stats", title: "Vault stats", icon: "bar-chart-3", defaultSize: { w: 4, h: 2 },
    Component: StatsWidget as never,
    defaultTitle: "Stats",
    defaultConfig: {
      stats: ["notes", "attachments", "allFiles"],
      orientation: "row", columns: 2, numberSize: 24, showIcons: false, compact: false,
      numberColor: "", labelColor: "",
    },
    settingsSchema: [
      { key: "stats", label: "Stats shown", type: "orderlist", options: [
        { value: "notes", label: "Notes" },
        { value: "attachments", label: "Attachments" },
        { value: "allFiles", label: "All files" },
        { value: "folders", label: "Folders" },
        { value: "links", label: "Links" },
        { value: "unresolvedLinks", label: "Unresolved links" },
        { value: "tags", label: "Tags" },
        { value: "tasks", label: "Tasks (done/total)" },
        { value: "words", label: "Words (async)" },
        { value: "characters", label: "Characters (async)" },
        { value: "readingTime", label: "Reading time (async)" },
        { value: "createdToday", label: "Created today" },
        { value: "createdWeek", label: "Created this week" },
        { value: "modifiedToday", label: "Edited today" },
      ] },
      { key: "orientation", label: "Orientation", type: "buttons", options: [ { value: "row", label: "Row" }, { value: "list", label: "List" }, { value: "grid", label: "Grid" } ] },
      { key: "columns", label: "Grid columns", type: "slider", min: 1, max: 4, step: 1, showIf: { key: "orientation", equals: "grid" } },
      { key: "numberSize", label: "Number size (px)", type: "slider", min: 12, max: 64, step: 1 },
      { key: "showIcons", label: "Show icons", type: "toggle" },
      { key: "compact", label: "Compact", type: "toggle" },
      { key: "numberColor", label: "Number color", type: "color", group: "Colors" },
      { key: "labelColor", label: "Label color", type: "color", group: "Colors" },
    ],
  });
  registerWidget({
    type: "greeting", title: "Greeting + clock", icon: "sun", defaultSize: { w: 6, h: 3 },
    Component: GreetingWidget as never,
    defaultConfig: {
      elements: ["greeting", "clock", "date"], alignment: "left",
      name: "", msgMorning: "", msgAfternoon: "", msgEvening: "", msgNight: "", showEmoji: false, greetingSize: 22,
      use24h: true, showSeconds: false, blinkColon: false, clockSize: 32,
      dateStyle: "full", showWeekNumber: false, dateSize: 14,
      worldTimezone: "", worldLabel: "", worldSize: 18,
      countdownDate: "", countdownLabel: "", countdownSize: 16,
      greetingColor: "", clockColor: "", worldColor: "", dateColor: "", countdownColor: "",
    },
    settingsSchema: [
      { key: "elements", label: "Elements shown", type: "orderlist", options: [
        { value: "greeting", label: "Greeting" }, { value: "clock", label: "Clock" },
        { value: "worldClock", label: "World clock" }, { value: "date", label: "Date" }, { value: "countdown", label: "Countdown" } ] },
      { key: "alignment", label: "Align", type: "buttons", options: [ { value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" } ] },
      { key: "name", label: "Your name", type: "text", group: "Greeting" },
      { key: "msgMorning", label: "Morning message", type: "text", placeholder: "Good morning", group: "Greeting" },
      { key: "msgAfternoon", label: "Afternoon message", type: "text", placeholder: "Good afternoon", group: "Greeting" },
      { key: "msgEvening", label: "Evening message", type: "text", placeholder: "Good evening", group: "Greeting" },
      { key: "msgNight", label: "Night message", type: "text", placeholder: "Good night", group: "Greeting" },
      { key: "showEmoji", label: "Time-of-day emoji", type: "toggle", group: "Greeting" },
      { key: "greetingSize", label: "Greeting size (px)", type: "slider", min: 12, max: 48, step: 1, group: "Greeting" },
      { key: "greetingColor", label: "Color", type: "color", group: "Greeting" },
      { key: "use24h", label: "24-hour", type: "toggle", group: "Clock" },
      { key: "showSeconds", label: "Show seconds", type: "toggle", group: "Clock" },
      { key: "blinkColon", label: "Blinking colon", type: "toggle", group: "Clock" },
      { key: "clockSize", label: "Clock size (px)", type: "slider", min: 16, max: 96, step: 1, group: "Clock" },
      { key: "clockColor", label: "Color", type: "color", group: "Clock" },
      { key: "dateStyle", label: "Date format", type: "select", options: [ { value: "full", label: "Weekday, day month" }, { value: "long", label: "Day month year" }, { value: "short", label: "Numeric" } ], group: "Date" },
      { key: "showWeekNumber", label: "Week number", type: "toggle", group: "Date" },
      { key: "dateSize", label: "Date size (px)", type: "slider", min: 10, max: 32, step: 1, group: "Date" },
      { key: "dateColor", label: "Color", type: "color", group: "Date" },
      { key: "worldTimezone", label: "Timezone (IANA, e.g. America/New_York)", type: "text", group: "World clock" },
      { key: "worldLabel", label: "Label", type: "text", group: "World clock" },
      { key: "worldSize", label: "Size (px)", type: "slider", min: 12, max: 48, step: 1, group: "World clock" },
      { key: "worldColor", label: "Color", type: "color", group: "World clock" },
      { key: "countdownDate", label: "Target date (YYYY-MM-DD)", type: "text", placeholder: "2026-12-31", group: "Countdown" },
      { key: "countdownLabel", label: "Label", type: "text", group: "Countdown" },
      { key: "countdownSize", label: "Size (px)", type: "slider", min: 12, max: 32, step: 1, group: "Countdown" },
      { key: "countdownColor", label: "Color", type: "color", group: "Countdown" },
    ],
  });
}
