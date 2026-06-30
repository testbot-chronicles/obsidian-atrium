import { describe, it, expect } from "vitest";
import { migrate } from "../src/lib/migrate";
import { DEFAULT_DATA, CURRENT_VERSION } from "../src/types";

describe("migrate", () => {
  it("returns defaults for null/undefined", () => {
    expect(migrate(null)).toEqual(DEFAULT_DATA);
  });
  it("fills missing fields from defaults", () => {
    const out = migrate({ version: 1, layout: [] });
    expect(out.settings).toEqual(DEFAULT_DATA.settings);
    expect(out.todos).toEqual([]);
    expect(out.version).toBe(CURRENT_VERSION);
  });
  it("preserves existing layout/todos", () => {
    const data = { version: 1, settings: DEFAULT_DATA.settings, layout: [{ id: "w", type: "title", x:0,y:0,w:12,h:2, config:{} }], todos: [] };
    expect(migrate(data).layout).toHaveLength(1);
  });
});
