import { describe, expect, test } from "@jest/globals";
import type { SuggestionItem } from "./matcher";
import { sort } from "./sorters";
import { createSuggestionItem } from "./test-helpers/suggestion-item";

const createItem = (
  path: string,
  frontMatter?: SuggestionItem["frontMatter"],
): SuggestionItem => createSuggestionItem({ path, frontMatter });

describe("sort (property value)", () => {
  test("sorts by property value desc and keeps missing values last", () => {
    const items = [
      createItem("b.md", { updated: "2025-01-01" }),
      createItem("c.md", { updated: "2026-01-11" }),
      createItem("a.md"),
    ];

    const sorted = sort([...items], ["@updated:desc"], {});

    expect(sorted.map((item) => item.file.path)).toStrictEqual([
      "c.md",
      "b.md",
      "a.md",
    ]);
  });

  test("sorts by first array element in asc order", () => {
    const items = [
      createItem("b.md", { rank: [2, 1] }),
      createItem("a.md", { rank: [1, 3] }),
    ];

    const sorted = sort([...items], ["@rank:asc"], {});

    expect(sorted.map((item) => item.file.path)).toStrictEqual([
      "a.md",
      "b.md",
    ]);
  });
});

describe("sort (path prefix ^)", () => {
  test("sorts files matching the prefix above non-matching files", () => {
    const items = [
      createItem("Other/note.md"),
      createItem("Permanent/note.md"),
    ];

    const sorted = sort([...items], ["^Permanent/"], {});

    expect(sorted.map((item) => item.file.path)).toStrictEqual([
      "Permanent/note.md",
      "Other/note.md",
    ]);
  });

  test("comma-separated prefixes: file matching more prefixes sorts higher", () => {
    const items = [
      createItem("Other/note.md"),
      createItem("Projects/Active/note.md"),
    ];

    const sorted = sort([...items], ["^Projects/,^Projects/Active/"], {});

    expect(sorted.map((item) => item.file.path)).toStrictEqual([
      "Projects/Active/note.md",
      "Other/note.md",
    ]);
  });

  test("bare prefix without trailing slash matches broader", () => {
    const items = [
      createItem("Other/note.md"),
      createItem("Permanently/note.md"),
    ];

    const sorted = sort([...items], ["^Permanent"], {});

    expect(sorted.map((item) => item.file.path)).toStrictEqual([
      "Permanently/note.md",
      "Other/note.md",
    ]);
  });

  test("both files in matching prefix returns tie (0)", () => {
    const items = [createItem("Permanent/a.md"), createItem("Permanent/b.md")];

    const sorted = sort([...items], ["^Permanent/", "Alphabetical"], {});

    expect(sorted.map((item) => item.file.path)).toStrictEqual([
      "Permanent/a.md",
      "Permanent/b.md",
    ]);
  });
});

describe("sort (Frequently opened)", () => {
  const withSwitchCount = (
    path: string,
    switchCount?: number,
  ): SuggestionItem => ({ ...createItem(path), switchCount });

  test("ranks higher switch counts first and treats missing counts as 0", () => {
    const items = [
      withSwitchCount("a.md"),
      withSwitchCount("b.md", 1),
      withSwitchCount("c.md", 5),
    ];

    const sorted = sort([...items], ["Frequently opened"], {});

    expect(sorted.map((item) => item.file.path)).toStrictEqual([
      "c.md",
      "b.md",
      "a.md",
    ]);
  });

  test("falls through to the next priority on tie", () => {
    const items = [withSwitchCount("b.md", 3), withSwitchCount("a.md", 3)];

    const sorted = sort([...items], ["Frequently opened", "Alphabetical"], {});

    expect(sorted.map((item) => item.file.path)).toStrictEqual([
      "a.md",
      "b.md",
    ]);
  });
});
