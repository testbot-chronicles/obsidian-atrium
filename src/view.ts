import { ItemView, Menu, WorkspaceLeaf, setIcon } from "obsidian";
import { GridStack } from "gridstack";
import type AtriumPlugin from "./main";
import { fromGridNodes } from "./lib/layout";
import { getWidget, allWidgets } from "./registry";
import { mountWidget, type MountedWidget } from "./widgets/mount";
import { WidgetSettingsPanel } from "./ui/WidgetSettingsPanel";
import { applyAppearanceStyles } from "./appearance";
import { resolveTitle } from "./general";
import type { WidgetInstance } from "./types";

/** Unique view type identifier for the Atrium homepage view. */
export const VIEW_TYPE_ATRIUM = "atrium-home";

/** Number of grid columns. Kept in sync with the CSS overlay via a custom property. */
const GRID_COLUMNS = 12;
/** Row height in px. Kept in sync with the CSS overlay via a custom property. */
const GRID_CELL_HEIGHT = 70;

/**
 * The Atrium homepage view: hosts a gridstack grid that renders the saved
 * widget layout. The grid starts locked (static); an Edit/Done toolbar button
 * toggles drag/resize, and a "+ Widget" button opens a palette of widget types.
 * Layout changes are persisted back to the plugin data.
 */
export class AtriumView extends ItemView {
  /** The gridstack instance, created in {@link onOpen} and torn down in {@link onClose}. */
  grid?: GridStack;
  /** Handles to mounted Svelte widget instances, keyed by instance id. */
  private handles = new Map<string, MountedWidget>();
  /** Host elements (`.atrium-widget`) per instance id, for live appearance updates. */
  private hosts = new Map<string, HTMLElement>();
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
      { column: GRID_COLUMNS, cellHeight: GRID_CELL_HEIGHT, margin: 8, float: true, staticGrid: true },
      gridEl,
    );
    gridEl.style.setProperty("--atrium-cols", String(GRID_COLUMNS));
    gridEl.style.setProperty("--atrium-cell-h", `${GRID_CELL_HEIGHT}px`);
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
        locked: !!inst.locked,
        noMove: !!inst.locked,
        noResize: !!inst.locked,
      });
      const host = el.querySelector(".grid-stack-item-content") as HTMLElement;
      host.addClass("atrium-widget");
      host.toggleClass("is-locked", !!inst.locked);
      this.hosts.set(inst.id, host);
      applyAppearanceStyles(host, inst.appearance);
      const content = host.createDiv({ cls: "atrium-widget-content" });
      this.refreshHeader(host, inst);
      try {
        const handle = mountWidget(def.Component, content, {
          app: this.app,
          plugin: this.plugin,
          instance: inst,
        });
        this.handles.set(inst.id, handle);
      } catch (e) {
        content.setText("⚠️ widget error");
        console.error("Atrium widget render failed:", inst.type, e);
      }
      const actions = host.createDiv({ cls: "atrium-widget-actions" });

      const lockBtn = actions.createEl("button", { cls: "atrium-widget-action" });
      const refreshLock = (): void => {
        setIcon(lockBtn, inst.locked ? "lock" : "lock-open");
        lockBtn.setAttr("aria-label", inst.locked ? "Unlock widget" : "Lock widget position");
        lockBtn.toggleClass("is-active", !!inst.locked);
        host.toggleClass("is-locked", !!inst.locked);
      };
      refreshLock();
      lockBtn.onclick = (e) => {
        e.stopPropagation();
        inst.locked = !inst.locked;
        const itemEl = host.closest(".grid-stack-item") as HTMLElement | null;
        if (itemEl && this.grid) {
          this.grid.update(itemEl, { locked: !!inst.locked, noMove: !!inst.locked, noResize: !!inst.locked });
        }
        refreshLock();
        void this.plugin.saveAtrium();
      };

      const del = actions.createEl("button", { cls: "atrium-widget-action" });
      del.setAttr("aria-label", "Remove widget");
      setIcon(del, "trash-2");
      del.onclick = (e) => {
        e.stopPropagation();
        this.removeWidget(inst.id);
      };

      const gear = actions.createEl("button", { cls: "atrium-widget-action" });
      gear.setAttr("aria-label", "Widget settings");
      setIcon(gear, "settings");
      gear.onclick = (e) => {
        e.stopPropagation();
        this.openSettings(inst);
      };
    }
    this.suppressPersist = false;
  }

  /** Open the floating settings panel for a widget instance; live-preview on change, persist on close. */
  private openSettings(inst: WidgetInstance): void {
    const def = getWidget(inst.type);
    if (!def) return;
    new WidgetSettingsPanel(def, inst, {
      onChange: () => this.updateWidget(inst),
      onCommit: () => void this.plugin.saveAtrium(),
    }).open();
  }

  /** Push the (mutated) instance config, appearance, and header into the live widget. */
  private updateWidget(inst: WidgetInstance): void {
    const host = this.hosts.get(inst.id);
    if (host) {
      applyAppearanceStyles(host, inst.appearance);
      this.refreshHeader(host, inst);
    }
    const handle = this.handles.get(inst.id);
    // Pass a fresh object so Svelte's reactivity ($: cfg = instance.config) re-runs.
    handle?.update({ instance: { ...inst, config: { ...inst.config } } });
  }

  /** (Re)build the card header for a widget host from its general settings. */
  private refreshHeader(host: HTMLElement, inst: WidgetInstance): void {
    host.querySelectorAll(":scope > .atrium-widget-header").forEach((e) => e.remove());
    const def = getWidget(inst.type);
    if (!def) return;
    const t = resolveTitle(inst.general, def);
    if (!t.show) return;
    const content = host.querySelector(":scope > .atrium-widget-content") as HTMLElement | null;
    if (!content) return;
    const h = host.createDiv({ cls: "atrium-widget-header" }); // appended at end…
    h.setText(t.text);
    h.style.textAlign = t.align;
    if (t.position === "bottom") content.insertAdjacentElement("afterend", h);
    else host.insertBefore(h, content); // …relocated above content for "top"
  }

  /** Tear down all rendered widgets and re-render from the current layout. */
  private reload(): void {
    this.suppressPersist = true;
    this.handles.forEach((h) => h.destroy());
    this.handles.clear();
    this.hosts.clear();
    this.grid?.removeAll(true, false); // FIX: remove DOM, no change event
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

  /** Append a new widget of the given type below all existing widgets, persist, and reload. */
  private addWidgetOfType(type: string): void {
    const def = getWidget(type);
    if (!def) return;
    const bottom = this.plugin.data.layout.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    const inst: WidgetInstance = {
      id: crypto.randomUUID(),
      type,
      x: 0,
      y: bottom,
      w: def.defaultSize.w,
      h: def.defaultSize.h,
      config: { ...(def.defaultConfig ?? {}) },
    };
    this.plugin.data.layout.push(inst);
    void this.plugin.saveAtrium();
    this.reload();
  }

  /** Remove a widget instance from the layout, persist, and re-render. */
  private removeWidget(id: string): void {
    this.plugin.data.layout = this.plugin.data.layout.filter((w) => w.id !== id);
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
    // Close any lingering panel before grid teardown so it doesn't orphan in document.body.
    WidgetSettingsPanel.closeCurrent();
    this.handles.forEach((h) => h.destroy());
    this.handles.clear();
    this.hosts.clear();
    this.grid?.destroy(false);
    this.grid = undefined;
  }
}
