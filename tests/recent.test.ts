import { describe, it, expect } from "vitest";
import { orderRecent, groupByFolder, type RecentItem } from "../src/lib/recent";

const mk = (over: Partial<RecentItem> = {}): RecentItem =>
  ({ path: "a.md", name: "a", folder: "", ext: "md", mtime: 0, ctime: 0, ...over });

describe("orderRecent", () => {
  it("filters to markdown when type=markdown", () => {
    const items = [mk({ path: "a.md", ext: "md" }), mk({ path: "b.png", ext: "png" })];
    const out = orderRecent(items, [], { source: "modified", type: "markdown", count: 10 });
    expect(out.map((i) => i.path)).toEqual(["a.md"]);
  });
  it("keeps all when type=all", () => {
    const items = [mk({ path: "a.md", ext: "md" }), mk({ path: "b.png", ext: "png" })];
    expect(orderRecent(items, [], { source: "modified", type: "all", count: 10 })).toHaveLength(2);
  });
  it("sorts by mtime desc for modified", () => {
    const items = [mk({ path: "a.md", mtime: 1 }), mk({ path: "b.md", mtime: 5 }), mk({ path: "c.md", mtime: 3 })];
    expect(orderRecent(items, [], { source: "modified", type: "all", count: 10 }).map((i) => i.path)).toEqual(["b.md", "c.md", "a.md"]);
  });
  it("sorts by ctime desc for created", () => {
    const items = [mk({ path: "a.md", ctime: 2 }), mk({ path: "b.md", ctime: 9 })];
    expect(orderRecent(items, [], { source: "created", type: "all", count: 10 }).map((i) => i.path)).toEqual(["b.md", "a.md"]);
  });
  it("orders by opened order and drops items not in it", () => {
    const items = [mk({ path: "a.md" }), mk({ path: "b.md" }), mk({ path: "c.md" })];
    const out = orderRecent(items, ["c.md", "a.md"], { source: "opened", type: "all", count: 10 });
    expect(out.map((i) => i.path)).toEqual(["c.md", "a.md"]);
  });
  it("respects count", () => {
    const items = [mk({ path: "a.md", mtime: 3 }), mk({ path: "b.md", mtime: 2 }), mk({ path: "c.md", mtime: 1 })];
    expect(orderRecent(items, [], { source: "modified", type: "all", count: 2 })).toHaveLength(2);
  });
});

describe("groupByFolder", () => {
  it("groups items under their folder, preserving order", () => {
    const items = [mk({ path: "x/a.md", folder: "x" }), mk({ path: "y/b.md", folder: "y" }), mk({ path: "x/c.md", folder: "x" })];
    const groups = groupByFolder(items);
    expect(groups.map((g) => g.folder)).toEqual(["x", "y"]);
    expect(groups[0].items.map((i) => i.path)).toEqual(["x/a.md", "x/c.md"]);
  });
  it("uses '/' for root-level items", () => {
    expect(groupByFolder([mk({ path: "a.md", folder: "" })])[0].folder).toBe("/");
  });
});
