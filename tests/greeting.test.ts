import { describe, it, expect } from "vitest";
import { greeting } from "../src/lib/greeting";

describe("greeting", () => {
  it("morning 5–11", () => { expect(greeting(5)).toBe("Good morning"); expect(greeting(11)).toBe("Good morning"); });
  it("afternoon 12–17", () => { expect(greeting(12)).toBe("Good afternoon"); expect(greeting(17)).toBe("Good afternoon"); });
  it("evening 18–21", () => { expect(greeting(18)).toBe("Good evening"); expect(greeting(21)).toBe("Good evening"); });
  it("night otherwise", () => { expect(greeting(22)).toBe("Good night"); expect(greeting(4)).toBe("Good night"); expect(greeting(0)).toBe("Good night"); });
});
