import { describe, it, expect } from "vitest";
import { periodOf, emojiForPeriod, isoWeek, daysUntil } from "../src/lib/datetime";

describe("periodOf", () => {
  it("buckets the hour", () => {
    expect(periodOf(5)).toBe("morning");
    expect(periodOf(11)).toBe("morning");
    expect(periodOf(12)).toBe("afternoon");
    expect(periodOf(17)).toBe("afternoon");
    expect(periodOf(18)).toBe("evening");
    expect(periodOf(21)).toBe("evening");
    expect(periodOf(22)).toBe("night");
    expect(periodOf(4)).toBe("night");
  });
});
describe("emojiForPeriod", () => {
  it("returns a non-empty string per period", () => {
    expect(emojiForPeriod("morning")).toBeTruthy();
    expect(emojiForPeriod("night")).toBeTruthy();
  });
});
describe("isoWeek", () => {
  it("week 1 for 2024-01-01 (Monday), week 2 a week later", () => {
    expect(isoWeek(new Date(2024, 0, 1))).toBe(1);
    expect(isoWeek(new Date(2024, 0, 8))).toBe(2);
  });
});
describe("daysUntil", () => {
  const noon = (y: number, m: number, d: number) => new Date(y, m, d, 12).getTime();
  it("0 same day, positive future, negative past", () => {
    expect(daysUntil(noon(2026, 5, 30), noon(2026, 5, 30))).toBe(0);
    expect(daysUntil(noon(2026, 6, 2), noon(2026, 5, 30))).toBe(2);
    expect(daysUntil(noon(2026, 5, 29), noon(2026, 5, 30))).toBe(-1);
  });
});
