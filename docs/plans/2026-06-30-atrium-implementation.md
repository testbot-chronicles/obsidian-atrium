# Atrium Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a modular, drag-and-drop homepage plugin for Obsidian that replaces Home Tab — a snap-grid of configurable widgets.

**Architecture:** A custom `ItemView` renders a gridstack.js 12-column grid. Each grid cell hosts a Svelte component looked up from a widget registry. Layout + widget config + self-contained todos persist in `data.json`. Pure logic (todo CRUD, layout (de)serialization, daily-note path, config migration) lives in framework-free modules under `src/lib/` and is unit-tested with vitest. UI is verified live via the hot-reload plugin.

**Tech Stack:** TypeScript · Svelte · gridstack.js · esbuild (esbuild-svelte) · vitest · Obsidian API.

**Dev loop:** `npm run dev` (esbuild watch) → hot-reload reloads the plugin on every `main.js` write. Repo root = `.obsidian/plugins/atrium/`. The repo already exists with the design doc committed.

**Conventions:** Conventional commits. Commit after every green step. Logic = TDD (RED→GREEN→REFACTOR). UI = build + manual verify in Obsidian, then commit.

---

## Phase 0 — Toolchain & scaffold

### Task 1: package.json + dependencies

**Files:**
- Create: `package.json`

**Step 1:** Write `package.json`:

```json
{
  "name": "atrium",
  "version": "0.0.1",
  "description": "A modular, drag-and-drop homepage for your vault.",
  "type": "module",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "test": "vitest run",
    "test:watch": "vitest",
    "version": "node version-bump.mjs && git add manifest.json versions.json"
  },
  "keywords": ["obsidian", "homepage", "dashboard"],
  "author": "Titus",
  "license": "MIT",
  "devDependencies": {
    "@tsconfig/svelte": "^5.0.4",
    "@types/node": "^22.0.0",
    "builtin-modules": "^4.0.0",
    "esbuild": "^0.24.0",
    "esbuild-svelte": "^0.8.2",
    "obsidian": "latest",
    "svelte": "^4.2.19",
    "svelte-preprocess": "^6.0.3",
    "tslib": "^2.7.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  },
  "dependencies": {
    "gridstack": "^11.1.2"
  }
}
```

**Step 2:** Install. Run: `npm install`
Expected: `node_modules/` created, no fatal errors. (Versions may resolve slightly higher — fine.)

**Step 3:** Commit.
```bash
git add package.json package-lock.json
git commit -m "chore: package.json and dependencies"
```

---

### Task 2: TypeScript + esbuild + svelte config

**Files:**
- Create: `tsconfig.json`, `esbuild.config.mjs`, `svelte.config.mjs`, `vitest.config.ts`

**Step 1:** `tsconfig.json`:
```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "bundler",
    "allowJs": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "lib": ["DOM", "ES2022"],
    "types": ["node", "svelte"],
    "isolatedModules": true,
    "verbatimModuleSyntax": false
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"],
  "exclude": ["tests/**"]
}
```

**Step 2:** `svelte.config.mjs`:
```js
import sveltePreprocess from "svelte-preprocess";
export default { preprocess: sveltePreprocess() };
```

**Step 3:** `esbuild.config.mjs` (adapted from the official sample plugin + esbuild-svelte):
```js
import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import esbuildSvelte from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

const prod = process.argv[2] === "production";

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*", ...builtins],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: prod,
  plugins: [
    esbuildSvelte({
      compilerOptions: { css: "injected" },
      preprocess: sveltePreprocess(),
    }),
  ],
});

if (prod) {
  await ctx.rebuild();
  process.exit(0);
} else {
  await ctx.watch();
}
```

