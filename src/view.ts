import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import { GridStack } from "gridstack";
import type AtriumPlugin from "./main";
import { fromGridNodes } from "./lib/layout";
import { getWidget, allWidgets } from "./registry";
import { mountWidget, MountedWidget } from "./widgets/mount";
import { WidgetSettingsModal } from "./ui/WidgetSettingsModal";
import type { WidgetInstance } from "./types";

/** Unique view type identifier for the Atrium homepage view. */
export const VIEW_TYPE_ATRIUM = "atrium-home";

/**
 * The Atrium homepage view: hosts a gridstack grid that renders the saved
 * widget layout. The grid starts locked (static); an Edit/Done toolbar button
 * toggles drag/resize, and a "+ Widget" button opens a palette of widget types.
 * Layout changes are persisted back to the plugin data.
 */
export class AtriumView extends ItemView {
  /** The gridstack instance, created in {@link onOpen} and torn down in {@link onClose}. */
  grid?: GridStack;
  /** Handles to mounted Svelte widget instances, destroyed on reload/close. */
  private mounted: MountedWidget[] = [];
  /**
   * When set, {@link persist} is a no-op. Guards against gridstack's `change`
   * event firing during programmatic grid mutations (add/removeAll), which would
   * otherwise capture a transient/empty grid state and wipe the saved layout.
   */
  private suppressPersist = false;

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

    const bar = root.createDiv({ cls: "atrium-toolbar" });
    const editBtn = bar.createEl("button", { text: "Edit layout" });
    let editing = false;
    editBtn.onclick = () => {
      editing = !editing;
      this.grid?.setStatic(!editing);
      editBtn.setText(editing ? "Done" : "Edit layout");
      root.toggleClass("is-editing", editing);
    };

    const addBtn = bar.createEl("button", { text: "+ Widget" });
    addBtn.onclick = (evt) => this.openAddMenu(evt);

    const gridEl = root.createDiv({ cls: "grid-stack" });
    this.grid = GridStack.init(
      { column: 12, cellHeight: 70, margin: 8, float: true, staticGrid: true },
      gridEl,
    );
    this.grid.on("change", () => this.persist());

    this.renderWidgets();
  }

  /** Render every widget in the saved layout into the grid and mount its component. */
  private renderWidgets(): void {
    this.suppressPersist = true;
    for (const inst of this.plugin.data.layout) {
      const def = getWidget(inst.type);
      if (!def) continue;
      const el = this.grid!.addWidget({
        id: inst.id,
        x: inst.x,
        y: inst.y,
        w: inst.w,
        h: inst.h,
        content: "",
      });
      const host = el.querySelector(".grid-stack-item-content") as HTMLElement;
      host.addClass("atrium-widget");
      try {
        this.mounted.push(
          mountWidget(def.Component, host, {
            app: this.app,
            plugin: this.plugin,
            instance: inst,
          }),
        );
      } catch (e) {
        host.setText("⚠️ widget error");
        console.error("Atrium widget render failed:", inst.type, e);
      }
      const gear = host.createEl("button", { cls: "atrium-widget-gear", text: "⚙" });
      gear.setAttr("aria-label", "Widget settings");
      gear.onclick = (e) => {
        e.stopPropagation();
        this.openSettings(inst);
      };
    }
    this.suppressPersist = false;
  }

  /** Open the settings modal for a widget instance; persist + reload on save. */
  private openSettings(inst: WidgetInstance): void {
    const def = getWidget(inst.type);
    if (!def) return;
    new WidgetSettingsModal(this.app, def, inst, () => {
      void this.plugin.saveAtrium();
      this.reload();
    }).open();
  }

  /** Tear down all rendered widgets and re-render from the current layout. */
  private reload(): void {
    this.suppressPersist = true;
    this.mounted.forEach((m) => m.destroy());
    this.mounted = [];
    this.grid?.removeAll(false);
    this.suppressPersist = false;
    this.renderWidgets();
  }

  /** Open a context menu listing all registered widget types to add. */
  private openAddMenu(evt: MouseEvent): void {
    const menu = new Menu();
    for (const def of allWidgets()) {
      menu.addItem((item) =>
        item
          .setTitle(def.title)
          .setIcon(def.icon)
          .onClick(() => this.addWidgetOfType(def.type)),
      );
    }
    menu.showAtMouseEvent(evt);
  }

  /** Append a new widget of the given type at the top-left, persist, and reload. */
  private addWidgetOfType(type: string): void {
    const def = getWidget(type);
    if (!def) return;
    const inst: WidgetInstance = {
      id: crypto.randomUUID(),
      type,
      x: 0,
      y: 0,
      w: def.defaultSize.w,
      h: def.defaultSize.h,
      config: { ...(def.defaultConfig ?? {}) },
    };
    this.plugin.data.layout.push(inst);
    void this.plugin.saveAtrium();
    this.reload();
  }

  /** Sync the grid's current layout back into plugin data and persist it. */
  private persist(): void {
    if (!this.grid || this.suppressPersist) return;
    const nodes = this.grid.save(false) as any[];
    this.plugin.data.layout = fromGridNodes(
      nodes.map((n) => ({ id: String(n.id), x: n.x, y: n.y, w: n.w, h: n.h })),
      this.plugin.data.layout,
    );
    void this.plugin.saveAtrium();
  }

  async onClose(): Promise<void> {
    this.mounted.forEach((m) => m.destroy());
    this.mounted = [];
    this.grid?.destroy(false);
    this.grid = undefined;
  }
}
