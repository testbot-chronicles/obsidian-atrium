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
      { key: "src", label: "Image path or URL", type: "text" },
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
    defaultConfig: { count: 7, showFolder: false },
    settingsSchema: [
      { key: "count", label: "How many", type: "slider", min: 3, max: 20, step: 1 },
      { key: "showFolder", label: "Show folder", type: "toggle" },
    ],
  });
  registerWidget({
    type: "stats", title: "Vault stats", icon: "bar-chart-3", defaultSize: { w: 4, h: 2 },
    Component: StatsWidget as never,
    defaultTitle: "Stats",
    defaultConfig: { showNotes: true, showAttachments: true, showFiles: false },
    settingsSchema: [
      { key: "showNotes", label: "Notes count", type: "toggle" },
      { key: "showAttachments", label: "Attachments count", type: "toggle" },
      { key: "showFiles", label: "All files count", type: "toggle" },
    ],
  });
  registerWidget({
    type: "greeting", title: "Greeting + clock", icon: "sun", defaultSize: { w: 6, h: 2 },
    Component: GreetingWidget as never,
    defaultConfig: { name: "", showClock: true, showDate: true, use24h: true },
    settingsSchema: [
      { key: "name", label: "Your name", type: "text" },
      { key: "showClock", label: "Show clock", type: "toggle" },
      { key: "showDate", label: "Show date", type: "toggle" },
      { key: "use24h", label: "24-hour clock", type: "toggle" },
    ],
  });
}
