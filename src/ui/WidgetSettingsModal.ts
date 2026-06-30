import { App, Modal, Setting } from "obsidian";
import type { WidgetDef } from "../registry";
import type { WidgetInstance } from "../types";

/**
 * Generic per-widget settings dialog. Builds form rows from the widget's
 * {@link WidgetDef.settingsSchema}, editing a draft of the instance config and
 * committing it on Save.
 */
export class WidgetSettingsModal extends Modal {
  private draft: Record<string, unknown>;

  constructor(
    app: App,
    private def: WidgetDef,
    private instance: WidgetInstance,
    private onSave: () => void,
  ) {
    super(app);
    this.draft = { ...instance.config };
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `${this.def.title} settings` });

    const schema = this.def.settingsSchema ?? [];
    if (schema.length === 0) {
      contentEl.createEl("p", { text: "This widget has no settings." });
    }

    for (const field of schema) {
      const setting = new Setting(contentEl).setName(field.label);
      const current = this.draft[field.key];
      switch (field.type) {
        case "text":
          setting.addText((t) =>
            t.setValue(current == null ? "" : String(current)).onChange((v) => (this.draft[field.key] = v)),
          );
          break;
        case "number":
          setting.addText((t) => {
            t.inputEl.type = "number";
            t.setValue(current == null ? "" : String(current)).onChange((v) => (this.draft[field.key] = v === "" ? null : Number(v)));
          });
          break;
        case "color":
          setting.addColorPicker((c) => {
            const val = typeof current === "string" ? current : "";
            // Color picker only understands hex/rgb; skip CSS-var or empty defaults.
            if (/^#|^rgb/i.test(val)) c.setValue(val);
            c.onChange((v) => (this.draft[field.key] = v));
          });
          break;
        case "toggle":
          setting.addToggle((tg) => tg.setValue(Boolean(current)).onChange((v) => (this.draft[field.key] = v)));
          break;
        case "select":
          setting.addDropdown((d) => {
            for (const opt of field.options ?? []) d.addOption(opt.value, opt.label);
            d.setValue(current == null ? "" : String(current)).onChange((v) => (this.draft[field.key] = v));
          });
          break;
      }
    }

    new Setting(contentEl).addButton((b) =>
      b
        .setButtonText("Save")
        .setCta()
        .onClick(() => {
          this.instance.config = { ...this.draft };
          this.onSave();
          this.close();
        }),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
