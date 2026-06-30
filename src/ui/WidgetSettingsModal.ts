import { App, Modal, Setting } from "obsidian";
import type { WidgetDef, SettingsField } from "../registry";
import type { WidgetInstance } from "../types";

/** Callbacks the modal invokes to drive live preview and persistence. */
export interface SettingsHooks {
  /** Live preview: called after each field change. */
  onChange: () => void;
  /** Persist: called once when the modal closes. */
  onCommit: () => void;
}

/**
 * Generic per-widget settings dialog. Builds rows from the widget's
 * {@link WidgetDef.settingsSchema}, applies changes live to `instance.config`,
 * and persists on close. Supports `slider` and `buttons` field types plus
 * `showIf` conditional visibility.
 */
export class WidgetSettingsModal extends Modal {
  private rows: { field: SettingsField; el: HTMLElement }[] = [];

  constructor(
    app: App,
    private def: WidgetDef,
    private instance: WidgetInstance,
    private hooks: SettingsHooks,
  ) {
    super(app);
  }

  /** The live config object the modal mutates in place. */
  private cfg(): Record<string, unknown> {
    return this.instance.config;
  }

  /** Show/hide rows whose `showIf` condition is (un)met. */
  private applyVisibility(): void {
    for (const { field, el } of this.rows) {
      const visible =
        !field.showIf || this.cfg()[field.showIf.key] === field.showIf.equals;
      el.style.display = visible ? "" : "none";
    }
  }

  /** Re-evaluate conditional rows and fire the live-preview hook. */
  private changed(): void {
    this.applyVisibility();
    this.hooks.onChange();
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
      const current = this.cfg()[field.key];
      switch (field.type) {
        case "text":
          setting.addText((t) =>
            t.setValue(current == null ? "" : String(current)).onChange((v) => {
              this.cfg()[field.key] = v;
              this.changed();
            }),
          );
          break;
        case "number":
          setting.addText((t) => {
            t.inputEl.type = "number";
            t.setValue(current == null ? "" : String(current)).onChange((v) => {
              this.cfg()[field.key] = v === "" ? null : Number(v);
              this.changed();
            });
          });
          break;
        case "slider":
          setting.addSlider((s) =>
            s
              .setLimits(field.min ?? 0, field.max ?? 100, field.step ?? 1)
              .setValue(typeof current === "number" ? current : field.min ?? 0)
              .setDynamicTooltip()
              .onChange((v) => {
                this.cfg()[field.key] = v;
                this.changed();
              }),
          );
          break;
        case "color":
          setting.addColorPicker((c) => {
            const val = typeof current === "string" ? current : "";
            // Color picker only understands hex/rgb; skip CSS-var or empty defaults.
            if (/^#|^rgb/i.test(val)) c.setValue(val);
            c.onChange((v) => {
              this.cfg()[field.key] = v;
              this.changed();
            });
          });
          break;
        case "toggle":
          setting.addToggle((tg) =>
            tg.setValue(Boolean(current)).onChange((v) => {
              this.cfg()[field.key] = v;
              this.changed();
            }),
          );
          break;
        case "select":
          setting.addDropdown((d) => {
            for (const opt of field.options ?? []) d.addOption(opt.value, opt.label);
            d.setValue(current == null ? "" : String(current)).onChange((v) => {
              this.cfg()[field.key] = v;
              this.changed();
            });
          });
          break;
        case "buttons": {
          const wrap = setting.controlEl.createDiv({ cls: "atrium-segmented" });
          const sync = (): void => {
            wrap.querySelectorAll("button").forEach((b) => {
              const btn = b as HTMLButtonElement;
              btn.classList.toggle(
                "is-active",
                btn.dataset.value === String(this.cfg()[field.key]),
              );
            });
          };
          for (const opt of field.options ?? []) {
            const btn = wrap.createEl("button", { text: opt.label });
            btn.dataset.value = opt.value;
            btn.onclick = () => {
              this.cfg()[field.key] = opt.value;
              sync();
              this.changed();
            };
          }
          sync();
          break;
        }
      }
      this.rows.push({ field, el: setting.settingEl });
    }

    this.applyVisibility();
  }

  onClose(): void {
    this.hooks.onCommit();
    this.contentEl.empty();
  }
}
