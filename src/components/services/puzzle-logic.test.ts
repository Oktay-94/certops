import { describe, expect, it } from "vitest";
import { SERVICES } from "@/lib/services-data";
import {
  buildCategoryRounds,
  buildMixedRounds,
  CATEGORY_GROUPS,
  isCorrectMatch,
  roundSizes,
  shortDescription,
  summarizePuzzle,
  type PuzzleRound,
  type RoundResult,
} from "./puzzle-logic";

const ALL = SERVICES;
const flat = (rounds: PuzzleRound[]) => rounds.flatMap((r) => r.pairs);

describe("roundSizes — balanced 5–7, only Analytik(9) may dip to 4", () => {
  it("splits each group size as planned", () => {
    expect(roundSizes(15)).toEqual([5, 5, 5]);
    expect(roundSizes(13)).toEqual([7, 6]);
    expect(roundSizes(21)).toEqual([7, 7, 7]);
    expect(roundSizes(29)).toEqual([6, 6, 6, 6, 5]);
    expect(roundSizes(9)).toEqual([5, 4]); // Analytik
    expect(roundSizes(24)).toEqual([6, 6, 6, 6]);
    expect(roundSizes(7)).toEqual([7]);
  });

  it("always covers everything and stays within 4–7 (n = 4..30)", () => {
    for (let n = 4; n <= 30; n++) {
      const sizes = roundSizes(n);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(n);
      for (const s of sizes) {
        expect(s).toBeGreaterThanOrEqual(4);
        expect(s).toBeLessThanOrEqual(7);
      }
    }
  });

  it("for the real group sizes, at most one round dips below 5 (Analytik)", () => {
    const groupSizes = CATEGORY_GROUPS.map(
      (g) => SERVICES.filter((s) => g.categories.includes(s.domain)).length,
    );
    for (const n of groupSizes) {
      expect(roundSizes(n).filter((s) => s < 5).length).toBeLessThanOrEqual(1);
    }
  });
});

describe("buildMixedRounds — 10×7 of 172, no service twice", () => {
  it("yields 10 rounds of 7, all 70 distinct", () => {
    const rounds = buildMixedRounds(ALL);
    expect(rounds).toHaveLength(10);
    for (const r of rounds) expect(r.pairs).toHaveLength(7);
    const nums = flat(rounds).map((p) => p.num);
    expect(nums).toHaveLength(70);
    expect(new Set(nums).size).toBe(70); // unique within AND across rounds
  });
});

describe("category groups — 12 → 10 mapping", () => {
  it("has 10 groups covering all 12 app categories exactly once", () => {
    expect(CATEGORY_GROUPS).toHaveLength(10);
    const cats = CATEGORY_GROUPS.flatMap((g) => g.categories);
    expect(new Set(cats).size).toBe(cats.length); // no category in two groups
    const appCats = new Set(ALL.map((s) => s.domain));
    expect(new Set(cats)).toEqual(appCats);
  });

  it("DevOps + Migration + IoT share one group of 24", () => {
    const betrieb = CATEGORY_GROUPS.find((g) => g.id === "betrieb")!;
    expect(betrieb.categories.sort()).toEqual(["DevOps", "IoT", "Migration"]);
    expect(flat(buildCategoryRounds(ALL, "betrieb"))).toHaveLength(24);
  });

  it("each group splits fully, no service twice, every round 4–7", () => {
    for (const g of CATEGORY_GROUPS) {
      const rounds = buildCategoryRounds(ALL, g.id);
      const groupServices = ALL.filter((s) => g.categories.includes(s.domain));
      const nums = flat(rounds).map((p) => p.num);
      expect(nums).toHaveLength(groupServices.length); // complete coverage
      expect(new Set(nums).size).toBe(groupServices.length); // no dup
      for (const r of rounds) {
        expect(r.pairs.length).toBeGreaterThanOrEqual(4);
        expect(r.pairs.length).toBeLessThanOrEqual(7);
      }
    }
  });

  it("Analytik (smallest standalone, 9) does not crash and splits to 5,4", () => {
    const rounds = buildCategoryRounds(ALL, "analytik");
    expect(flat(rounds)).toHaveLength(9);
    expect(rounds.map((r) => r.pairs.length)).toEqual([5, 4]);
  });
});

describe("pairs — term ↔ its own (shortened) explanation; validation", () => {
  it("each pair maps a service to its own shortened explanation", () => {
    const round = buildMixedRounds(ALL)[0];
    for (const p of round.pairs) {
      const card = ALL.find((s) => s.num === p.num)!;
      expect(p.term).toBe(card.title);
      expect(p.description).toBe(shortDescription(card.core));
    }
  });

  it("isCorrectMatch is true only for same-service term/description", () => {
    expect(isCorrectMatch(5, 5)).toBe(true);
    expect(isCorrectMatch(5, 6)).toBe(false);
  });
});

describe("summarizePuzzle — immediate / with-errors / misactions", () => {
  it("counts rounds and totals misactions; 0-error rounds are 'immediate'", () => {
    const results: RoundResult[] = [
      { size: 7, misactions: 0 },
      { size: 7, misactions: 3 },
      { size: 5, misactions: 0 },
      { size: 4, misactions: 1 },
    ];
    expect(summarizePuzzle(results)).toEqual({
      roundsPlayed: 4,
      immediate: 2,
      withErrors: 2,
      misactions: 4,
    });
  });

  it("empty session is zeroed", () => {
    expect(summarizePuzzle([])).toEqual({
      roundsPlayed: 0,
      immediate: 0,
      withErrors: 0,
      misactions: 0,
    });
  });
});
