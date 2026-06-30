import type { WidgetAppearance } from "./appearance";

export interface BackgroundSettings {
  type: "none" | "color" | "gradient" | "image";
  value: string;
  blur: number;
  opacity: number;
}
export interface AtriumSettings {
  replaceNewTab: boolean;
  openOnStartup: boolean;
  background: BackgroundSettings;
}
export interface WidgetInstance {
  id: string;
  type: string;
  x: number; y: number; w: number; h: number;
  config: Record<string, unknown>;
  appearance?: WidgetAppearance;
  /** When true, the widget is frozen: it can't be moved/resized and won't be pushed by other widgets. */
  locked?: boolean;
}
export interface Todo { id: string; text: string; done: boolean; order: number; }
export interface AtriumData {
  version: number;
  settings: AtriumSettings;
  layout: WidgetInstance[];
  todos: Todo[];
}
export const CURRENT_VERSION = 1;
export const DEFAULT_DATA: AtriumData = {
  version: CURRENT_VERSION,
  settings: {
    replaceNewTab: true,
    openOnStartup: true,
    background: { type: "none", value: "", blur: 0, opacity: 1 },
  },
  layout: [],
  todos: [],
};
