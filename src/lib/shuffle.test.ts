import { describe, it, expect } from "vitest";
import { mulberry32, seedFromString, shuffle } from "./shuffle";

describe("seedFromString", () => {
  it("is deterministic", () => {
    expect(seedFromString("hello:world")).toBe(seedFromString("hello:world"));
  });

  it("distinguishes similar inputs", () => {
    expect(seedFromString("session:1")).not.toBe(seedFromString("session:2"));
    expect(seedFromString("a")).not.toBe(seedFromString("b"));
  });

  it("returns a non-negative 32-bit integer", () => {
    const s = seedFromString("anything");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(0xffffffff);
    expect(Number.isInteger(s)).toBe(true);
  });
});

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b());
    }
  });

  it("produces values in [0, 1)", () => {
    const r = mulberry32(123);
    for (let i = 0; i < 50; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("returns identical order for the same seed", () => {
    const a = shuffle(items, 12345);
    const b = shuffle(items, 12345);
    expect(a).toEqual(b);
  });

  it("returns different order for different seeds", () => {
    const a = shuffle(items, 1);
    const b = shuffle(items, 2);
    expect(a).not.toEqual(b);
  });

  it("is a permutation of the input", () => {
    const out = shuffle(items, 99);
    expect(out.slice().sort((x, y) => x - y)).toEqual(items);
  });

  it("does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = input.slice();
    shuffle(input, 7);
    expect(input).toEqual(snapshot);
  });

  it("handles empty arrays", () => {
    expect(shuffle([], 1)).toEqual([]);
  });

  it("handles single-element arrays", () => {
    expect(shuffle(["x"], 1)).toEqual(["x"]);
  });
});
