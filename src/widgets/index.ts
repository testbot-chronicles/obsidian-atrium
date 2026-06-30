import { registerWidget } from "../registry";
import TitleWidget from "./TitleWidget.svelte";

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
}
