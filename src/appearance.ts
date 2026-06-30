import type { App } from "obsidian";
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
  accent: boolean;
  accentColor: string;  // "" → theme default (--interactive-accent)
  bgImage: string;      // vault path or URL; "" → no background image
  bgFit: string;        // "cover" | "contain"
  bgPosition: string;   // "center" | "top" | "bottom" | "left" | "right"
  bgImageOpacity: number; // 0–100
  bgBlur: number;       // px
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
  accent: false,
  accentColor: "",
  bgImage: "",
  bgFit: "cover",
  bgPosition: "center",
  bgImageOpacity: 100,
  bgBlur: 0,
};

export const APPEARANCE_SCHEMA: SettingsField[] = [
  { key: "useBackground", label: "Background", type: "toggle" },
  { key: "background", label: "Background color", type: "color", showIf: { key: "useBackground", equals: true } },
  { key: "padding", label: "Padding (px)", type: "slider", min: 0, max: 40, step: 1 },
  { key: "radius", label: "Corner radius (px)", type: "slider", min: 0, max: 48, step: 1 },
  { key: "border", label: "Border", type: "toggle" },
  { key: "borderColor", label: "Border color", type: "color", showIf: { key: "border", equals: true } },
  { key: "shadow", label: "Drop shadow", type: "toggle" },
  { key: "accent", label: "Accent color", type: "toggle" },
  { key: "accentColor", label: "Accent", type: "color", showIf: { key: "accent", equals: true } },
  { key: "bgImage", label: "Image (vault path or URL)", type: "image", group: "Background image" },
  { key: "bgFit", label: "Fit", type: "buttons", options: [ { value: "cover", label: "Cover" }, { value: "contain", label: "Contain" } ], group: "Background image" },
  { key: "bgPosition", label: "Position", type: "select", options: [ { value: "center", label: "Center" }, { value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }, { value: "right", label: "Right" } ], group: "Background image" },
  { key: "bgImageOpacity", label: "Image opacity (%)", type: "slider", min: 0, max: 100, step: 1, group: "Background image" },
  { key: "bgBlur", label: "Image blur (px)", type: "slider", min: 0, max: 20, step: 1, group: "Background image" },
];

/**
 * Resolve a background-image source to a usable CSS URL.
 * - http(s) URLs and `data:` URIs are used as-is.
 * - Anything else is treated as a vault-relative path and resolved via the
 *   adapter's `getResourcePath`. Returns "" when it cannot be resolved.
 */
function resolveImg(s: string, app?: App): string {
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
  try {
    return app?.vault?.adapter?.getResourcePath ? app.vault.adapter.getResourcePath(s) : s;
  } catch {
    return "";
  }
}

/**
 * Resolve the appearance into inline styles applied to the widget host element.
 * When `app` is provided and a `.atrium-widget-bg` layer exists as a direct child
 * of `host`, the background image (with fit/position/opacity/blur) is styled onto
 * that separate layer so opacity/blur never affect the card content.
 */
export function applyAppearanceStyles(host: HTMLElement, raw: Partial<WidgetAppearance> | undefined, app?: App): void {
  const a: WidgetAppearance = { ...DEFAULT_APPEARANCE, ...(raw ?? {}) };
  host.style.background = a.useBackground ? a.background || "var(--background-secondary)" : "transparent";
  host.style.padding = `${a.padding}px`;
  host.style.borderRadius = `${a.radius}px`;
  host.style.border = a.border ? `1px solid ${a.borderColor || "var(--background-modifier-border)"}` : "none";
  host.style.boxShadow = a.shadow ? "0 4px 14px rgba(0, 0, 0, 0.3)" : "none";
  if (a.accent) host.style.setProperty("--atrium-accent", a.accentColor || "var(--interactive-accent)");
  else host.style.removeProperty("--atrium-accent");

  const bg = host.querySelector(":scope > .atrium-widget-bg") as HTMLElement | null;
  if (bg) {
    const url = resolveImg(a.bgImage, app);
    if (url) {
      bg.style.backgroundImage = `url("${url}")`;
      bg.style.backgroundSize = a.bgFit || "cover";
      bg.style.backgroundPosition = a.bgPosition || "center";
      bg.style.opacity = String((a.bgImageOpacity ?? 100) / 100);
      bg.style.filter = a.bgBlur ? `blur(${a.bgBlur}px)` : "";
      bg.style.display = "";
    } else {
      bg.style.backgroundImage = "";
      bg.style.display = "none";
    }
  }
}
