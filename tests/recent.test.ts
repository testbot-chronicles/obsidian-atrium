import { describe, it, expect } from "vitest";
import { orderRecent, groupByFolder, buildTree, iconFor, type RecentItem } from "../src/lib/recent";

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

describe("iconFor", () => {
  it("maps known extensions", () => {
    expect(iconFor("md")).toBe("file-text");
    expect(iconFor("png")).toBe("image");
    expect(iconFor("mp3")).toBe("music");
    expect(iconFor("xyz")).toBe("file");
  });
});

describe("buildTree", () => {
  const mk = (over: Partial<RecentItem> = {}): RecentItem =>
    ({ path: "a.md", name: "a", folder: "", ext: "md", mtime: 0, ctime: 0, ...over });

  it("puts root-level files at the top level", () => {
    const tree = buildTree([mk({ path: "a.md", name: "a", folder: "" })]);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({ type: "file", name: "a", path: "a.md" });
  });
  it("creates a folder node with file children", () => {
    const tree = buildTree([
      mk({ path: "T/3.md", name: "3", folder: "T" }),
      mk({ path: "T/2.md", name: "2", folder: "T" }),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({ type: "folder", name: "T" });
    expect(tree[0].children?.map((c) => c.name)).toEqual(["3", "2"]);
  });
  it("nests folders by path segments", () => {
    const tree = buildTree([mk({ path: "A/B/c.md", name: "c", folder: "A/B" })]);
    expect(tree[0]).toMatchObject({ type: "folder", name: "A" });
    expect(tree[0].children?.[0]).toMatchObject({ type: "folder", name: "B" });
    expect(tree[0].children?.[0].children?.[0]).toMatchObject({ type: "file", name: "c" });
  });
  it("preserves first-seen folder order", () => {
    const tree = buildTree([
      mk({ path: "X/a.md", folder: "X" }),
      mk({ path: "Y/b.md", folder: "Y" }),
      mk({ path: "X/c.md", folder: "X" }),
    ]);
    expect(tree.map((n) => n.name)).toEqual(["X", "Y"]);
  });
});
