// Guard: the category mapping must stay a PARTITION of the 137 SAA scripts —
// every script slug in exactly one category, no dead mapping entries, every
// category non-empty. Freezes the curated navigation metadata against both
// upstream script changes and mapping typos.
import { describe, expect, it } from "vitest";
import { loadSaaScripts } from "../db/seed/saa-scripts/index";
import {
  SAA_SCRIPT_CATEGORIES,
  SCRIPT_SLUGS_BY_CATEGORY,
} from "./saa-script-categories";

const scriptSlugs = new Set(loadSaaScripts().map((s) => s.slug));
const mappedSlugs = Object.values(SCRIPT_SLUGS_BY_CATEGORY).flat();

describe("SAA script category mapping", () => {
  it("has exactly the 10 approved categories, all non-empty", () => {
    expect(SAA_SCRIPT_CATEGORIES).toHaveLength(10);
    const keys = SAA_SCRIPT_CATEGORIES.map((c) => c.key);
    expect(Object.keys(SCRIPT_SLUGS_BY_CATEGORY).sort()).toEqual(
      [...keys].sort(),
    );
    for (const key of keys) {
      expect(
        SCRIPT_SLUGS_BY_CATEGORY[key].length,
        `category ${key}`,
      ).toBeGreaterThan(0);
    }
  });

  it("maps every script slug exactly once (no duplicates)", () => {
    expect(new Set(mappedSlugs).size).toBe(mappedSlugs.length);
    expect(mappedSlugs).toHaveLength(137);
  });

  it("has no orphan scripts and no dead mapping entries", () => {
    const mapped = new Set(mappedSlugs);
    const orphans = [...scriptSlugs].filter((s) => !mapped.has(s));
    const dead = mappedSlugs.filter((s) => !scriptSlugs.has(s));
    expect(orphans, "scripts without a category").toEqual([]);
    expect(dead, "mapping entries without a script").toEqual([]);
  });

  it("no service slug collides with the literal route segment 'kategorie'", () => {
    expect(scriptSlugs.has("kategorie")).toBe(false);
  });
});
