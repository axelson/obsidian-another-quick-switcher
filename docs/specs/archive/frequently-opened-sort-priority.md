# Frequently opened sort priority

## Implementation notes (deviations from the original spec)

- **Default window is 90 days, not 30** — changed at implementation time by user request.
- **LinkModal does not record switches.** Its `chooseCurrentSuggestion` opens the *active* file at the link's line (a jump within the current note), not the linked file — recording there would count self-switches and corrupt frequency data. Switches are recorded in AnotherQuickSwitcherModal, BacklinkModal, and GrepModal only.
- **`switchCount` stamping happens only in AnotherQuickSwitcherModal.** Backlink/Link/Grep dialogs do not use search-command sort priorities, so stamping counts there would be dead code.
- **Two convenience functions added** to `src/switch-history.ts` beyond the spec (`fetchSwitchCounts`, `persistSwitch`) so each modal's diff stays to a few lines.
- **Counts load asynchronously after the dialog opens**; the first paint may sort before counts arrive (file read is fast, so in practice this is invisible).

## Goal

Track how often each file is switched to via this plugin's dialogs, and let users rank frequently switched files above less frequently used ones via a new "Frequently opened" sort priority.

## Vocabulary

Per CONTEXT.md: a **switch** is an explicit choice of a suggestion in one of this plugin's dialogs that opens a file (previews, auto previews, and opens made outside the plugin do not count). The **frequency window** is the configurable recent period within which switches count.

## Approach

Mirror the Command palette's history architecture, which is the in-repo precedent: persist history in a dedicated JSON file (`command-history.json` → here `switch-history.json`) loaded/saved with the existing `loadJson`/`saveJson` helpers (`src/apputils/io.ts`).

- **Record**: on final choose (not `keepOpen`/preview) in the four file-opening dialogs, append `Date.now()` to a per-path timestamp list, capped at the most recent 50 entries.
- **Score**: switch frequency = count of timestamps within the frequency window (`frequencyWindowDays` setting, default 30).
- **Rank**: new predefined sort priority `"Frequently opened"`, higher count wins; ties fall through to the next priority. Usable with an empty search query (like "Last opened").
- **Lifecycle**: vault `rename` migrates a history entry to the new path; vault `delete` drops it. Stale timestamps (outside the window) and empty entries are pruned on load/save, so the file is self-cleaning.
- **Mergeability** (per FORK.md): all logic lives in a new fork-only module; touches to upstream files are limited to additive lines (new switch cases, new list entries, one optional interface field, call sites). Upstream defaults are not changed — users opt in by adding the priority to their own search commands.

### Performance

Vaults may have tens of thousands of notes. Counts are computed once per dialog open: load `switch-history.json`, reduce to a `switchCountByPath: { [path]: number }` map, and stamp each `SuggestionItem` with its count at item-construction time (same pattern as `lastOpenFileIndexByPath`). The comparator is then an O(1) numeric comparison; no per-comparison date math. History size is bounded (≤50 timestamps × files switched within ~the window), so load/parse cost is negligible.

## Changes

### New files

- **`src/switch-history.ts`** — fork-only module owning all switch-history logic:
  - `SwitchHistory` type: `{ [path: string]: number[] }` (recent switch epoch-millis, newest last, capped at 50)
  - `loadSwitchHistory(path)` / `saveSwitchHistory(path, history)` via `loadJson`/`saveJson`
  - `recordSwitch(history, filePath, now)` — append + cap
  - `countsWithinWindow(history, windowDays, now): { [path: string]: number }`
  - `pruneSwitchHistory(history, windowDays, now)` — drop stale timestamps and empty entries
  - `renamePath(history, oldPath, newPath)` / `removePath(history, path)`
  - Default path constant: `.obsidian/plugins/obsidian-another-quick-switcher/switch-history.json`

- **`src/switch-history.test.ts`** — minimal unit tests (per CLAUDE.md): record/cap, window counting, pruning, rename/remove.

### Modified files (all additive)

- **`src/settings.ts`**
  - New setting `frequencyWindowDays: number`, default `30`, with a settings-UI number field "Frequency window (days)"
- **`src/sorters.ts`**
  - Add `"Frequently opened"` to `sortPriorityList`
  - Add it to the allowlist in `filterNoQueryPriorities` (usable with empty query)
  - New comparator `priorityToFrequentlyOpened` comparing `switchCount ?? 0` (desc); new `case "Frequently opened"` in `getComparator`
- **`src/matcher.ts`**
  - Optional field `switchCount?: number` on `SuggestionItem` (additive; avoids changing shared comparator signatures)
- **`src/ui/AnotherQuickSwitcherModal.ts`**, **`src/ui/BacklinkModal.ts`**, **`src/ui/LinkModal.ts`**, **`src/ui/GrepModal.ts`** (the four dialogs with `chooseCurrentSuggestion`)
  - On open: load history, compute `countsWithinWindow`, stamp `switchCount` onto suggestion items
  - In `chooseCurrentSuggestion`: when the choose is a final open (`!option.keepOpen`), record a switch and save. Phantom creation counts (the user explicitly chose it); previews do not.
- **`src/main.ts`**
  - `registerEvent` handlers for vault `rename`/`delete` that migrate/drop history entries
- **`src/sorters.test.ts`**
  - Test the new comparator (higher count first, missing counts as 0, tie falls through)
- **`README.md`**
  - One row in the Sort priorities table: `Frequently opened` — "Orders by number of times opened via this plugin within the frequency window". Small additive divergence from upstream, accepted so fork users have docs.

### Out of scope

- Tracking opens made outside this plugin's dialogs (see ADR 0001)
- A tracking on/off toggle (the sort priority itself is the opt-in)
- Changing any default sort priorities
- Configurable history file path or cap