**Step 4:** `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

**Step 5:** Commit.
```bash
git add tsconfig.json esbuild.config.mjs svelte.config.mjs vitest.config.ts
git commit -m "chore: typescript, esbuild-svelte and vitest config"
```

---

### Task 3: manifest, versions, hot-reload marker, minimal plugin that loads

**Files:**
- Create: `manifest.json`, `versions.json`, `.hotreload`, `version-bump.mjs`, `src/main.ts`

**Step 1:** `manifest.json`:
```json
{
  "id": "atrium",
  "name": "Atrium",
  "version": "0.0.1",
  "minAppVersion": "1.5.0",
  "description": "A modular, drag-and-drop homepage for your vault.",
  "author": "Titus",
  "isDesktopOnly": false
}
```

**Step 2:** `versions.json`: `{ "0.0.1": "1.5.0" }`

**Step 3:** `version-bump.mjs` (official):
```js
import { readFileSync, writeFileSync } from "fs";
const targetVersion = process.env.npm_package_version;
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
```

**Step 4:** Create empty `.hotreload` (forces hot-reload to watch this plugin).

**Step 5:** Minimal `src/main.ts`:
```ts
import { Plugin, Notice } from "obsidian";

export default class AtriumPlugin extends Plugin {
  async onload() {
    new Notice("Atrium loaded");
    console.log("Atrium loaded");
  }
  async onunload() {
    console.log("Atrium unloaded");
  }
}
```

**Step 6: Verify live.** Run: `npm run dev` (leave running in background).
Then in Obsidian: Settings → Community plugins → enable **Atrium**.
Expected: "Atrium loaded" notice appears; console logs it. Editing `src/main.ts` and saving → hot-reload re-fires the notice.

**Step 7:** Commit.
```bash
git add manifest.json versions.json version-bump.mjs .hotreload src/main.ts
git commit -m "feat: minimal Atrium plugin that loads in the vault"
```

---

## Phase 1 — Logic core (TDD, no Obsidian/Svelte)

### Task 4: Types + default data

**Files:**
- Create: `src/types.ts`

**Step 1:** Define the data shapes (single source of truth):
```ts
export interface BackgroundSettings {
  type: "none" | "color" | "gradient" | "image";
  value: string;
  blur: number;
  opacity: number;
}
export interface AtriumSettings {
  replaceNewTab: boolean;
  openOnStartup: boolean;
  background: BackgroundSettings;
}
export interface WidgetInstance {
  id: string;
  type: string;
  x: number; y: number; w: number; h: number;
  config: Record<string, unknown>;
}
export interface Todo { id: string; text: string; done: boolean; order: number; }
export interface AtriumData {
  version: number;
  settings: AtriumSettings;
  layout: WidgetInstance[];
  todos: Todo[];
}
export const CURRENT_VERSION = 1;
export const DEFAULT_DATA: AtriumData = {
  version: CURRENT_VERSION,
  settings: {
    replaceNewTab: true,
    openOnStartup: true,
    background: { type: "none", value: "", blur: 0, opacity: 1 },
  },
  layout: [],
  todos: [],
};
```

**Step 2:** Commit. `git add src/types.ts && git commit -m "feat: Atrium data types and defaults"`

---

### Task 5: Todo CRUD (TDD)

**Files:**
- Create: `tests/todos.test.ts`
- Create: `src/lib/todos.ts`

**Step 1: Write failing tests:**
```ts
import { describe, it, expect } from "vitest";
import { addTodo, toggleTodo, removeTodo, reorderTodos } from "../src/lib/todos";
import type { Todo } from "../src/types";

const mk = (over: Partial<Todo> = {}): Todo => ({ id: "x", text: "t", done: false, order: 0, ...over });

