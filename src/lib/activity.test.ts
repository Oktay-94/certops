import { describe, expect, it } from "vitest";
import {
  addDays,
  bucketByDay,
  computeStreak,
  dayKey,
  heatLevel,
  weeksGrid,
} from "./activity";

describe("dayKey / bucketByDay (Europe/Berlin)", () => {
  it("buckets a late-UTC attempt into the NEXT Berlin day (CEST edge)", () => {
    // 2026-07-11T23:30Z = 2026-07-12 01:30 CEST
    const late = new Date("2026-07-11T23:30:00Z");
    expect(dayKey(late)).toBe("2026-07-12");
  });

  it("winter (CET, +1): 23:30Z rolls over, 22:30Z does not", () => {
    expect(dayKey(new Date("2026-01-10T23:30:00Z"))).toBe("2026-01-11");
    expect(dayKey(new Date("2026-01-10T22:30:00Z"))).toBe("2026-01-10");
  });

  it("counts per day", () => {
    const buckets = bucketByDay([
      new Date("2026-07-10T08:00:00Z"),
      new Date("2026-07-10T09:00:00Z"),
      new Date("2026-07-11T23:30:00Z"), // → 07-12 in Berlin
    ]);
    expect(buckets.get("2026-07-10")).toBe(2);
    expect(buckets.get("2026-07-12")).toBe(1);
    expect(buckets.get("2026-07-11")).toBeUndefined();
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("computeStreak", () => {
  const today = new Date("2026-07-12T10:00:00Z"); // Berlin: 2026-07-12

  it("counts consecutive days ending today", () => {
    const days = new Set(["2026-07-10", "2026-07-11", "2026-07-12"]);
    expect(computeStreak(days, today)).toBe(3);
  });

  it("today inactive → streak still alive from yesterday", () => {
    const days = new Set(["2026-07-10", "2026-07-11"]);
    expect(computeStreak(days, today)).toBe(2);
  });

  it("gap yesterday → streak 0 when today inactive", () => {
    const days = new Set(["2026-07-09", "2026-07-10"]);
    expect(computeStreak(days, today)).toBe(0);
  });
});

describe("heatLevel", () => {
  it("maps mockup thresholds, zero stays 0", () => {
    expect(heatLevel(0, 10)).toBe(0);
    expect(heatLevel(1, 10)).toBe(1); // 0.1
    expect(heatLevel(6, 10)).toBe(2); // 0.6
    expect(heatLevel(8, 10)).toBe(3); // 0.8
    expect(heatLevel(9, 10)).toBe(4); // 0.9
    expect(heatLevel(3, 0)).toBe(0); // no max → all zero
  });
});

describe("weeksGrid", () => {
  it("26 Monday-start columns ending in the current week", () => {
    const grid = weeksGrid(new Date("2026-07-12T10:00:00Z")); // Sunday in Berlin
    expect(grid).toHaveLength(26);
    for (const week of grid) expect(week).toHaveLength(7);
    const lastWeek = grid[25]!;
    expect(lastWeek[0]).toBe("2026-07-06"); // Monday
    expect(lastWeek[6]).toBe("2026-07-12"); // today = Sunday
    // continuous: first day of week n+1 = last day of week n + 1
    expect(grid[24]![6]).toBe(addDays(lastWeek[0]!, -1));
  });
});
