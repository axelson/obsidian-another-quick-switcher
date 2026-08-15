import { describe, expect, test } from "@jest/globals";
import { jaxFuzzy } from "./jax-fuzzy";

describe("jaxFuzzy scoring correctness", () => {
  test("prefix match scores higher than mid-word match", () => {
    const prefix = jaxFuzzy("Quotes and Sayings", "quotes", false);
    const mid = jaxFuzzy("All Quotes", "quotes", false);

    expect(prefix).not.toBeNull();
    expect(mid).not.toBeNull();
    expect(prefix!.score).toBeGreaterThan(mid!.score);
  });

  test("word-boundary match scores higher than mid-word match", () => {
    const boundary = jaxFuzzy("Hawaii Power Ballot", "po", false);
    const midWord = jaxFuzzy("Baby Apophatic Prayer Analogy", "po", false);

    expect(boundary).not.toBeNull();
    expect(midWord).not.toBeNull();
    expect(boundary!.score).toBeGreaterThan(midWord!.score);
  });

  test("earlier match position scores higher than later", () => {
    const earlier = jaxFuzzy("All Quotes", "quotes", false);
    const later = jaxFuzzy("Funny Quotes", "quotes", false);

    expect(earlier).not.toBeNull();
    expect(later).not.toBeNull();
    expect(earlier!.score).toBeGreaterThan(later!.score);
  });

  test("consecutive match scores higher than spread match", () => {
    const consecutive = jaxFuzzy("abcde", "abc", false);
    const spread = jaxFuzzy("aXbXc", "abc", false);

    expect(consecutive).not.toBeNull();
    expect(spread).not.toBeNull();
    expect(consecutive!.score).toBeGreaterThan(spread!.score);
  });

  test("first character bonus applies", () => {
    const firstChar = jaxFuzzy("test file", "te", false);
    const notFirstChar = jaxFuzzy("a test file", "te", false);

    expect(firstChar).not.toBeNull();
    expect(notFirstChar).not.toBeNull();
    expect(firstChar!.score).toBeGreaterThan(notFirstChar!.score);
  });
});

describe("jaxFuzzy backward tightening", () => {
  test("prefers consecutive pair over spread match", () => {
    const result = jaxFuzzy("a___ab", "ab", false);

    expect(result).not.toBeNull();
    // Should match the consecutive "ab" at positions 4-5, not a(0)...b(4)
    expect(result!.ranges).toEqual([{ start: 4, end: 5 }]);
  });

  test("tightens spread match to consecutive when possible", () => {
    const result = jaxFuzzy("xyzabc", "abc", false);

    expect(result).not.toBeNull();
    expect(result!.ranges).toEqual([{ start: 3, end: 5 }]);
  });
});

describe("jaxFuzzy boundary detection", () => {
  test("space triggers word boundary bonus", () => {
    const boundary = jaxFuzzy("hello world", "w", false);
    const noBoundary = jaxFuzzy("helloworld", "w", false);

    expect(boundary).not.toBeNull();
    expect(noBoundary).not.toBeNull();
    expect(boundary!.score).toBeGreaterThan(noBoundary!.score);
  });

  test("hyphen triggers word boundary bonus", () => {
    const boundary = jaxFuzzy("hello-world", "w", false);
    const noBoundary = jaxFuzzy("helloXworld", "w", false);

    expect(boundary).not.toBeNull();
    expect(noBoundary).not.toBeNull();
    expect(boundary!.score).toBeGreaterThan(noBoundary!.score);
  });

  test("underscore triggers word boundary bonus", () => {
    const boundary = jaxFuzzy("hello_world", "w", false);
    const noBoundary = jaxFuzzy("helloXworld", "w", false);

    expect(boundary).not.toBeNull();
    expect(noBoundary).not.toBeNull();
    expect(boundary!.score).toBeGreaterThan(noBoundary!.score);
  });
});

describe("jaxFuzzy gap penalties", () => {
  test("gaps reduce score", () => {
    const noGap = jaxFuzzy("abc", "abc", false);
    const withGap = jaxFuzzy("aXbc", "abc", false);

    expect(noGap).not.toBeNull();
    expect(withGap).not.toBeNull();
    expect(noGap!.score).toBeGreaterThan(withGap!.score);
  });

  test("larger gaps reduce score more", () => {
    const smallGap = jaxFuzzy("aXbc", "abc", false);
    const largeGap = jaxFuzzy("aXXXXbc", "abc", false);

    expect(smallGap).not.toBeNull();
    expect(largeGap).not.toBeNull();
    expect(smallGap!.score).toBeGreaterThan(largeGap!.score);
  });
});