describe("todos", () => {
  it("adds a todo at the end with incremented order", () => {
    const list = [mk({ id: "a", order: 0 })];
    const next = addTodo(list, "buy milk", () => "b");
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({ id: "b", text: "buy milk", done: false, order: 1 });
  });
  it("ignores empty text", () => {
    expect(addTodo([], "   ", () => "b")).toHaveLength(0);
  });
  it("toggles done immutably", () => {
    const list = [mk({ id: "a" })];
    const next = toggleTodo(list, "a");
    expect(next[0].done).toBe(true);
    expect(list[0].done).toBe(false);
  });
  it("removes by id", () => {
    expect(removeTodo([mk({ id: "a" }), mk({ id: "b" })], "a")).toHaveLength(1);
  });
  it("reorders and renormalizes order indices", () => {
    const list = [mk({ id: "a", order: 0 }), mk({ id: "b", order: 1 }), mk({ id: "c", order: 2 })];
    const next = reorderTodos(list, ["c", "a", "b"]);
    expect(next.map((t) => t.id)).toEqual(["c", "a", "b"]);
    expect(next.map((t) => t.order)).toEqual([0, 1, 2]);
  });
});
```

**Step 2: Run, verify FAIL.** Run: `npm test -- todos`
Expected: FAIL (module not found / functions undefined).

**Step 3: Implement `src/lib/todos.ts`:**
```ts
import type { Todo } from "../types";

export function addTodo(list: Todo[], text: string, genId: () => string): Todo[] {
  const trimmed = text.trim();
  if (!trimmed) return list;
  const order = list.length ? Math.max(...list.map((t) => t.order)) + 1 : 0;
  return [...list, { id: genId(), text: trimmed, done: false, order }];
}
export function toggleTodo(list: Todo[], id: string): Todo[] {
  return list.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}
export function removeTodo(list: Todo[], id: string): Todo[] {
  return list.filter((t) => t.id !== id);
}
export function reorderTodos(list: Todo[], orderedIds: string[]): Todo[] {
  const byId = new Map(list.map((t) => [t.id, t]));
  return orderedIds
    .map((id) => byId.get(id))
    .filter((t): t is Todo => !!t)
    .map((t, i) => ({ ...t, order: i }));
}
```

**Step 4: Run, verify PASS.** Run: `npm test -- todos` → Expected: PASS.

**Step 5:** Commit. `git add tests/todos.test.ts src/lib/todos.ts && git commit -m "feat: self-contained todo CRUD with tests"`

---

### Task 6: Config migration (TDD)

**Files:**
- Create: `tests/migrate.test.ts`, `src/lib/migrate.ts`

**Step 1: Failing tests:**
```ts
import { describe, it, expect } from "vitest";
import { migrate } from "../src/lib/migrate";
import { DEFAULT_DATA, CURRENT_VERSION } from "../src/types";

describe("migrate", () => {
  it("returns defaults for null/undefined", () => {
    expect(migrate(null)).toEqual(DEFAULT_DATA);
  });
  it("fills missing fields from defaults", () => {
    const out = migrate({ version: 1, layout: [] });
    expect(out.settings).toEqual(DEFAULT_DATA.settings);
    expect(out.todos).toEqual([]);
    expect(out.version).toBe(CURRENT_VERSION);
  });
  it("preserves existing layout/todos", () => {
    const data = { version: 1, settings: DEFAULT_DATA.settings, layout: [{ id: "w", type: "title", x:0,y:0,w:12,h:2, config:{} }], todos: [] };
    expect(migrate(data).layout).toHaveLength(1);
  });
});
```

**Step 2: Run → FAIL.** `npm test -- migrate`

**Step 3: Implement `src/lib/migrate.ts`:**
```ts
import { AtriumData, DEFAULT_DATA, CURRENT_VERSION } from "../types";

