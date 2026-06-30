# Atrium — Design Doc

> Custom modular homepage plugin for Obsidian. Replaces Home Tab with a snap-grid
> dashboard of draggable, resizable, configurable widgets.
> *Atrium = the entrance hall of a Roman house — fits the Clio vault's classical naming.*

- **Date:** 2026-06-30
- **Status:** Approved (brainstorming complete)
- **Author:** Quentin (Titus) + Claude

## 1. Goal & workflow

A clean, modular homepage shown on new tabs / vault open, fully customizable via
drag-and-drop. **BRAT release is the finish line, not the start.** We develop
**directly in the Dev Vault** (`.obsidian/plugins/atrium/`) with esbuild watch +
the **hot-reload** plugin for an instant feedback loop, iterate (add / improve /
remove features), and only cut a GitHub release for BRAT once mature.

Priority: a **testable MVP in the vault ASAP**, then iterate. Mockups via Claude
Design were considered and skipped — we iterate the visual live, styling against
Obsidian theme variables from day one.

## 2. Obsidian integration

- Register a custom **`ItemView`** — `VIEW_TYPE = "atrium-home"` — that renders the homepage.
- **Replace the new-tab empty view**: on workspace events, detect `empty` leaves and
  swap them for the Atrium view (Home Tab's technique). Toggle via setting.
- **On vault open**: if the active leaf is empty, open Atrium.
- **Command + ribbon icon** "Open Atrium" to open on demand.
- Settings: `replaceNewTab`, `openOnStartup` (both default on).

> ⚠️ Risk: new-tab replacement is historically fragile across Obsidian versions →
> feature-detect, guard, and keep the off switch.

## 3. Layout engine & widget model

- **gridstack.js** drives a 12-column responsive grid: drag, resize, snap, reflow to
  one column when narrow (mobile), serialization to/from JSON.
- **Edit / lock mode**: `grid.setStatic(true)` = locked (nothing moves); edit mode
  enables drag/resize and shows a **"+" palette** to add widgets. Toggle via command +
  on-view button.
- **Widget = definition + Svelte component**, held in a **registry**:
  `{ type, title, icon, defaultSize, settingsSchema, Component }`.
  Adding a widget type = one registry entry; all widgets share the same lifecycle.
- **Per-widget gear** opens a settings modal/popover driven by `settingsSchema`.
- **Lifecycle**: each widget's Svelte component is mounted into its gridstack item
  content node on add/load and destroyed on removal/`onunload` — no leaks.

> ⚠️ Risk: Svelte ↔ gridstack lifecycle. Encapsulate mount/destroy per widget.

## 4. Data & persistence (`data.json`)

```jsonc
{
  "version": 1,
  "settings": {
    "replaceNewTab": true,
    "openOnStartup": true,
    "background": { "type": "none|color|gradient|image", "value": "", "blur": 0, "opacity": 1 }
  },
  "layout": [
    { "id": "uuid", "type": "title", "x": 0, "y": 0, "w": 12, "h": 2, "config": { /* per-widget */ } }
  ],
  "todos": [ { "id": "uuid", "text": "...", "done": false, "order": 0 } ]
}
```

- All via `loadData` / `saveData`.
- **Versioned migration** on load (switch on `version`).
- **Import / export** = dump / restore this object as JSON (file picker + clipboard).

## 5. v1 widgets

Core: **Title** (size/color) · **Logo/image** · **Search** · **Recent files** ·
**Bookmarks** · **Todos** (self-contained).
Added: **Launcher** (pinned notes/folders as cards) · **Calendar + daily note** ·
**Quick capture** · **Greeting + clock** · **Vault stats**.

Sensitive widgets:
- **Search** — if `app.plugins.plugins.omnisearch` present → inline results via its API;
  else the input opens the native search / quick switcher. Graceful degradation.
- **Todos** — pure-logic CRUD (add / check / reorder / delete) in `data.json`. Testable.
- **Calendar** — resolves the daily-note path (configurable format); click opens/creates.
- **Launcher** — editable list of targets (note / folder / command) rendered as cards.
- **Stats / Greeting+clock** — read `app.vault`; `setInterval` cleaned in `onunload`.

## 6. Theming & style

- Default to **Obsidian CSS variables** (`--background-primary`, `--text-normal`, …) →
  adapts to any theme.
- Expose our own variables via a **`@settings` block** in `styles.css` → tunable from the
  **Style Settings** plugin (already installed) without code.
- **Custom background**: color / gradient / image with blur + opacity, layered behind the grid.

## 7. Tech stack & build

- **TypeScript + Svelte + gridstack.js**, bundled with **esbuild** (`esbuild-svelte`),
  based on the official sample-plugin template.
- Dev in `.obsidian/plugins/atrium/`, esbuild **watch** → **hot-reload** reloads on `main.js` change.
- `isDesktopOnly: false` — mobile is best-effort (gridstack supports touch; reflow to 1 column).

## 8. Testing (QA-friendly)

- **Extract and unit-test the logic core** (vitest, Node): layout (de)serialization,
  todo CRUD, daily-note path resolution, config migration.
- **UI / drag-drop**: manual live testing via hot-reload (Obsidian is Electron — no simple
  headless path; accepted).

## 9. Release (BRAT)

- GitHub repo (root = this plugin folder), `version-bump` script, **GitHub Action** that
  builds and attaches `main.js` + `manifest.json` (+ `styles.css`) to the release on tag.
- Tag = release name = manifest `version` (semver). Install via repo URL in BRAT.

## 10. Scope

**v1 (this design):** sections 2–9 above.
**v2 backlog:** Markdown/embed widget · resurfaced/random note · tag/saved-search
shortcuts · multiple homepage profiles (Work/Personal switch).

## 11. Risks (summary)

1. Svelte ↔ gridstack lifecycle → encapsulated mount/destroy.
2. New-tab replacement fragility across versions → feature-detect + guard + off switch.
3. Scope (11 widgets) → build framework + 3–4 widgets first; rest is repetitive.
4. Omnisearch API semi-documented → defensive + native fallback.

## 12. Build order (incremental, testable each step)

1. Scaffold (manifest, esbuild+svelte, empty `ItemView`, ribbon/command) → renders in vault.
2. gridstack grid + edit/lock toggle + persistence of an empty layout.
3. Widget registry + "+" palette + first widget (Title).
4. Add widgets incrementally: Logo → Search → Recent → Bookmarks → Todos → Launcher →
   Calendar → Quick capture → Greeting+clock → Stats.
5. Per-widget settings, background, Style Settings vars, import/export.
6. New-tab replacement + startup behavior.
7. Logic unit tests; polish; release tooling for BRAT.
