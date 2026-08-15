# Fork: Another Quick Switcher

Personal fork of [obsidian-another-quick-switcher](https://github.com/tadashi-aikawa/obsidian-another-quick-switcher).

## Fork features

### Jax fuzzy match

A new **"Jax fuzzy match"** sort priority with a higher-quality fuzzy scoring algorithm. Unlike the built-in "Fuzzy name match" (which only considers query length and filename length), this algorithm rewards:

- **Word-boundary matches** — matching at the start of a word (after space, `-`, `_`) scores higher than mid-word
- **Prefix matches** — matching at the very start of the filename gets a large bonus
- **Earlier match position** — matches near the beginning of the name score higher
- **Consecutive characters** — longer unbroken runs of matched characters score higher
- **Gap penalties** — skipped characters between matches reduce the score

This lets a single sort priority replace the combination of "Prefix name match" + "Name match" + "Fuzzy name match". To use it, add "Jax fuzzy match" to your search command's sort priorities in the plugin settings.

## Development

### Prerequisites

- [Bun](https://bun.sh/)
- [gh](https://cli.github.com/) (for releasing)

### Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Build and copy to vault (watches for changes) |
| `bun run build` | Production build (type-check + bundle) |
| `bun run test` | Run tests |
| `bun run lint` | Lint with Biome |
| `bun run typecheck` | Type-check without emitting |
| `bun run pre:push` | Run typecheck + lint + test (run before pushing) |

### Dev workflow

1. Set `VAULT_DIR` in `esbuild.config.mts` to your vault's path
2. Run `bun run dev` — builds and copies the plugin into your vault's `.obsidian/plugins/` directory
3. In Obsidian, enable the plugin and use "Reload app without saving" (Cmd+R) after changes
4. Before pushing, run `bun run pre:push`

### Branch strategy

- `master` tracks upstream
- `jax` is the fork branch — all fork work goes here
- Rebase `jax` onto `master` after fetching upstream updates

## Installing in Obsidian (via BRAT)

Works on desktop and iOS.

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) community plugin
2. In BRAT settings, click "Add Beta plugin"
3. Enter this fork's GitHub repo URL (e.g. `YourUser/obsidian-another-quick-switcher`)
4. Enable the plugin in Settings > Community plugins

BRAT pulls `main.js`, `manifest.json`, and `styles.css` from the latest GitHub release.

## Releasing

Run `./release.sh` from the repo root. It:

- Builds the plugin (`bun run build`)
- Stamps a date-based version (`33.YYYYMMDD.0`) into the release manifest only
- Creates (or replaces) a single `fork-latest` GitHub release with the built assets

The repo's `manifest.json` stays in sync with upstream — the fork version only exists in the release assets, avoiding merge conflicts on rebase.

Requires: `gh` CLI authenticated with push access to the fork.

## Updating after upstream changes

1. Fetch upstream and rebase `jax` onto `master`
2. Resolve any conflicts
3. Push `jax`
4. Run `./release.sh` to update the release

BRAT will pick up the new version next time Obsidian checks for updates.
