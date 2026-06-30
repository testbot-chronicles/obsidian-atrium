import { Plugin } from "obsidian";
import { AtriumData } from "./types";
import { migrate } from "./lib/migrate";
import { AtriumView, VIEW_TYPE_ATRIUM } from "./view";

/**
 * Atrium — a modular, drag-and-drop homepage for your vault.
 *
 * Owns the persisted {@link AtriumData} (loaded and migrated on startup) and
 * registers the {@link AtriumView} that renders the gridstack-based homepage.
 */
export default class AtriumPlugin extends Plugin {
  /** Loaded and migrated plugin data. Assigned synchronously in {@link onload}. */
  data!: AtriumData;

  async onload(): Promise<void> {
    this.data = migrate(await this.loadData());
    await this.saveAtrium();

    this.registerView(VIEW_TYPE_ATRIUM, (leaf) => new AtriumView(leaf, this));
    this.addRibbonIcon("layout-dashboard", "Open Atrium", () => this.activateView());
    this.addCommand({
      id: "open-atrium",
      name: "Open Atrium",
      callback: () => this.activateView(),
    });
  }

  /** Persist the current {@link AtriumData} to disk. */
  async saveAtrium(): Promise<void> {
    await this.saveData(this.data);
  }

  /** Open the Atrium view in a new leaf and reveal it. */
  async activateView(): Promise<void> {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: VIEW_TYPE_ATRIUM, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
}