describe("jaxFuzzy edge cases", () => {
  test("empty query returns null", () => {
    expect(jaxFuzzy("test", "", false)).toBeNull();
  });

  test("query longer than text returns null", () => {
    expect(jaxFuzzy("ab", "abcdef", false)).toBeNull();
  });

  test("no match returns null", () => {
    expect(jaxFuzzy("abcde", "xyz", false)).toBeNull();
  });

  test("single character match works", () => {
    const result = jaxFuzzy("test", "t", false);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
    expect(result!.ranges).toEqual([{ start: 0, end: 0 }]);
  });

  test("exact full match works", () => {
    const result = jaxFuzzy("test", "test", false);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
    expect(result!.ranges).toEqual([{ start: 0, end: 3 }]);
  });

  test("case insensitive matching", () => {
    const result = jaxFuzzy("Hello World", "hello", false);
    expect(result).not.toBeNull();
    expect(result!.ranges).toEqual([{ start: 0, end: 4 }]);
  });

  test("diacritics normalization when enabled", () => {
    const result = jaxFuzzy("Café résumé", "cafe", true);
    expect(result).not.toBeNull();
    expect(result!.ranges).toEqual([{ start: 0, end: 3 }]);
  });

  test("score is always positive when matched", () => {
    const result = jaxFuzzy(
      "a very long string with lots of characters",
      "vl",
      false,
    );
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
  });
});

describe("jaxFuzzy emoji handling", () => {
  test("skips emoji and matches text after it", () => {
    const result = jaxFuzzy("📝memo", "memo", false);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
  });

  test("matches text with emoji in the middle", () => {
    const result = jaxFuzzy("hello😀world", "world", false);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
  });
});

describe("jaxFuzzy range output", () => {
  test("consecutive match produces single range", () => {
    const result = jaxFuzzy("abcde", "bcd", false);
    expect(result).not.toBeNull();
    expect(result!.ranges).toEqual([{ start: 1, end: 3 }]);
  });

  test("non-consecutive match produces multiple ranges", () => {
    const result = jaxFuzzy("abcde", "ace", false);
    expect(result).not.toBeNull();
    expect(result!.ranges).toHaveLength(3);
  });
});

describe("jaxFuzzy performance", () => {
  const generateTestData = (size: number): string[] => {
    const bases = [
      "file",
      "document",
      "note",
      "memo",
      "page",
      "article",
      "draft",
      "text",
      "project",
      "config",
      "data",
      "star",
      "idea",
      "list",
      "target",
      "report",
    ];
    const prefixes = [
      "Draft",
      "Final",
      "Review",
      "Archive",
      "Backup",
      "Import",
      "Export",
    ];
    const suffixes = [
      "v1",
      "v2",
      "backup",
      "old",
      "new",
      "temp",
      "final",
      "copy",
    ];

    const result: string[] = [];
    for (let i = 0; i < size; i++) {
      const base = bases[i % bases.length];
      const prefix = i % 3 === 0 ? `${prefixes[i % prefixes.length]} ` : "";
      const suffix = i % 4 === 0 ? ` ${suffixes[i % suffixes.length]}` : "";
      result.push(`${prefix}${base}${suffix}`);
    }
    return result;
  };

  // 2x smartMicroFuzzy thresholds
  const PERFORMANCE_THRESHOLDS = {
    small: 40, // 100 notes
    medium: 120, // 1000 notes
    large: 300, // 10000 notes
  };

  const measurePerformance = (fn: () => void, iterations: number): number => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    return performance.now() - start;
  };

  describe.each([
    { name: "small", size: 100, iterations: 10 },
    { name: "medium", size: 1000, iterations: 10 },
    { name: "large", size: 10000, iterations: 10 },
  ])("$name dataset ($size items)", ({ name, size, iterations }) => {
    const testData = generateTestData(size);

    test(`performance should be under ${PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS]}ms`, () => {
      const query = "test";
      const executionTime = measurePerformance(() => {
        for (const data of testData) {
          jaxFuzzy(data, query, false);
        }
      }, iterations);

      const threshold =
        PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
      expect(executionTime).toBeLessThan(threshold);
    });
  });
});
