import { Setting } from "obsidian";
import type { WidgetDef, SettingsField } from "../registry";
import type { WidgetInstance } from "../types";
import { APPEARANCE_SCHEMA, DEFAULT_APPEARANCE } from "../appearance";
import { GENERAL_SCHEMA, defaultGeneral } from "../general";

/** Callbacks the panel invokes to drive live preview and persistence. */
export interface SettingsHooks {
  /** Live preview: called after each field change. */
  onChange: () => void;
  /** Persist: called once when the panel closes. */
  onCommit: () => void;
}

/** A single titled group of settings rows bound to one target object. */
interface Section {
  title: string;
  schema: SettingsField[];
  /** The live object whose keys the section's rows mutate in place. */
  target: () => Record<string, unknown>;
}

/**
 * Floating, non-modal, draggable settings panel. Renders the widget's own
 * settings plus a shared Appearance section, applying changes live and
 * persisting on close. Only one panel open at a time.
 */
export class WidgetSettingsPanel {
  private static current: WidgetSettingsPanel | null = null;

  private el!: HTMLElement;
  private rows: {
    field: SettingsField;
    el: HTMLElement;
    target: () => Record<string, unknown>;
  }[] = [];
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

  /**
   * The sections to render: the shared General section (writing `instance.general`,
   * lazily initialized from {@link defaultGeneral}), the widget's own settings
   * (writing `instance.config`), and the shared Appearance section (writing
   * `instance.appearance`, lazily initialized from {@link DEFAULT_APPEARANCE}).
   */
  private sections(): Section[] {
    return [
      {
        title: "General",
        schema: GENERAL_SCHEMA.map((f) =>
          f.key === "title" ? { ...f, placeholder: this.def.defaultTitle ?? this.def.title } : f,
        ),
        target: () => {
          if (!this.instance.general) this.instance.general = defaultGeneral(this.def.defaultTitle);
          return this.instance.general as unknown as Record<string, unknown>;
        },
      },
      {
        title: `${this.def.title} settings`,
        schema: this.def.settingsSchema ?? [],
        target: () => this.instance.config,
      },
      {
        title: "Appearance",
        schema: APPEARANCE_SCHEMA,
        target: () => {
          if (!this.instance.appearance) this.instance.appearance = { ...DEFAULT_APPEARANCE };
          return this.instance.appearance as unknown as Record<string, unknown>;
        },
      },
    ];
  }

  /** Mount the panel into `document.body`, replacing any panel already open. */
  open(): void {
    WidgetSettingsPanel.current?.close();
    WidgetSettingsPanel.current = this;

    this.el = document.body.createDiv({ cls: "atrium-settings-panel" });

    const header = this.el.createDiv({ cls: "atrium-settings-header" });
    header.createSpan({ text: this.def.title });
    const closeBtn = header.createEl("button", {
      cls: "atrium-settings-close",
      text: "✕",
    });
    closeBtn.setAttr("aria-label", "Close");
    closeBtn.onclick = () => this.close();
    header.addEventListener("mousedown", (e) => this.startDrag(e));

    const body = this.el.createDiv({ cls: "atrium-settings-body" });
    for (const section of this.sections()) this.buildSection(body, section);
    this.applyVisibility();

    document.addEventListener("keydown", this.onKey);
  }

