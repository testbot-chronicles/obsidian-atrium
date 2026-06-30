import type { SettingsField } from "./registry";

/** Per-widget card title/header settings. */
export interface WidgetGeneral {
  title: string;        // "" → fall back to the widget's default title
  showTitle: boolean;
  titleAlign: string;   // "left" | "center" | "right"
  titlePosition: string; // "top" | "bottom"
}

/** Defaults for a widget; a widget with a `defaultTitle` shows its header by default. */
export function defaultGeneral(defaultTitle?: string): WidgetGeneral {
  return {
    title: defaultTitle ?? "",
    showTitle: defaultTitle != null,
    titleAlign: "left",
    titlePosition: "top",
  };
}

export const GENERAL_SCHEMA: SettingsField[] = [
  { key: "showTitle", label: "Show title", type: "toggle" },
  { key: "title", label: "Title text", type: "text", showIf: { key: "showTitle", equals: true } },
  { key: "titleAlign", label: "Title align", type: "buttons",
    options: [ { value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" } ],
    showIf: { key: "showTitle", equals: true } },
  { key: "titlePosition", label: "Title position", type: "buttons",
    options: [ { value: "top", label: "Top" }, { value: "bottom", label: "Bottom" } ],
    showIf: { key: "showTitle", equals: true } },
];

export interface ResolvedTitle { show: boolean; text: string; align: string; position: string; }

/** Resolve the effective title from the instance's general settings + the widget def. */
export function resolveTitle(
  general: Partial<WidgetGeneral> | undefined,
  def: { defaultTitle?: string; title: string },
): ResolvedTitle {
  const show = general?.showTitle ?? (def.defaultTitle != null);
  const text = (typeof general?.title === "string" && general.title.trim()) || def.defaultTitle || def.title;
  return {
    show,
    text,
    align: general?.titleAlign ?? "left",
    position: general?.titlePosition ?? "top",
  };
}
