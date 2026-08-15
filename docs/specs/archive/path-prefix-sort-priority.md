# Path-prefix sort priority (`^path/`)

## Goal

Allow users to boost files in specific directories higher in search results via a new dynamic sort priority, without filtering out files from other directories.

## Approach

Add a new dynamic sort priority with the `^` sigil. When a user adds e.g. `^Permanent/` to their sort priority list, files whose vault path starts with `Permanent/` are sorted higher than files that don't match. Multiple prefixes can be comma-separated (`^Permanent/,^Projects/`), and a file matching more prefixes sorts higher (same pattern as `#tag1,#tag2`).

Matching is case-sensitive, using bare `startsWith` — consistent with the existing `includePrefixPathPatterns` / `excludePrefixPathPatterns` behavior. No trailing slash enforcement; users add it themselves if they want directory-only matching.

No `<current_dir>` placeholder support in v1.

## Changes

### 1. `src/sorters.ts` — Add `^` to `SortPriority` type union

Add `` | `^${string}` `` to the `SortPriority` type (line 31).

### 2. `src/sorters.ts` — Recognize `^` in `regardAsSortPriority`

Add a check for `x.split(",").every((y) => y.startsWith("^"))` to the validation function (line 53-60), so settings validation accepts `^`-prefixed entries.

### 3. `src/sorters.ts` — Include `^` in `filterNoQueryPriorities`

Add `x.startsWith("^")` to the filter in `filterNoQueryPriorities` (line 62-81). Path-prefix boosting is independent of the search query, so it should apply even when no query is typed.

### 4. `src/sorters.ts` — Add `priorityToPathPrefix` comparator function

New function following the `priorityToExtensions` / `priorityToTags` pattern:

```ts
function priorityToPathPrefix(
  a: SuggestionItem,
  b: SuggestionItem,
  prefixes: string[],
): 0 | -1 | 1 {
  return compare(
    a,
    b,
    (x) => prefixes.filter((p) => x.file.path.startsWith(p)).length,
    "desc",
  );
}
```

Count of matching prefixes, descending — a file matching 2 of 3 listed prefixes sorts above one matching 1.

### 5. `src/sorters.ts` — Wire `^` into `getComparator` default branch

In the `default` branch of `getComparator` (after the existing `#` and `.` checks, around line 133-142), add:

```ts
if (priority.startsWith("^")) {
  const prefixes = priority.split(",").map((x) => x.slice(1));
  return (a: SuggestionItem, b: SuggestionItem) =>
    priorityToPathPrefix(a, b, prefixes);
}
```

### 6. `src/sorters.ts` — Add test coverage

Add a test file `src/__tests__/sorters.test.ts` (or add to the existing test file if one exists) with minimal tests:

- `^Permanent/` sorts a file in `Permanent/` above one in `Other/`
- `^Permanent/,^Projects/` — file matching both prefixes sorts above file matching one
- `^Permanent` (no trailing slash) matches `Permanently/foo.md` (documenting the startsWith behavior)
- Two files both in `Permanent/` return `0` (tie)

## Implementation notes

No divergences from the spec. Tests were added to the existing `src/sorters.test.ts` file (not `src/__tests__/sorters.test.ts` as the spec suggested as an alternative). CONTEXT.md was updated to include the new `^path/` custom priority in the sort priority glossary entry.
