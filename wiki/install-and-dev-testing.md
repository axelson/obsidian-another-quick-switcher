---
title: Installing and testing the plugin in Obsidian
updated: 2026-07-07
tags: [dev-workflow, obsidian, testing]
---

## Dev flow (hot reload)

`bun run dev` builds with esbuild in watch mode and copies `main.js`, `manifest.json`, `styles.css` into a vault's plugin folder. The target vault is **hardcoded** in `esbuild.config.mts` as `VAULT_DIR` — upstream ships the author's personal path, so point it at your own vault as a **local, uncommitted edit** (fork policy: don't commit machine-specific changes to upstream files).

The dev flow also drops a `.hotreload` marker file in the plugin folder. If the [Hot Reload](https://github.com/pjeby/hot-reload) community plugin is installed in the vault, the plugin auto-reloads on each rebuild; otherwise reload manually.

## Manual install

```
bun install
bun run build
mkdir -p "<vault>/.obsidian/plugins/obsidian-another-quick-switcher"
cp main.js manifest.json styles.css "<vault>/.obsidian/plugins/obsidian-another-quick-switcher/"
```

Then Settings → Community plugins → enable "Another Quick Switcher".

## Gotchas

- **A full Obsidian restart may be needed** for the plugin to load after a fresh install — toggling the plugin off/on isn't always enough (observed 2026-07-07).
- If the community-plugins version of Another Quick Switcher was previously installed, Obsidian may consider the local build "older"; bumping `manifest.json`'s version locally (uncommitted) works around this.
- Pre-flight checks: `bun run pre:push` (typecheck + lint + test). IDE/LSP diagnostics are unreliable until `bun install` has run.

## Verifying the fork's "Frequently opened" feature

1. Settings: add "Frequently opened" to a search command's sort priorities; confirm the "Frequency window (days)" field (default 90).
2. Open several files via the plugin's main dialog; ranking should reflect open counts.
3. `<vault>/.obsidian/plugins/obsidian-another-quick-switcher/switch-history.json` should be created.
4. Rename a tracked file — history should follow the rename.
5. Only opens via the plugin count (see `docs/adr/0001-switch-tracking-scope.md`).
