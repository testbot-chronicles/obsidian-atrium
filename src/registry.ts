import type { SvelteComponent } from "svelte";

/** Supported field types for a widget's settings schema (consumed in EU4b). */
export type FieldType = "text" | "number" | "color" | "toggle" | "select";

/** A single configurable field exposed in a widget's settings UI. */
export interface SettingsField {
  key: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
}

/** Definition describing how to render and configure a widget type. */
export interface WidgetDef {
  type: string;
  title: string;
  icon: string;
  defaultSize: { w: number; h: number };
  Component: typeof SvelteComponent;
  defaultConfig?: Record<string, unknown>;
  settingsSchema?: SettingsField[];
}

const registry = new Map<string, WidgetDef>();

/** Register (or replace) a widget definition by its `type` key. */
export function registerWidget(def: WidgetDef): void {
  registry.set(def.type, def);
}

/** Look up a registered widget definition by its `type` key. */
export function getWidget(type: string): WidgetDef | undefined {
  return registry.get(type);
}

/** List all registered widget definitions. */
export function allWidgets(): WidgetDef[] {
  return [...registry.values()];
}
