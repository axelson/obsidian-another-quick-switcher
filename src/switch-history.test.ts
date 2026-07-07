import { describe, expect, test } from "@jest/globals";
import {
  countsWithinWindow,
  pruneSwitchHistory,
  recordSwitch,
  removePath,
  renamePath,
} from "./switch-history";

const DAY = 24 * 60 * 60 * 1000;

describe("recordSwitch", () => {
  test("appends a timestamp for a new path", () => {
    expect(recordSwitch({}, "a.md", 100)).toEqual({ "a.md": [100] });
  });

  test("appends to existing timestamps", () => {
    expect(recordSwitch({ "a.md": [100] }, "a.md", 200)).toEqual({
      "a.md": [100, 200],
    });
  });

  test("caps timestamps at 50, dropping the oldest", () => {
    const timestamps = [];
    for (let i = 1; i <= 50; i++) {
      timestamps.push(i);
    }
    const actual = recordSwitch({ "a.md": timestamps }, "a.md", 51);
    expect(actual["a.md"]).toHaveLength(50);
    expect(actual["a.md"][0]).toBe(2);
    expect(actual["a.md"][49]).toBe(51);
  });
});

describe("countsWithinWindow", () => {
  test("counts only timestamps within the window", () => {
    const now = 100 * DAY;
    const history = {
      "a.md": [now - 100 * DAY, now - 31 * DAY, now - 29 * DAY, now - 1 * DAY],
      "b.md": [now - 5 * DAY],
    };
    expect(countsWithinWindow(history, 30, now)).toEqual({
      "a.md": 2,
      "b.md": 1,
    });
  });

  test("omits paths with no timestamps within the window", () => {
    const now = 100 * DAY;
    expect(countsWithinWindow({ "a.md": [now - 90 * DAY] }, 30, now)).toEqual(
      {},
    );
  });

  test("counts all history when windowDays is 0 or negative", () => {
    const now = 100 * DAY;
    const history = { "a.md": [now - 90 * DAY, now - 1 * DAY] };
    expect(countsWithinWindow(history, 0, now)).toEqual({ "a.md": 2 });
  });
});

describe("pruneSwitchHistory", () => {
  test("keeps all timestamps when windowDays is 0 or negative", () => {
    const now = 100 * DAY;
    const history = { "a.md": [now - 90 * DAY, now - 1 * DAY] };
    expect(pruneSwitchHistory(history, 0, now)).toEqual(history);
  });

  test("drops stale timestamps and empty entries", () => {
    const now = 100 * DAY;
    const history = {
      "a.md": [now - 40 * DAY, now - 10 * DAY],
      "b.md": [now - 90 * DAY],
    };
    expect(pruneSwitchHistory(history, 30, now)).toEqual({
      "a.md": [now - 10 * DAY],
    });
  });
});

describe("renamePath", () => {
  test("moves timestamps to the new path", () => {
    expect(renamePath({ "a.md": [1, 2] }, "a.md", "b.md")).toEqual({
      "b.md": [1, 2],
    });
  });

  test("returns history unchanged when the old path is unknown", () => {
    const history = { "a.md": [1] };
    expect(renamePath(history, "x.md", "y.md")).toBe(history);
  });
});

describe("removePath", () => {
  test("drops the entry", () => {
    expect(removePath({ "a.md": [1], "b.md": [2] }, "a.md")).toEqual({
      "b.md": [2],
    });
  });

  test("returns history unchanged when the path is unknown", () => {
    const history = { "a.md": [1] };
    expect(removePath(history, "x.md")).toBe(history);
  });
});
