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
