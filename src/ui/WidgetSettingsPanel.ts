import { Setting } from "obsidian";
import type { WidgetDef, SettingsField } from "../registry";
import type { WidgetInstance } from "../types";

/** Callbacks the panel invokes to drive live preview and persistence. */
export interface SettingsHooks {
  /** Live preview: called after each field change. */
  onChange: () => void;
  /** Persist: called once when the panel closes. */
  onCommit: () => void;
}

/**
 * Floating, non-modal, draggable settings panel for a widget instance.
 * Edits `instance.config` live (no backdrop, no blocking) and persists on close.
 * Only one panel is open at a time.
 */
export class WidgetSettingsPanel {
  private static current: WidgetSettingsPanel | null = null;

  private el!: HTMLElement;
  private rows: { field: SettingsField; el: HTMLElement }[] = [];
  private onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") this.close();
  };

  constructor(
    private def: WidgetDef,
    private instance: WidgetInstance,
    private hooks: SettingsHooks,
  ) {}

  /** Close whatever panel is currently open (if any). */
  static closeCurrent(): void {
    WidgetSettingsPanel.current?.close();
  }

  /** The live config object the panel mutates in place. */
  private cfg(): Record<string, unknown> {
    return this.instance.config;
  }

  /** Mount the panel into `document.body`, replacing any panel already open. */
  open(): void {
    WidgetSettingsPanel.current?.close();
    WidgetSettingsPanel.current = this;

    this.el = document.body.createDiv({ cls: "atrium-settings-panel" });

    const header = this.el.createDiv({ cls: "atrium-settings-header" });
    header.createSpan({ text: `${this.def.title} settings` });
    const closeBtn = header.createEl("button", {
      cls: "atrium-settings-close",
      text: "✕",
    });
    closeBtn.setAttr("aria-label", "Close");
    closeBtn.onclick = () => this.close();
    header.addEventListener("mousedown", (e) => this.startDrag(e));

    const body = this.el.createDiv({ cls: "atrium-settings-body" });
    this.buildRows(body);
    this.applyVisibility();

    document.addEventListener("keydown", this.onKey);
  }

  /** Build a settings row per schema field, wiring live edits into `instance.config`. */
  private buildRows(body: HTMLElement): void {
    const schema = this.def.settingsSchema ?? [];
    if (schema.length === 0) {
      body.createEl("p", { text: "This widget has no settings." });
    }

    for (const field of schema) {
      const setting = new Setting(body).setName(field.label);
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

  /** Drag the panel by its header, constrained to the viewport. */
  private startDrag(e: MouseEvent): void {
    if ((e.target as HTMLElement).closest("button")) return; // ignore drags starting on the close button
    e.preventDefault();
    const rect = this.el.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    const move = (ev: MouseEvent): void => {
      const x = Math.min(window.innerWidth - 60, Math.max(0, ev.clientX - offX));
      const y = Math.min(window.innerHeight - 40, Math.max(0, ev.clientY - offY));
      this.el.style.left = `${x}px`;
      this.el.style.top = `${y}px`;
      this.el.style.right = "auto";
    };
    const up = (): void => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  /** Tear down the panel, detach listeners, and persist once. */
  close(): void {
    document.removeEventListener("keydown", this.onKey);
    this.el?.remove();
    if (WidgetSettingsPanel.current === this) WidgetSettingsPanel.current = null;
    this.hooks.onCommit();
  }
}
