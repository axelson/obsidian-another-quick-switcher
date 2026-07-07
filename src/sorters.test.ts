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
