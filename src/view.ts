import { ItemView, WorkspaceLeaf } from "obsidian";
import { GridStack } from "gridstack";
import type AtriumPlugin from "./main";
import { fromGridNodes } from "./lib/layout";

/** Unique view type identifier for the Atrium homepage view. */
export const VIEW_TYPE_ATRIUM = "atrium-home";

/**
 * The Atrium homepage view: hosts a gridstack grid that will render widgets in
 * a later phase. Layout changes are persisted back to the plugin data.
 */
export class AtriumView extends ItemView {
  /** The gridstack instance, created in {@link onOpen} and torn down in {@link onClose}. */
  grid?: GridStack;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: AtriumPlugin,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_ATRIUM;
  }

  getDisplayText(): string {
    return "Atrium";
  }

  getIcon(): string {
    return "layout-dashboard";
  }

  async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("atrium-root");

    const gridEl = root.createDiv({ cls: "grid-stack" });
    this.grid = GridStack.init(
      { column: 12, cellHeight: 70, margin: 8, float: true, staticGrid: true },
      gridEl,
    );
    this.grid.on("change", () => this.persist());
    // widgets rendered in a later phase
  }

  /** Sync the grid's current layout back into plugin data and persist it. */
  private persist(): void {
    if (!this.grid) return;
    const nodes = this.grid.save(false) as any[];
    this.plugin.data.layout = fromGridNodes(
      nodes.map((n) => ({ id: String(n.id), x: n.x, y: n.y, w: n.w, h: n.h })),
      this.plugin.data.layout,
    );
    void this.plugin.saveAtrium();
  }

  async onClose(): Promise<void> {
    this.grid?.destroy(false);
    this.grid = undefined;
  }
}
