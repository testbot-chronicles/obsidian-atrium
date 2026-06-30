import { AtriumData, DEFAULT_DATA, CURRENT_VERSION } from "../types";

export function migrate(raw: unknown): AtriumData {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_DATA);
  const d = raw as Partial<AtriumData>;
  // Future: switch on d.version for breaking migrations.
  return {
    version: CURRENT_VERSION,
    settings: { ...DEFAULT_DATA.settings, ...(d.settings ?? {}) },
    layout: Array.isArray(d.layout) ? d.layout : [],
    todos: Array.isArray(d.todos) ? d.todos : [],
  };
}
