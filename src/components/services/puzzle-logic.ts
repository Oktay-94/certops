// Pure, testable Puzzle logic — no React, no persistence, no progress.
// Separate module: quiz-logic.ts AND battle-logic.ts stay untouched. A small
// shortDescription helper is duplicated here on purpose to keep the modules
// independent rather than coupling Puzzle to Battle internals.
import type { ServiceCard } from "@/lib/services-data";

export type PuzzlePair = {
  num: number; // service id — the match key (term.num === description.num)
  term: string; // service name (the draggable)
  description: string; // shortened explanation (the drop target)
  domain: string;
};

export type PuzzleRound = { pairs: PuzzlePair[] };

export type PuzzleVariant =
  | { kind: "mixed" }
  | { kind: "category"; groupId: string };

// One finished round, for scoring.
export type RoundResult = { size: number; misactions: number };

export type PuzzleSummary = {
  roundsPlayed: number;
  immediate: number; // rounds solved with 0 wrong drops
  withErrors: number; // rounds solved with >= 1 wrong drop
  misactions: number; // total wrong drops
};

export type CategoryGroup = {
  id: string;
  label: string;
  categories: string[]; // app category names that map into this group
};

// 12 app categories → 10 puzzle groups. Nine stand alone; DevOps + Migration +
// IoT (10 + 10 + 4 = 24) share one group so no group is too small.
export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: "compute", label: "Compute", categories: ["Compute"] },
  { id: "storage", label: "Storage", categories: ["Storage"] },
  { id: "datenbanken", label: "Datenbanken", categories: ["Datenbanken"] },
  { id: "netzwerk", label: "Netzwerk", categories: ["Netzwerk"] },
  { id: "sicherheit", label: "Sicherheit", categories: ["Sicherheit"] },
  { id: "management", label: "Management", categories: ["Management"] },
  { id: "analytik", label: "Analytik", categories: ["Analytik"] },
  { id: "mlki", label: "MLKI", categories: ["MLKI"] },
  { id: "integration", label: "Integration", categories: ["Integration"] },
  {
    id: "betrieb",
    label: "DevOps, Migration & IoT",
    categories: ["DevOps", "Migration", "IoT"],
  },
];

const MIXED_ROUNDS = 10;
const MIXED_PER_ROUND = 7;
const MAX_PER_ROUND = 7;
const DESC_MAX = 180;

function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// First sentence / first line capped at ~180 chars (mirrors Battle Cards so the
// descriptions read the same). Kept local — see file header.
export function shortDescription(text: string): string {
  const firstLine = text.split("\n")[0].trim();
  const sentence = firstLine.match(/^.*?[.!?](?=\s|$)/);
  let out = sentence ? sentence[0] : firstLine;
  if (out.length > DESC_MAX) {
    const slice = out.slice(0, DESC_MAX);
    const cut = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
    );
    out = cut > 40 ? slice.slice(0, cut + 1) : `${slice.trimEnd()}…`;
  }
  return out.trim();
}

function toPair(c: ServiceCard): PuzzlePair {
  return {
    num: c.num,
    term: c.title,
    description: shortDescription(c.core),
    domain: c.domain,
  };
}

/**
 * Split `n` items into rounds of ~5–7. rounds = ceil(n/7), sizes as even as
 * possible. All groups land in 5–7 except Analytik (9 → 5,4): a single round
 * may dip to 4 when the group can't divide evenly any other way.
 */
export function roundSizes(n: number): number[] {
  if (n <= 0) return [];
  const rounds = Math.ceil(n / MAX_PER_ROUND);
  const base = Math.floor(n / rounds);
  const rem = n % rounds;
  return Array.from({ length: rounds }, (_, i) => base + (i < rem ? 1 : 0));
}

function chunkBySizes<T>(items: readonly T[], sizes: number[]): T[][] {
  const out: T[][] = [];
  let idx = 0;
  for (const size of sizes) {
    out.push(items.slice(idx, idx + size));
    idx += size;
  }
  return out;
}

// "Alle gemischt": 10 rounds × 7 random services from all 172, unique across the
// whole session (so no service repeats within OR across rounds).
export function buildMixedRounds(all: readonly ServiceCard[]): PuzzleRound[] {
  const picked = shuffle(all).slice(0, MIXED_ROUNDS * MIXED_PER_ROUND);
  return chunkBySizes(picked, roundSizes(picked.length)).map((cards) => ({
    pairs: cards.map(toPair),
  }));
}

// One category group split into balanced rounds covering every service once.
export function buildCategoryRounds(
  all: readonly ServiceCard[],
  groupId: string,
): PuzzleRound[] {
  const group = CATEGORY_GROUPS.find((g) => g.id === groupId);
  if (!group) return [];
  const inGroup = shuffle(all.filter((c) => group.categories.includes(c.domain)));
  return chunkBySizes(inGroup, roundSizes(inGroup.length)).map((cards) => ({
    pairs: cards.map(toPair),
  }));
}

export function buildRounds(
  all: readonly ServiceCard[],
  variant: PuzzleVariant,
): PuzzleRound[] {
  return variant.kind === "mixed"
    ? buildMixedRounds(all)
    : buildCategoryRounds(all, variant.groupId);
}

// A drop is correct iff the dragged term and the target description belong to
// the same service.
export function isCorrectMatch(termNum: number, descriptionNum: number): boolean {
  return termNum === descriptionNum;
}

export function summarizePuzzle(
  results: readonly RoundResult[],
): PuzzleSummary {
  const roundsPlayed = results.length;
  const withErrors = results.filter((r) => r.misactions > 0).length;
  const misactions = results.reduce((s, r) => s + r.misactions, 0);
  return {
    roundsPlayed,
    immediate: roundsPlayed - withErrors,
    withErrors,
    misactions,
  };
}
