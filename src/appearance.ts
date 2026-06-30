import type { SettingsField } from "./registry";

/** Per-widget container styling, applied to the widget host element. */
export interface WidgetAppearance {
  useBackground: boolean;
  background: string;   // "" → theme default (--background-secondary)
  padding: number;      // px
  radius: number;       // px
  border: boolean;
  borderColor: string;  // "" → theme default (--background-modifier-border)
  shadow: boolean;
}

/** Defaults reproduce the current card look. */
export const DEFAULT_APPEARANCE: WidgetAppearance = {
  useBackground: true,
  background: "",
  padding: 12,
  radius: 8,
  border: true,
  borderColor: "",
  shadow: false,
};

export const APPEARANCE_SCHEMA: SettingsField[] = [
  { key: "useBackground", label: "Background", type: "toggle" },
  { key: "background", label: "Background color", type: "color", showIf: { key: "useBackground", equals: true } },
  { key: "padding", label: "Padding (px)", type: "slider", min: 0, max: 40, step: 1 },
  { key: "radius", label: "Corner radius (px)", type: "slider", min: 0, max: 48, step: 1 },
  { key: "border", label: "Border", type: "toggle" },
  { key: "borderColor", label: "Border color", type: "color", showIf: { key: "border", equals: true } },
  { key: "shadow", label: "Drop shadow", type: "toggle" },
];

/** Resolve the appearance into inline styles applied to the widget host element. */
export function applyAppearanceStyles(host: HTMLElement, raw: Partial<WidgetAppearance> | undefined): void {
  const a: WidgetAppearance = { ...DEFAULT_APPEARANCE, ...(raw ?? {}) };
  host.style.background = a.useBackground ? a.background || "var(--background-secondary)" : "transparent";
  host.style.padding = `${a.padding}px`;
  host.style.borderRadius = `${a.radius}px`;
  host.style.border = a.border ? `1px solid ${a.borderColor || "var(--background-modifier-border)"}` : "none";
  host.style.boxShadow = a.shadow ? "0 4px 14px rgba(0, 0, 0, 0.3)" : "none";
}
