import { describe, it, expect } from "vitest";
import { countWords, countSince, sumLinkMap, startOfDay } from "../src/lib/stats";

describe("countWords", () => {
  it("counts whitespace-separated tokens", () => {
    expect(countWords("hello  world\nfoo")).toBe(3);
  });
  it("is 0 for empty/blank", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n  ")).toBe(0);
  });
});
describe("countSince", () => {
  it("counts timestamps >= since", () => {
    expect(countSince([10, 20, 30], 20)).toBe(2);
  });
});
describe("sumLinkMap", () => {
  it("sums all nested counts", () => {
    expect(sumLinkMap({ "a.md": { "b.md": 2, "c.md": 1 }, "b.md": { "a.md": 3 } })).toBe(6);
  });
  it("is 0 for empty", () => {
    expect(sumLinkMap({})).toBe(0);
  });
});
describe("startOfDay", () => {
  it("returns a timestamp <= now on the same day with zeroed time", () => {
    const now = startOfDay(Date.UTC(2026, 5, 30, 13, 45)); // any
    expect(typeof now).toBe("number");
    expect(new Date(now).getHours()).toBe(0);
  });
});
