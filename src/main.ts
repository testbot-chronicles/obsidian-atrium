import { Plugin } from "obsidian";
import { AtriumData } from "./types";
import { migrate } from "./lib/migrate";

/**
 * Atrium — a modular, drag-and-drop homepage for your vault.
 *
 * Owns the persisted {@link AtriumData}, loaded and migrated on startup.
 * View registration, ribbon, and command are wired in a later task.
 */
export default class AtriumPlugin extends Plugin {
  /** Loaded and migrated plugin data. Assigned synchronously in {@link onload}. */
  data!: AtriumData;

  async onload(): Promise<void> {
    this.data = migrate(await this.loadData());
    await this.saveAtrium();
    // view registration + ribbon + command added in Task 10
  }

  /** Persist the current {@link AtriumData} to disk. */
  async saveAtrium(): Promise<void> {
    await this.saveData(this.data);
  }
}
