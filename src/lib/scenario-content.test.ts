// Guard tests over the real battle-card content in public/scenarios/ —
// they lock the normalized frontmatter schema and the padded-dir /
// un-padded-file asymmetry (card-01/battle_card_1.*).
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import {
  SCENARIO_COUNT,
  getScenario,
  listScenarios,
  scenarioSlug,
} from "./scenario-content";
import { SAA_C03_DOMAINS } from "./domains";

const PUBLIC_DIR = path.join(process.cwd(), "public");

describe("listScenarios", () => {
  const scenarios = listScenarios();

  it("loads all cards with unique, contiguous numbers 1..N", () => {
    expect(scenarios).toHaveLength(SCENARIO_COUNT);
    expect(scenarios.map((s) => s.nr)).toEqual(
      Array.from({ length: SCENARIO_COUNT }, (_, i) => i + 1),
    );
  });

  it("every meta is complete and mapped to canonical domain names", () => {
    for (const s of scenarios) {
      expect(s.title).not.toBe("");
      expect(s.services.length).toBeGreaterThan(0);
      expect(s.signalwords.length).toBeGreaterThan(0);
      expect(s.domainCodes.length).toBeGreaterThan(0);
      expect(s.domains).toHaveLength(s.domainCodes.length);
      for (const d of s.domains) {
        expect(SAA_C03_DOMAINS).toContain(d);
      }
      expect(s.slug).toMatch(/^\d{2}$/);
      expect(s.slug).toBe(scenarioSlug(s.nr));
    }
  });

  it("svg/pdf/png assets exist on disk for every card", () => {
    for (const s of scenarios) {
      for (const url of [s.svgUrl, s.pdfUrl, s.pngUrl]) {
        expect(fs.existsSync(path.join(PUBLIC_DIR, url)), url).toBe(true);
      }
    }
  });

  it("frontmatter carries no legacy domain keys (normalization guard)", () => {
    for (const s of scenarios) {
      const file = path.join(
        PUBLIC_DIR,
        "scenarios",
        `card-${s.slug}`,
        `battle_card_${s.nr}.md`,
      );
      const { data } = matter(fs.readFileSync(file, "utf8"));
      expect(data).not.toHaveProperty("domain");
      expect(data).not.toHaveProperty("domain_secondary");
      expect(data).not.toHaveProperty("domains_secondary");
    }
  });
});

describe("getScenario", () => {
  it("returns the body without the duplicated h1", () => {
    const scenario = getScenario("01");
    expect(scenario).not.toBeNull();
    expect(scenario!.body.startsWith("# ")).toBe(false);
    expect(scenario!.body).not.toBe("");
  });

  it("accepts only the zero-padded slug format", () => {
    expect(getScenario("1")).toBeNull();
    expect(getScenario("001")).toBeNull();
    expect(getScenario("00")).toBeNull();
    expect(getScenario("26")).toBeNull();
    expect(getScenario("25")).not.toBeNull();
  });
});