export function migrate(raw: unknown): AtriumData {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_DATA);
  const d = raw as Partial<AtriumData>;
  // Future: switch on d.version for breaking migrations.
  return {
    version: CURRENT_VERSION,
    settings: { ...DEFAULT_DATA.settings, ...(d.settings ?? {}) },
    layout: Array.isArray(d.layout) ? d.layout : [],
    todos: Array.isArray(d.todos) ? d.todos : [],
  };
}
```

**Step 4: Run → PASS.** **Step 5:** Commit. `git add tests/migrate.test.ts src/lib/migrate.ts && git commit -m "feat: versioned config migration with tests"`

---

### Task 7: Layout (de)serialization for gridstack (TDD)

**Files:**
- Create: `tests/layout.test.ts`, `src/lib/layout.ts`

Map between `WidgetInstance[]` and gridstack node options (`{id,x,y,w,h}` + we keep `type`/`config` in `data.json` keyed by id).

**Step 1: Failing tests:**
```ts
import { describe, it, expect } from "vitest";
import { toGridNodes, fromGridNodes } from "../src/lib/layout";
import type { WidgetInstance } from "../src/types";

const w: WidgetInstance = { id: "a", type: "title", x: 1, y: 2, w: 3, h: 4, config: { size: "lg" } };

describe("layout", () => {
  it("converts instances to gridstack nodes", () => {
    expect(toGridNodes([w])[0]).toMatchObject({ id: "a", x: 1, y: 2, w: 3, h: 4 });
  });
  it("merges gridstack positions back, preserving type/config", () => {
    const moved = [{ id: "a", x: 5, y: 6, w: 3, h: 4 }];
    const out = fromGridNodes(moved, [w]);
    expect(out[0]).toMatchObject({ id: "a", type: "title", x: 5, y: 6, config: { size: "lg" } });
  });
  it("drops nodes with no matching instance", () => {
    expect(fromGridNodes([{ id: "ghost", x:0,y:0,w:1,h:1 }], [w])).toHaveLength(0);
  });
});
```

**Step 2 → FAIL.** **Step 3: Implement `src/lib/layout.ts`:**
```ts
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
```

**Step 4 → PASS.** **Step 5:** Commit. `git add tests/layout.test.ts src/lib/layout.ts && git commit -m "feat: gridstack layout (de)serialization with tests"`

---

### Task 8: Daily-note path resolution (TDD)

**Files:**
- Create: `tests/dailyNote.test.ts`, `src/lib/dailyNote.ts`

Format tokens: `YYYY`, `MM`, `DD`. Keep it dependency-free (no moment) — small formatter.

**Step 1: Failing tests:**
```ts
import { describe, it, expect } from "vitest";
import { dailyNotePath } from "../src/lib/dailyNote";

describe("dailyNotePath", () => {
  const d = new Date(2026, 5, 30); // 2026-06-30
  it("formats default YYYY-MM-DD under a folder", () => {
    expect(dailyNotePath(d, "YYYY-MM-DD", "Daily")).toBe("Daily/2026-06-30.md");
  });
  it("handles empty folder", () => {
    expect(dailyNotePath(d, "YYYY-MM-DD", "")).toBe("2026-06-30.md");
  });
  it("supports custom format", () => {
    expect(dailyNotePath(d, "YYYY/MM/DD", "")).toBe("2026/06/30.md");
  });
});
```

**Step 2 → FAIL.** **Step 3: Implement `src/lib/dailyNote.ts`:**
```ts
export function formatDate(d: Date, fmt: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return fmt
    .replace(/YYYY/g, String(d.getFullYear()))
    .replace(/MM/g, pad(d.getMonth() + 1))
    .replace(/DD/g, pad(d.getDate()));
}
export function dailyNotePath(d: Date, fmt: string, folder: string): string {
  const name = `${formatDate(d, fmt)}.md`;
  const f = folder.replace(/\/+$/, "");
  return f ? `${f}/${name}` : name;
}
```

**Step 4 → PASS.** **Step 5:** Commit. `git add tests/dailyNote.test.ts src/lib/dailyNote.ts && git commit -m "feat: daily-note path resolution with tests"`

---

## Phase 2 — Grid view & persistence (live verify)

### Task 9: Data persistence in the plugin

**Files:**
- Modify: `src/main.ts`

**Step 1:** Add load/save using `migrate`:
```ts
import { Plugin } from "obsidian";
import { AtriumData } from "./types";
import { migrate } from "./lib/migrate";

