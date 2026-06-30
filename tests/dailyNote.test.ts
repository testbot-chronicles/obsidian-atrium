import { describe, it, expect } from "vitest";
import { dailyNotePath } from "../src/lib/dailyNote";

describe("dailyNotePath", () => {
  const d = new Date(2026, 5, 30); // 2026-06-30
  it("formats default YYYY-MM-DD under a folder", () => {
    expect(dailyNotePath(d, "YYYY-MM-DD", "Daily")).toBe("Daily/2026-06-30.md");
  });
  it("handles empty folder", () => {
    expect(dailyNotePath(d, "YYYY-MM-DD", "")).toBe("2026-06-30.md");
  });
  it("supports custom format", () => {
    expect(dailyNotePath(d, "YYYY/MM/DD", "")).toBe("2026/06/30.md");
  });
});
