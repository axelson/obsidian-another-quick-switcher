# Jax fuzzy match

## Implementation notes

No deviations from spec. All changes implemented as specified.

## Goal

Add a new "Jax fuzzy match" sort priority with a higher-quality fuzzy scoring algorithm that rewards word-boundary matches, prefix matches, and match position — replacing the need to juggle separate "Prefix name match" / "Name match" / "Fuzzy name match" priorities.

## Approach

Create a parallel fuzzy matching implementation in a new fork-only file. The existing `microFuzzy`/`smartMicroFuzzy` and all upstream sort priorities remain untouched. The new algorithm runs alongside the existing one in the matcher; users opt in by adding "Jax fuzzy match" to their sort priorities.

### Algorithm

**Matching strategy**: Greedy forward scan to find a match, then a backward pass from the last matched character to find a tighter alignment. Single function handles normalization (lowercase, optional diacritics), keeps spaces in the text (for natural word-boundary detection), and skips emoji characters during the scan so ranges map directly to original string coordinates with no remapping.

**Scoring** (per matched character, additive):

| Bonus          | Value                   | When                                                  |
|----------------|-------------------------|-------------------------------------------------------|
| Base           | 1                       | Every matched character                               |
| Consecutive    | 4                       | Each character continuing an unbroken run              |
| First char     | 8                       | Match at position 0 of the string                     |
| Word boundary  | 6                       | Match at start of a word (after space, `-`, or `_`)   |
| Position       | `(1 - pos / len) * 3`   | Earlier matches score higher (max 3, decays toward 0) |

**Gap penalties** (subtractive):

| Penalty        | Value | When                                        |
|----------------|-------|---------------------------------------------|
| Gap start      | −2    | Beginning a new gap between matched chars   |
| Gap extension  | −1    | Each additional skipped character in a gap   |

**Final score**: `max(0, totalPoints) / queryLength`

### Performance

Both algorithms run on every item (no conditional gating). The backward tightening pass roughly doubles work vs. `microFuzzy`. Budget: 2× the `smartMicroFuzzy` performance threshold (300ms for 10k items × 10 iterations).

## Changes

### New files

- **`src/utils/jax-fuzzy.ts`** — single exported function:
  ```ts
  export function jaxFuzzy(
    text: string,
    query: string,
    isNormalizeAccentsDiacritics: boolean,
  ): { score: number; ranges: { start: number; end: number }[] } | null;
  ```
  - Normalizes text (lowercase, optional diacritics) but keeps spaces
  - Normalizes query (lowercase, optional diacritics, strips spaces)
  - Skips emoji characters during scan (no stripping/remapping)
  - Greedy forward scan, backward tightening, scoring as specified above
  - Returns `null` for no match

- **`src/utils/jax-fuzzy.test.ts`** — unit tests:
  - Scoring correctness: starts-with gets highest score, word-boundary match beats mid-word, earlier position beats later
  - Backward tightening: query "ab" in "a___ab" matches the consecutive pair, not the spread
  - Boundary detection: space, `-`, `_` all trigger word-boundary bonus
  - Gap penalties: verify gaps reduce score
  - Edge cases: empty query, single-char query, no match, query longer than text
  - Performance tests: 10k items at 2× `smartMicroFuzzy` thresholds

### Modified files (all additive)

- **`src/matcher.ts`**
  - Import `jaxFuzzy` from `./utils/jax-fuzzy`
  - Add `"jax-fuzzy-name"` to the `MatchType` union
  - In `matchQuery()`, after the existing fuzzy switch block (~line 221), call `jaxFuzzy()` on the basename and push a `{ type: "jax-fuzzy-name", score, ranges, query }` result if score exceeds `options.minFuzzyScore`

- **`src/sorters.ts`**
  - Add `"Jax fuzzy match"` to `sortPriorityList`
  - New comparator `priorityToJaxFuzzyScore`: same pattern as `priorityToFuzzyScore` but filters for `type === "jax-fuzzy-name"` match results
  - New `case "Jax fuzzy match"` in `getComparator`
  - Do NOT add to `filterNoQueryPriorities` (it is query-dependent)

### Out of scope

- Modifying the existing `microFuzzy` / `smartMicroFuzzy` algorithms
- CamelCase boundary detection (excluded per design discussion — separator-only boundaries keep the scan simple)
- Conditional gating (skip jax fuzzy when not in sort priorities) — defer unless performance is a problem
- Alias matching — jax fuzzy runs on the file basename only, same as the existing fuzzy; alias matching is a separate code path
- Changes to default sort priorities
