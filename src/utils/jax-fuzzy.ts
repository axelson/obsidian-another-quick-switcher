import diacriticsMap from "./diacritics-map";

type Range = { start: number; end: number };

export type JaxFuzzyResult = {
  score: number;
  ranges: Range[];
};

const SCORE_BASE = 1;
const BONUS_CONSECUTIVE = 4;
const BONUS_FIRST_CHAR = 8;
const BONUS_BOUNDARY = 6;
const BONUS_POSITION_MAX = 3;
const PENALTY_GAP_START = -2;
const PENALTY_GAP_EXTENSION = -1;

function isEmoji(text: string, pos: number): boolean {
  const ch = text.charCodeAt(pos);
  if (
    (ch >= 0x2700 && ch <= 0x27bf) ||
    (ch >= 0xe000 && ch <= 0xf8ff) ||
    (ch >= 0x2011 && ch <= 0x26ff) ||
    (ch >= 0xfe0e && ch <= 0xfe0f)
  ) {
    return true;
  }
  if (ch >= 0xd83c && ch <= 0xd83e) {
    return true;
  }
  return false;
}

function emojiLength(text: string, pos: number): number {
  const ch = text.charCodeAt(pos);
  if (ch >= 0xd83c && ch <= 0xd83e) {
    return 2; // surrogate pair
  }
  return 1;
}

function isSeparator(ch: string): boolean {
  return ch === " " || ch === "-" || ch === "_";
}

function normalize(str: string, isNormalizeAccentsDiacritics: boolean): string {
  const t = str.toLowerCase();
  if (!isNormalizeAccentsDiacritics) {
    return t;
  }
  return t.replace(/[^ -~]/g, (x) => diacriticsMap[x] ?? x);
}

function scoreAlignment(
  text: string,
  matchPositions: number[],
  textLen: number,
): number {
  let total = 0;
  let prevMatchPos = -2;

  for (let i = 0; i < matchPositions.length; i++) {
    const pos = matchPositions[i];

    total += SCORE_BASE;

    if (pos === 0) {
      total += BONUS_FIRST_CHAR;
    } else if (isSeparator(text[pos - 1])) {
      total += BONUS_BOUNDARY;
    }

    if (prevMatchPos === pos - 1) {
      total += BONUS_CONSECUTIVE;
    }

    total += BONUS_POSITION_MAX * (1 - pos / textLen);

    if (i > 0 && prevMatchPos !== pos - 1) {
      const gapSize = pos - prevMatchPos - 1;
      total += PENALTY_GAP_START + PENALTY_GAP_EXTENSION * (gapSize - 1);
    }

    prevMatchPos = pos;
  }

  return total;
}

/**
 * Fuzzy match with quality-aware scoring.
 *
 * Keeps spaces in text for natural word-boundary detection.
 * Skips emoji characters during scan (ranges map directly to original coordinates).
 * Uses greedy forward scan + backward tightening pass.
 */
export function jaxFuzzy(
  text: string,
  query: string,
  isNormalizeAccentsDiacritics: boolean,
): JaxFuzzyResult | null {
  const normalizedText = normalize(text, isNormalizeAccentsDiacritics);
  const normalizedQuery = normalize(
    query,
    isNormalizeAccentsDiacritics,
  ).replace(/ /g, "");

  if (normalizedQuery.length === 0) {
    return null;
  }

  const textLen = normalizedText.length;
  const queryLen = normalizedQuery.length;

  // Forward pass: greedy scan to find if a match exists
  const forwardPositions: number[] = [];
  let qi = 0;

  for (let ti = 0; ti < textLen && qi < queryLen; ti++) {
    if (isEmoji(normalizedText, ti)) {
      ti += emojiLength(normalizedText, ti) - 1;
      continue;
    }
    if (normalizedText[ti] === normalizedQuery[qi]) {
      forwardPositions.push(ti);
      qi++;
    }
  }

  if (qi !== queryLen) {
    return null;
  }

  // Backward pass: tighten the alignment from the last matched position
  const backwardPositions: number[] = new Array(queryLen);
  qi = queryLen - 1;
  const lastForwardPos = forwardPositions[forwardPositions.length - 1];

  for (let ti = lastForwardPos; ti >= 0 && qi >= 0; ti--) {
    if (isEmoji(normalizedText, ti)) {
      continue;
    }
    if (normalizedText[ti] === normalizedQuery[qi]) {
      backwardPositions[qi] = ti;
      qi--;
    }
  }

  // Score both alignments, pick the better one
  const forwardScore = scoreAlignment(
    normalizedText,
    forwardPositions,
    textLen,
  );
  const backwardScore = scoreAlignment(
    normalizedText,
    backwardPositions,
    textLen,
  );

  const bestPositions =
    backwardScore > forwardScore ? backwardPositions : forwardPositions;
  const bestScore = Math.max(forwardScore, backwardScore);

  const finalScore = Math.max(0, bestScore) / queryLen;

  if (finalScore <= 0) {
    return null;
  }

  // Convert positions to ranges (merge consecutive positions)
  const ranges: Range[] = [];
  let rangeStart = bestPositions[0];
  let rangeEnd = bestPositions[0];

  for (let i = 1; i < bestPositions.length; i++) {
    if (bestPositions[i] === rangeEnd + 1) {
      rangeEnd = bestPositions[i];
    } else {
      ranges.push({ start: rangeStart, end: rangeEnd });
      rangeStart = bestPositions[i];
      rangeEnd = bestPositions[i];
    }
  }
  ranges.push({ start: rangeStart, end: rangeEnd });

  return { score: finalScore, ranges };
}
