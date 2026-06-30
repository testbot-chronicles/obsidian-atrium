import { describe, it, expect } from "vitest";
import { toGridNodes, fromGridNodes } from "../src/lib/layout";
import type { WidgetInstance } from "../src/types";

const w: WidgetInstance = { id: "a", type: "title", x: 1, y: 2, w: 3, h: 4, config: { size: "lg" } };

describe("layout", () => {
  it("converts instances to gridstack nodes", () => {
    expect(toGridNodes([w])[0]).toMatchObject({ id: "a", x: 1, y: 2, w: 3, h: 4 });
  });
  it("merges gridstack positions back, preserving type/config", () => {
    const moved = [{ id: "a", x: 5, y: 6, w: 3, h: 4 }];
    const out = fromGridNodes(moved, [w]);
    expect(out[0]).toMatchObject({ id: "a", type: "title", x: 5, y: 6, config: { size: "lg" } });
  });
  it("drops nodes with no matching instance", () => {
    expect(fromGridNodes([{ id: "ghost", x:0,y:0,w:1,h:1 }], [w])).toHaveLength(0);
  });
});