  /** Build a heading and a row per schema field for one section, wiring live edits into its target. */
  private buildSection(body: HTMLElement, section: Section): void {
    if (section.schema.length === 0) return;
    body.createEl("h4", { cls: "atrium-settings-section", text: section.title });
    const get = section.target;

    for (const field of section.schema) {
      const setting = new Setting(body).setName(field.label);
      const current = get()[field.key];
      switch (field.type) {
        case "text":
          setting.addText((t) =>
            t
              .setPlaceholder(field.placeholder ?? "")
              .setValue(current == null ? "" : String(current))
              .onChange((v) => {
                get()[field.key] = v;
                this.changed();
              }),
          );
          break;
        case "number":
          setting.addText((t) => {
            t.inputEl.type = "number";
            t.setValue(current == null ? "" : String(current)).onChange((v) => {
              get()[field.key] = v === "" ? null : Number(v);
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
                get()[field.key] = v;
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
              get()[field.key] = v;
              this.changed();
            });
          });
          break;
        case "toggle":
          setting.addToggle((tg) =>
            tg.setValue(Boolean(current)).onChange((v) => {
              get()[field.key] = v;
              this.changed();
            }),
          );
          break;
        case "select":
          setting.addDropdown((d) => {
            for (const opt of field.options ?? []) d.addOption(opt.value, opt.label);
            d.setValue(current == null ? "" : String(current)).onChange((v) => {
              get()[field.key] = v;
              this.changed();
            });
          });
          break;
        case "buttons": {
          const wrap = setting.controlEl.createDiv({ cls: "atrium-segmented" });
          const sync = (): void => {
            wrap.querySelectorAll("button").forEach((b) => {
              const btn = b as HTMLButtonElement;
              btn.classList.toggle("is-active", btn.dataset.value === String(get()[field.key]));
            });
          };
          for (const opt of field.options ?? []) {
            const btn = wrap.createEl("button", { text: opt.label });
            btn.dataset.value = opt.value;
            btn.onclick = () => {
              get()[field.key] = opt.value;
              sync();
              this.changed();
            };
          }
          sync();
          break;
        }
        case "orderlist": {
          setting.settingEl.addClass("atrium-orderlist-setting");
          const wrap = setting.controlEl.createDiv({ cls: "atrium-orderlist" });
          const all = field.options ?? [];
          const labelOf = (v: string): string => all.find((o) => o.value === v)?.label ?? v;
          const renderList = (): void => {
            wrap.empty();
            const currentList: string[] = Array.isArray(get()[field.key])
              ? [...(get()[field.key] as string[])]
              : [];
            const commit = (next: string[]): void => {
              get()[field.key] = next;
              this.changed();
              renderList();
            };
            currentList.forEach((val, i) => {
              const row = wrap.createDiv({ cls: "atrium-orderlist-row" });
              row.createSpan({ cls: "atrium-orderlist-label", text: labelOf(val) });
              const up = row.createEl("button", { text: "↑", attr: { "aria-label": "Move up" } });
              up.disabled = i === 0;
              up.onclick = () => {
                const n = [...currentList];
                [n[i - 1], n[i]] = [n[i], n[i - 1]];
                commit(n);
              };
              const down = row.createEl("button", { text: "↓", attr: { "aria-label": "Move down" } });
              down.disabled = i === currentList.length - 1;
              down.onclick = () => {
                const n = [...currentList];
                [n[i + 1], n[i]] = [n[i], n[i + 1]];
                commit(n);
              };
              const rm = row.createEl("button", { text: "✕", attr: { "aria-label": "Remove" } });
              rm.onclick = () => {
                const n = [...currentList];
                n.splice(i, 1);
                commit(n);
              };
            });
            const unselected = all.filter((o) => !currentList.includes(o.value));
            if (unselected.length) {
              const addRow = wrap.createDiv({ cls: "atrium-orderlist-add" });
              const sel = addRow.createEl("select", { cls: "dropdown" });
              sel.createEl("option", { text: "+ Add…", value: "" });
              for (const o of unselected) sel.createEl("option", { text: o.label, value: o.value });
              sel.onchange = () => {
                if (sel.value) commit([...currentList, sel.value]);
              };
            }
          };
          renderList();
          break;
        }
      }
      this.rows.push({ field, el: setting.settingEl, target: get });
    }
  }

  /** Show/hide rows whose `showIf` condition is (un)met, evaluated against the row's own section target. */
  private applyVisibility(): void {
    for (const { field, el, target } of this.rows) {
      const visible = !field.showIf || target()[field.showIf.key] === field.showIf.equals;
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
