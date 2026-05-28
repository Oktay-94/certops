import { describe, expect, it } from "vitest";
import {
  LEARNING_TARGET,
  PERF_THRESHOLDS,
  scoreColorClass,
  scoreColorHex,
} from "./scoreColor";

describe("scoreColor constants", () => {
  it("exports threshold constants", () => {
    expect(PERF_THRESHOLDS.strong).toBe(0.75);
    expect(PERF_THRESHOLDS.weak).toBe(0.5);
    expect(LEARNING_TARGET).toBe(0.7);
  });
});

describe("scoreColorClass", () => {
  it("returns emerald at or above 0.75", () => {
    expect(scoreColorClass(0.75)).toBe("text-emerald-700");
    expect(scoreColorClass(1)).toBe("text-emerald-700");
  });

  it("returns amber between 0.5 (inclusive) and 0.75 (exclusive)", () => {
    expect(scoreColorClass(0.749)).toBe("text-amber-700");
    expect(scoreColorClass(0.5)).toBe("text-amber-700");
  });

  it("returns red below 0.5", () => {
    expect(scoreColorClass(0.499)).toBe("text-red-700");
    expect(scoreColorClass(0)).toBe("text-red-700");
  });
});

describe("scoreColorHex", () => {
  it("mirrors scoreColorClass thresholds", () => {
    expect(scoreColorHex(0.75)).toBe("#047857");
    expect(scoreColorHex(0.5)).toBe("#b45309");
    expect(scoreColorHex(0.499)).toBe("#b91c1c");
  });
});
