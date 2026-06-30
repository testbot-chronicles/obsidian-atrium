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
    defaultConfig: { text: "My Vault" },
    settingsSchema: [
      { key: "text", label: "Text", type: "text" },
      { key: "size", label: "Font size (CSS, e.g. 2.5rem)", type: "text" },
      { key: "color", label: "Color", type: "color" },
    ],
  });
}
