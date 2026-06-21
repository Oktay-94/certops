import { describe, expect, it } from "vitest";
import { SERVICES } from "@/lib/services-data";
import {
  buildBattle,
  buildQuestion,
  noteSiblings,
  pickDistractors,
  shortExplanation,
  summarize,
  type BattleResult,
  type Difficulty,
} from "./battle-logic";

const ALL = SERVICES;
const byNum = new Map(ALL.map((s) => [s.num, s]));
const domainOf = (num: number | null) => (num == null ? null : byNum.get(num)!.domain);

describe("buildBattle", () => {
  it("draws 50 of 172 with no service twice per round", () => {
    const qs = buildBattle(ALL, 1, 50);
    expect(qs).toHaveLength(50);
    const nums = qs.map((q) => q.card.num);
    expect(new Set(nums).size).toBe(50);
  });
});

describe("buildQuestion — invariants across all 172 × 3 difficulties", () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: 4 options, exactly 1 correct, pairwise-distinct, shortened`, () => {
      for (const card of ALL) {
        const q = buildQuestion(card, difficulty, ALL);
        expect(q.options).toHaveLength(4);
        expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
        const texts = q.options.map((o) => o.text);
        expect(new Set(texts).size).toBe(4); // pairwise distinct
        for (const t of texts) {
          expect(t.length).toBeLessThanOrEqual(185);
          expect(t.includes("\n")).toBe(false);
          expect(t).toBe(shortExplanation(t)); // already shortened / idempotent
        }
      }
    });
  }
});

describe("pickDistractors — always exactly 3 (incl. IoT, only 4 services)", () => {
  for (const difficulty of [1, 2, 3] as Difficulty[]) {
    it(`difficulty ${difficulty}: every service yields 3 distractors`, () => {
      for (const card of ALL) {
        expect(pickDistractors(card, difficulty, ALL)).toHaveLength(3);
      }
    });
  }

  it("IoT services (4 total) do not crash and stay valid in every difficulty", () => {
    const iot = ALL.filter((s) => s.domain === "IoT");
    expect(iot.length).toBe(4);
    for (const card of iot) {
      for (const difficulty of [1, 2, 3] as Difficulty[]) {
        const q = buildQuestion(card, difficulty, ALL);
        expect(q.options).toHaveLength(4);
        expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
      }
    }
  });
});

describe("Stufe 1 (leicht) — all 3 distractors cross-domain", () => {
  it("no distractor shares X's category, all are explanations", () => {
    for (const card of ALL) {
      const ds = pickDistractors(card, 1, ALL);
      for (const d of ds) {
        expect(d.kind).toBe("explanation");
        expect(domainOf(d.sourceNum)).not.toBe(card.domain);
      }
    }
  });
});

describe("Stufe 2 (mittel) — curated + 2 same-category", () => {
  it("exactly one curated distractor; explanation distractors are same-category", () => {
    for (const card of ALL) {
      const ds = pickDistractors(card, 2, ALL);
      expect(ds.filter((d) => d.kind === "curated")).toHaveLength(1);
      for (const d of ds.filter((d) => d.kind === "explanation")) {
        expect(domainOf(d.sourceNum)).toBe(card.domain);
      }
    }
  });
});

describe("Stufe 3 (schwer) — note siblings, then same-category fallback", () => {
  it("every distractor is a note-sibling or same-category", () => {
    for (const card of ALL) {
      const sibNums = new Set(noteSiblings(card, ALL).map((s) => s.num));
      for (const d of pickDistractors(card, 3, ALL)) {
        const isSibling = d.sourceNum != null && sibNums.has(d.sourceNum);
        const isSameCat = domainOf(d.sourceNum) === card.domain;
        expect(isSibling || isSameCat).toBe(true);
      }
    }
  });

  it("a service with >=3 note siblings sources all distractors from them", () => {
    const rich = ALL.find((s) => noteSiblings(s, ALL).length >= 3);
    expect(rich).toBeDefined();
    const sibNums = new Set(noteSiblings(rich!, ALL).map((s) => s.num));
    for (const d of pickDistractors(rich!, 3, ALL)) {
      expect(d.sourceNum != null && sibNums.has(d.sourceNum)).toBe(true);
    }
  });

  it("the fallback fills cleanly for a service with too few note siblings", () => {
    const lean = ALL.find((s) => noteSiblings(s, ALL).length < 3);
    expect(lean).toBeDefined();
    expect(pickDistractors(lean!, 3, ALL)).toHaveLength(3);
  });
});

describe("noteSiblings — word-bounded, no substring false positives", () => {
  it("never returns the service itself", () => {
    for (const card of ALL) {
      expect(noteSiblings(card, ALL).some((s) => s.num === card.num)).toBe(false);
    }
  });

  it("matches whole-token aliases only (\\bEC2\\b not inside another word)", () => {
    // Synthetic note: 'EC2' as a token must match; embedded must not.
    const ec2 = ALL.find((s) => s.title === "Amazon EC2");
    expect(ec2).toBeDefined();
    const withToken = { ...ec2!, num: 9991, hint: "Vergleiche mit EC2 Kaufoptionen." };
    const withEmbedded = { ...ec2!, num: 9992, hint: "Der Wert XEC2Y ist kein Dienst." };
    expect(noteSiblings(withToken, ALL).some((s) => s.title === "Amazon EC2")).toBe(true);
    expect(noteSiblings(withEmbedded, ALL).some((s) => s.title === "Amazon EC2")).toBe(false);
  });
});

describe("summarize — accuracy and average-time maths", () => {
  it("computes counts, accuracy % and avg time (timeouts count as wrong)", () => {
    const results: BattleResult[] = [
      { card: ALL[0], correct: true, timedOut: false, timeSec: 10 },
      { card: ALL[1], correct: true, timedOut: false, timeSec: 20 },
      { card: ALL[2], correct: false, timedOut: false, timeSec: 30 },
      { card: ALL[3], correct: false, timedOut: true, timeSec: 60 },
    ];
    const s = summarize(results);
    expect(s).toEqual({
      total: 4,
      correct: 2,
      wrong: 2,
      accuracyPct: 50,
      avgTimeSec: 30, // (10+20+30+60)/4
    });
  });

  it("empty round is zeroed, not NaN", () => {
    expect(summarize([])).toEqual({
      total: 0,
      correct: 0,
      wrong: 0,
      accuracyPct: 0,
      avgTimeSec: 0,
    });
  });
});