export default class AtriumPlugin extends Plugin {
  data!: AtriumData;
  async onload() {
    this.data = migrate(await this.loadData());
    await this.saveAtrium();
  }
  async saveAtrium() { await this.saveData(this.data); }
}
```

**Step 2: Verify.** `npm run dev` running → reload. Check `.obsidian/plugins/atrium/data.json` now exists with default shape. (It's gitignored.)

**Step 3:** Commit. `git add src/main.ts && git commit -m "feat: load/save Atrium data with migration"`

---

### Task 10: Atrium ItemView with an empty gridstack grid

**Files:**
- Create: `src/view.ts`
- Modify: `src/main.ts`
- Create/append: `styles.css`

**Step 1:** `src/view.ts` — register a view that mounts gridstack:
```ts
import { ItemView, WorkspaceLeaf } from "obsidian";
import { GridStack } from "gridstack";
import "gridstack/dist/gridstack.min.css";
import type AtriumPlugin from "./main";
import { toGridNodes, fromGridNodes } from "./lib/layout";

export const VIEW_TYPE_ATRIUM = "atrium-home";

export class AtriumView extends ItemView {
  grid?: GridStack;
  constructor(leaf: WorkspaceLeaf, private plugin: AtriumPlugin) { super(leaf); }
  getViewType() { return VIEW_TYPE_ATRIUM; }
  getDisplayText() { return "Atrium"; }
  getIcon() { return "layout-dashboard"; }

  async onOpen() {
    const root = this.contentEl;
    root.empty();
    root.addClass("atrium-root");
    const gridEl = root.createDiv({ cls: "grid-stack" });
    this.grid = GridStack.init({ column: 12, cellHeight: 70, margin: 8, float: true, staticGrid: true }, gridEl);
    this.grid.on("change", () => this.persist());
    // widgets rendered in later tasks
  }
  private persist() {
    if (!this.grid) return;
    const nodes = this.grid.save(false) as any[];
    this.plugin.data.layout = fromGridNodes(
      nodes.map((n) => ({ id: String(n.id), x: n.x, y: n.y, w: n.w, h: n.h })),
      this.plugin.data.layout,
    );
    void this.plugin.saveAtrium();
  }
  async onClose() { this.grid?.destroy(false); this.grid = undefined; }
}
```

**Step 2:** Register + command/ribbon in `src/main.ts`:
```ts
this.registerView(VIEW_TYPE_ATRIUM, (leaf) => new AtriumView(leaf, this));
this.addRibbonIcon("layout-dashboard", "Open Atrium", () => this.activateView());
this.addCommand({ id: "open-atrium", name: "Open Atrium", callback: () => this.activateView() });
```
and:
```ts
async activateView() {
  const leaf = this.app.workspace.getLeaf(true);
  await leaf.setViewState({ type: VIEW_TYPE_ATRIUM, active: true });
  this.app.workspace.revealLeaf(leaf);
}
```

**Step 3:** `styles.css` base:
```css
.atrium-root { padding: 16px; height: 100%; overflow: auto; }
.atrium-root .grid-stack { min-height: 100%; }
.atrium-widget { background: var(--background-secondary); border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-m); padding: 12px; height: 100%; overflow: auto; color: var(--text-normal); }
```

**Step 4: Verify live.** Reload, run command **Open Atrium** → empty padded grid view opens with the dashboard icon. No errors in console.

**Step 5:** Commit. `git add src/view.ts src/main.ts styles.css && git commit -m "feat: Atrium ItemView with empty gridstack grid"`

---

### Task 11: Edit/lock mode toggle

**Files:** Modify: `src/view.ts`, `src/main.ts`

**Step 1:** Add an in-view header button + command toggling `grid.setStatic`:
```ts
// in onOpen, before grid init:
const bar = root.createDiv({ cls: "atrium-toolbar" });
const editBtn = bar.createEl("button", { text: "Edit layout" });
let editing = false;
editBtn.onclick = () => {
  editing = !editing;
  this.grid?.setStatic(!editing);
  editBtn.setText(editing ? "Done" : "Edit layout");
  root.toggleClass("is-editing", editing);
};
```
Add command `toggle-atrium-edit` mirroring it (optional, can call a method).

**Step 2:** styles: `.atrium-toolbar { display:flex; justify-content:flex-end; gap:8px; margin-bottom:8px; }`

**Step 3: Verify.** In edit mode widgets (none yet) would be draggable; button toggles label and `is-editing` class. Persist still fires on change.

**Step 4:** Commit. `git commit -am "feat: edit/lock mode toggle"`

---

## Phase 3 — Widget framework + first widgets

### Task 12: Widget registry + Svelte mount helper

**Files:** Create: `src/registry.ts`, `src/widgets/index.ts`, `src/widgets/mount.ts`

**Step 1:** `src/widgets/mount.ts` — mount/destroy a Svelte component into a node:
```ts
import type { SvelteComponent } from "svelte";

