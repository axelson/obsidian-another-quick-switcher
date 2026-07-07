# Fork policy

This repo is a fork of [tadashi-aikawa/obsidian-another-quick-switcher](https://github.com/tadashi-aikawa/obsidian-another-quick-switcher) (remote: `upstream`). Prioritize mergeability with upstream changes:

- Prefer purely additive changes (new files, new switch cases, new settings keys) over modifying existing upstream code.
- Avoid touching upstream hotspots unless necessary: default settings values, README structure, CLAUDE.md.
- Keep fork-specific documentation in fork-only files (like this one) rather than editing upstream docs.
- When a change would be broadly useful, consider whether it could be offered as an upstream PR instead of carried in the fork.
