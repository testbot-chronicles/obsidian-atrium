import type { WidgetInstance } from "../types";

export interface GridNode { id: string; x: number; y: number; w: number; h: number; }

export function toGridNodes(layout: WidgetInstance[]): GridNode[] {
  return layout.map(({ id, x, y, w, h }) => ({ id, x, y, w, h }));
}
export function fromGridNodes(nodes: GridNode[], prev: WidgetInstance[]): WidgetInstance[] {
  const byId = new Map(prev.map((i) => [i.id, i]));
  return nodes
    .map((n) => {
      const inst = byId.get(n.id);
      return inst ? { ...inst, x: n.x, y: n.y, w: n.w, h: n.h } : null;
    })
    .filter((i): i is WidgetInstance => !!i);
}