export interface MountedWidget { destroy(): void; }

export function mountWidget(
  Component: typeof SvelteComponent,
  target: HTMLElement,
  props: Record<string, unknown>,
): MountedWidget {
  // Svelte 4 client API
  const instance = new (Component as any)({ target, props });
  return { destroy: () => instance.$destroy() };
}
```

**Step 2:** `src/registry.ts`:
```ts
import type { SvelteComponent } from "svelte";

export interface WidgetDef {
  type: string;
  title: string;
  icon: string;
  defaultSize: { w: number; h: number };
  Component: typeof SvelteComponent;
  defaultConfig?: Record<string, unknown>;
}
const registry = new Map<string, WidgetDef>();
export function registerWidget(def: WidgetDef) { registry.set(def.type, def); }
export function getWidget(type: string) { return registry.get(type); }
export function allWidgets() { return [...registry.values()]; }
```

**Step 3:** `src/widgets/index.ts` — empty for now, will import+register each widget.

**Step 4:** Commit. `git add src/registry.ts src/widgets && git commit -m "feat: widget registry and Svelte mount helper"`

---

### Task 13: Render widgets from layout into the grid

**Files:** Modify: `src/view.ts`

**Step 1:** After grid init, render each `WidgetInstance`:
```ts
import { getWidget } from "./registry";
import { mountWidget, MountedWidget } from "./widgets/mount";
import { toGridNodes } from "./lib/layout";

// field: private mounted: MountedWidget[] = [];

private renderWidgets() {
  const { layout } = this.plugin.data;
  for (const inst of layout) {
    const def = getWidget(inst.type);
    if (!def) continue;
    const el = this.grid!.addWidget({ id: inst.id, x: inst.x, y: inst.y, w: inst.w, h: inst.h, content: "" });
    const host = el.querySelector(".grid-stack-item-content") as HTMLElement;
    host.addClass("atrium-widget");
    try {
      this.mounted.push(mountWidget(def.Component, host, {
        app: this.app, plugin: this.plugin, instance: inst,
      }));
    } catch (e) { host.setText("⚠️ widget error"); console.error("Atrium widget", inst.type, e); }
  }
}
// call this.renderWidgets() at end of onOpen; in onClose: this.mounted.forEach(m => m.destroy()); this.mounted = [];
```

**Step 2: Verify.** No widgets registered yet → still empty but no errors. (Will light up next task.)

**Step 3:** Commit. `git commit -am "feat: render registered widgets from saved layout"`

---

### Task 14: First widget — Title (+ add-widget palette)

**Files:** Create: `src/widgets/TitleWidget.svelte`; Modify: `src/widgets/index.ts`, `src/view.ts`, `src/main.ts`

**Step 1:** `TitleWidget.svelte`:
```svelte
<script lang="ts">
  export let instance;
  $: cfg = instance.config ?? {};
  $: text = (cfg.text ?? "My Vault");
  $: size = (cfg.size ?? "2.5rem");
  $: color = (cfg.color ?? "var(--text-normal)");
