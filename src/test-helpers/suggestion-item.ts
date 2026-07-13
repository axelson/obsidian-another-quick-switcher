/**
 * SuggestionItemとTFileのテスト用fixture。
 * matcher / sorters / suggestion-factory など、SuggestionItemを扱う
 * テストから共通で利用する。
 */

import type { TFile } from "obsidian";
import type { MatchQueryResult, SuggestionItem } from "../matcher";

export function createFile(
  path: string,
  stat?: { mtime?: number; ctime?: number },
): TFile {
  const name = path.split("/").pop() ?? path;
  const basename = name.replace(/\.[^.]+$/, "");
  const parentPath = path.includes("/") ? path.replace(/\/[^/]+$/, "") : "";
  return {
    path,
    name,
    basename,
    extension: name.split(".").pop() ?? "",
    stat: { mtime: stat?.mtime ?? 0, ctime: stat?.ctime ?? 0 },
    parent: {
      path: parentPath,
      name: parentPath.split("/").pop() ?? parentPath,
    },
  } as unknown as TFile;
}

export function createSuggestionItem(partial: {
  path?: string;
  stat?: { mtime?: number; ctime?: number };
  tags?: string[];
  aliases?: string[];
  frontMatter?: SuggestionItem["frontMatter"];
  matchResults?: MatchQueryResult[];
  phantom?: boolean;
  starred?: boolean;
  tokens?: string[];
  order?: number;
}): SuggestionItem {
  return {
    file: createFile(partial.path ?? "Notes/Diary.md", partial.stat),
    tags: partial.tags ?? [],
    aliases: partial.aliases ?? [],
    headers: [],
    links: [],
    frontMatter: partial.frontMatter,
    matchResults: partial.matchResults ?? [],
    phantom: partial.phantom ?? false,
    starred: partial.starred ?? false,
    tokens: partial.tokens ?? [],
    order: partial.order,
  };
}
