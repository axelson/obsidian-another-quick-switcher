# Fork policy

This repo is a fork of [tadashi-aikawa/obsidian-another-quick-switcher](https://github.com/tadashi-aikawa/obsidian-another-quick-switcher) (remote: `upstream`). Prioritize mergeability with upstream changes:

- Prefer purely additive changes (new files, new switch cases, new settings keys) over modifying existing upstream code.
- Avoid touching upstream hotspots unless necessary: default settings values, README structure, CLAUDE.md.
- Keep fork-specific documentation in fork-only files (like this one) rather than editing upstream docs.
- When a change would be broadly useful, consider whether it could be offered as an upstream PR instead of carried in the fork.

# Fork features

## File-name fuzzy scoring

The fork adds its own file-name fuzzy scorer (`jaxFuzzy`, sort priority "Jax fuzzy match")
alongside the upstream `microFuzzy` scorer, and shows both scores in each suggestion.

### Two-scorer display

When "Show fuzzy match score" is on, each suggestion shows two labeled values:

- `jax` — the fork's `jaxFuzzy` score (max over `jax-fuzzy-name` match results)
- `micro` — the upstream `microFuzzy` score (max over all other scored match results)

The score whose sort priority is configured (i.e. the one actually driving the current
order) is emphasized; the other is muted. This avoids the old single `max()` display that
silently mixed the two scales and hid which scorer was in effect.

### Jax scoring levers

`jaxFuzzy` (`src/utils/jax-fuzzy.ts`) is a pure text scorer tuned for switching to notes:

- **Absolute position bonus** — the match-position bonus decays over the first
  `POSITION_FALLOFF` chars, so a longer filename no longer out-scores a shorter one for the
  same match position.
- **Complete-word bonus** — a matched run bounded by separators/edges on both sides (a whole
  word like "Network") outranks a partial match ("Networking").
- **Length tiebreaker** — a gentle preference for shorter titles.

The non-md attachment demotion lives in `src/matcher.ts` (`JAX_NON_MD_PENALTY`), applied to
the jax score after the visibility threshold so attachments still appear, just lower.

## Mobile compact view

On mobile (`Platform.isMobile`), the switcher is tightened to fit more results above the
keyboard:

- **Trimmed footer** — the current-note-name header and the search-mode indicator
  ("… fuzzy search") are hidden via `.is-mobile` rules in `styles.css`.
- **Compact scored results** — for items that show a fuzzy score, each result is laid out as
  three rows: title, then any aliases on their own line, then the folder name and score
  together on one row. The folder truncates with an ellipsis so the score stays visible.

The folder+score row is built explicitly in `renderSuggestion`
(`layoutMobileCompactItem` in `src/ui/suggestion-factory.ts`) rather than via CSS wrapping,
because CSS-only wrapping/grid was unpredictable across the scored item's variable children.
The row itself is a simple flexbox (`another-quick-switcher__item__compact-row`). Desktop
rendering is unchanged (the non-mobile branch is the original assembly).