</script>
<div class="atrium-title" style="font-size:{size}; color:{color};">{text}</div>
<style>
  .atrium-title { font-weight: 700; display:flex; align-items:center; height:100%; }
</style>
```

**Step 2:** Register in `src/widgets/index.ts`:
```ts
import { registerWidget } from "../registry";
import TitleWidget from "./TitleWidget.svelte";
export function registerAllWidgets() {
  registerWidget({ type: "title", title: "Title", icon: "type", defaultSize: { w: 12, h: 2 }, Component: TitleWidget, defaultConfig: { text: "My Vault" } });
}
```
Call `registerAllWidgets()` in `main.ts onload` before opening any view.

**Step 3:** Add-widget palette: in edit mode, a "+" button lists `allWidgets()`; clicking adds an instance:
```ts
// helper on the view
addWidgetOfType(type: string) {
  const def = getWidget(type); if (!def) return;
  const inst = { id: crypto.randomUUID(), type, x: 0, y: 0, w: def.defaultSize.w, h: def.defaultSize.h, config: { ...(def.defaultConfig ?? {}) } };
  this.plugin.data.layout.push(inst);
  void this.plugin.saveAtrium();
  this.reload(); // re-run renderWidgets (destroy+re-add) for simplicity in v1
}
```
Wire a "+" button in the toolbar that opens a small `Menu` of `allWidgets()`.

**Step 4: Verify live.** Edit mode → "+" → Title → a title card appears, draggable/resizable, persists across reload (check it survives Obsidian restart).

**Step 5:** Commit. `git add -A && git commit -m "feat: Title widget + add-widget palette"`

---

### Task 15: Per-widget settings (gear → modal)

**Files:** Create: `src/ui/WidgetSettingsModal.ts`; Modify: `src/registry.ts` (add `settingsSchema`), `src/view.ts`, `TitleWidget.svelte` usage.

**Step 1:** Extend `WidgetDef` with an optional schema:
```ts
export type FieldType = "text" | "number" | "color" | "toggle" | "select";
export interface SettingsField { key: string; label: string; type: FieldType; options?: {label:string;value:string}[]; }
export interface WidgetDef { /* ...existing... */ settingsSchema?: SettingsField[]; }
```

**Step 2:** `WidgetSettingsModal.ts` — a generic `Modal` rendering fields from `settingsSchema`, writing into `instance.config`, calling `onSave`.

**Step 3:** In edit mode, add a gear button per grid item (overlay) → opens the modal for that instance; on save → `saveAtrium()` + `reload()`.

**Step 4:** Give Title a schema: `[{key:"text",label:"Text",type:"text"},{key:"size",label:"Font size",type:"text"},{key:"color",label:"Color",type:"color"}]`.

**Step 5: Verify.** Edit a Title's text/size/color via gear → persists.

**Step 6:** Commit. `git add -A && git commit -m "feat: per-widget settings modal from schema"`

---

### Task 16+: Remaining widgets (repeat the widget pattern)

Each widget = the same recipe: **(a)** create `src/widgets/<Name>.svelte`, **(b)** register it in `index.ts` with `defaultSize`, `defaultConfig`, `settingsSchema`, **(c)** build + verify live, **(d)** commit `feat: <name> widget`. Extract any non-trivial logic into `src/lib/` with a vitest test first.

Build in this order (each its own task):

- **Task 16 — Logo/Image**: config `src` (vault path or URL) + fit; render `<img>`. Use `app.vault.adapter.getResourcePath` for vault images.
- **Task 17 — Recent files**: read `app.workspace.getLastOpenFiles()`; list with click-to-open; config `count`.
- **Task 18 — Bookmarks**: read the core Bookmarks plugin (`app.internalPlugins.getPluginById("bookmarks")`); render list; graceful empty state if disabled.
- **Task 19 — Todos**: Svelte component using `src/lib/todos.ts`; input + list with checkboxes + delete + drag-reorder; persists via `plugin.data.todos` + `saveAtrium()`.
- **Task 20 — Search**: input. On submit → if `app.plugins.plugins.omnisearch` present, call its API and render inline results; else open native search (`switcher:open` or global-search command). Extract the "which backend" decision into a tested `src/lib/search.ts` (pure: given a plugins map, return `"omnisearch" | "native"`).
- **Task 21 — Launcher**: config = array of `{label, target, kind:"note|folder|command", icon}`; render cards; click opens note/folder or runs command. Settings UI to manage the list (custom modal section).
- **Task 22 — Calendar + daily note**: mini month grid (build with `src/lib/calendar.ts`, TDD the month-matrix builder); click a day → open/create note at `dailyNotePath(...)`.
- **Task 23 — Quick capture**: input + optional template path; creates a note (configurable folder/name) and optionally opens it.
- **Task 24 — Greeting + clock**: time-based greeting (TDD `src/lib/greeting.ts`: hour→greeting) + live clock via `setInterval` (registered through `this.registerInterval` so Obsidian cleans it up).
- **Task 25 — Vault stats**: counts from `app.vault.getMarkdownFiles()`, etc.; config which stats to show.

---

## Phase 4 — Cross-cutting features

### Task 26: Custom background
Render a background layer in `AtriumView` from `settings.background` (color/gradient/image + blur + opacity). Settings tab controls. Verify each type live. Commit.

### Task 27: Settings tab
`PluginSettingTab` for global settings: `replaceNewTab`, `openOnStartup`, background, and import/export buttons. Commit.

### Task 28: Import / export
Export = `JSON.stringify(plugin.data)` → save file / copy to clipboard. Import = paste/file → `migrate()` → replace data → reload view. TDD the round-trip through `migrate`. Commit.

### Task 29: Style Settings integration
Add a `@settings` YAML block (in a CSS comment) to `styles.css` exposing Atrium CSS variables (widget bg, radius, gap, title color…); make styles consume those vars with Obsidian fallbacks. Verify the section appears in the Style Settings plugin. Commit.

### Task 30: New-tab replacement + startup
On `workspace` "layout ready"/active-leaf events, when `settings.replaceNewTab` and a leaf has view type `empty`, replace with Atrium (feature-detected, guarded in try/catch). On startup, if `settings.openOnStartup`, open Atrium when the active leaf is empty. Verify both toggles. Commit.

---

## Phase 5 — Polish & release tooling (do NOT release yet)

### Task 31: Mobile reflow + resilience pass
Confirm gridstack one-column reflow on narrow width; wrap each widget mount in try/catch (already) and add an error boundary card; null-guard optional-plugin access.

### Task 32: README + LICENSE + release workflow
- `README.md` (features, install via BRAT, screenshots placeholder).
- `LICENSE` (MIT).
- `.github/workflows/release.yml`: on tag push, `npm ci && npm run build`, then attach `main.js`, `manifest.json`, `styles.css` to the GitHub release.
- Do **not** publish — Quentin drives the actual BRAT release when the plugin is mature (per project decision).

### Task 33: Full test run + manual QA checklist
`npm test` green; walk the manual checklist (add/move/resize/lock, each widget, persistence across restart, both new-tab toggles, import/export, theme switch). Then we revisit scope: add/remove/improve before any release.

---

## Notes for the executor
- After each task: `npm run build` (type-check) must pass before committing UI tasks; `npm test` must pass for logic tasks.
- Keep `npm run dev` running throughout for hot-reload.
- This Dev Vault lacks Omnisearch/Tasks — test Search's native fallback here; install Omnisearch separately to test the API path.
- v2 backlog (not in this plan): Markdown/embed widget, resurfaced note, tag/saved-search shortcuts, multiple profiles.
