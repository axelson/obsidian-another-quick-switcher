import { loadJson, saveJson } from "./apputils/io";

// Recent switch timestamps (epoch millis, newest last) per file path
export type SwitchHistory = { [path: string]: number[] };

export const DEFAULT_SWITCH_HISTORY_PATH =
  ".obsidian/plugins/obsidian-another-quick-switcher/switch-history.json";

const MAX_TIMESTAMPS_PER_FILE = 50;

export async function loadSwitchHistory(path: string): Promise<SwitchHistory> {
  try {
    return (await loadJson<SwitchHistory>(path)) ?? {};
  } catch (e) {
    // A corrupt file (crash mid-write, sync conflict) should not disable tracking
    console.error(`[another-quick-switcher] Failed to load ${path}`, e);
    return {};
  }
}

export async function saveSwitchHistory(
  path: string,
  history: SwitchHistory,
): Promise<void> {
  await saveJson(path, history, { overwrite: true });
}

// Serializes load-modify-save cycles: Obsidian fires rename/delete per file
// (a folder rename emits N events), and concurrent cycles would lose updates.
let updateQueue: Promise<unknown> = Promise.resolve();

export function updateSwitchHistory(
  historyPath: string,
  update: (history: SwitchHistory) => SwitchHistory,
): Promise<void> {
  const run = async () => {
    const history = await loadSwitchHistory(historyPath);
    const updated = update(history);
    if (updated !== history) {
      await saveSwitchHistory(historyPath, updated);
    }
  };
  const p = updateQueue.then(run, run).catch((e) => {
    console.error(
      `[another-quick-switcher] Failed to update ${historyPath}`,
      e,
    );
  });
  updateQueue = p;
  return p;
}

export async function fetchSwitchCounts(
  historyPath: string,
  windowDays: number,
): Promise<{ [path: string]: number }> {
  const history = await loadSwitchHistory(historyPath);
  return countsWithinWindow(history, windowDays, Date.now());
}

export function persistSwitch(
  historyPath: string,
  filePath: string,
  windowDays: number,
): Promise<void> {
  const now = Date.now();
  return updateSwitchHistory(historyPath, (history) =>
    pruneSwitchHistory(recordSwitch(history, filePath, now), windowDays, now),
  );
}

export function recordSwitch(
  history: SwitchHistory,
  filePath: string,
  now: number,
): SwitchHistory {
  const timestamps = [...(history[filePath] ?? []), now].slice(
    -MAX_TIMESTAMPS_PER_FILE,
  );
  return { ...history, [filePath]: timestamps };
}

export function countsWithinWindow(
  history: SwitchHistory,
  windowDays: number,
  now: number,
): { [path: string]: number } {
  // windowDays <= 0 means no window: count all history
  const threshold =
    windowDays > 0
      ? now - windowDays * 24 * 60 * 60 * 1000
      : Number.NEGATIVE_INFINITY;
  const counts: { [path: string]: number } = {};
  for (const path of Object.keys(history)) {
    const count = history[path].filter((x) => x >= threshold).length;
    if (count > 0) {
      counts[path] = count;
    }
  }
  return counts;
}

export function pruneSwitchHistory(
  history: SwitchHistory,
  windowDays: number,
  now: number,
): SwitchHistory {
  // windowDays <= 0 means no window: keep all timestamps
  const threshold =
    windowDays > 0
      ? now - windowDays * 24 * 60 * 60 * 1000
      : Number.NEGATIVE_INFINITY;
  const pruned: SwitchHistory = {};
  for (const path of Object.keys(history)) {
    const recent = history[path].filter((x) => x >= threshold);
    if (recent.length > 0) {
      pruned[path] = recent;
    }
  }
  return pruned;
}

export function renamePath(
  history: SwitchHistory,
  oldPath: string,
  newPath: string,
): SwitchHistory {
  if (!history[oldPath]) {
    return history;
  }
  const { [oldPath]: timestamps, ...rest } = history;
  return { ...rest, [newPath]: timestamps };
}

export function removePath(
  history: SwitchHistory,
  path: string,
): SwitchHistory {
  if (!history[path]) {
    return history;
  }
  const { [path]: _, ...rest } = history;
  return rest;
}
