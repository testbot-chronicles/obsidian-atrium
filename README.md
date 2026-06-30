# Atrium

> A modular, drag-and-drop homepage for Obsidian.

Atrium turns a tab into a customizable dashboard: drop widgets onto a snap grid, drag,
resize, lock, and configure each one — with a live, non-blocking settings panel.

## Features

- **Snap-grid layout** — 12-column responsive grid; drag to move, drag edges to resize, snaps to cells.
- **Edit / lock mode** — a visible grid while arranging; lock individual widgets so they aren't moved or pushed by others.
- **Live settings panel** — floating, draggable, non-modal; every change previews instantly. Each widget exposes three sections:
  - **General** — card title: custom text (with the default shown as placeholder), show/hide, alignment, top/bottom position.
  - The widget's own settings.
  - **Appearance** — background, padding, corner radius, border, drop shadow.
- **Persistence** — your layout and settings are saved per vault.

### Widgets

- **Title** — size, horizontal/vertical alignment, weight, font (default / serif / mono), uppercase, italic, letter-spacing, custom color.
- **Logo / Image** — vault image or URL; fit, size, in-card position, click-to-open (note or URL), grayscale, opacity.
- **Recent files** — source (opened / modified / created), file-type filter (notes / all), **List or folder Tree** view, file icons, dates.
- **Vault stats** — notes / attachments / file counts.
- **Greeting + clock** — time-of-day greeting, live clock, date.

Open Atrium from the ribbon (dashboard icon) or the **Open Atrium** command.

## Install (via BRAT)

Distributed for testing with [BRAT](https://github.com/TfTHacker/obsidian42-brat):

1. Install the **BRAT** community plugin.
2. BRAT → **Add beta plugin** → `https://github.com/testbot-chronicles/obsidian-atrium`
3. Enable **Atrium** in Community plugins.

## Roadmap

Search (Omnisearch + native fallback) · Bookmarks · self-contained Todos · Launcher (pinned notes/folders) ·
Calendar + daily note · Quick capture · custom background · layout import/export · Style Settings integration ·
replace new-tab / open on startup · multiple homepage profiles.

## Development

```bash
npm install
npm run dev    # esbuild watch — with the hot-reload plugin, reloads on change
npm run build  # type-check + production bundle
npm test       # vitest (logic core: todos, layout, migration, recent, …)
```

Atrium is developed directly inside a vault's `.obsidian/plugins/atrium/` for live iteration.
The logic core is unit-tested; the UI is verified live.

## License

[MIT](LICENSE) © Titus
