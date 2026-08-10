// Guard tests over the real battle-card content in public/scenarios/ —
// they lock the normalized frontmatter schema and the padded-dir /
// un-padded-file asymmetry (card-01/battle_card_1.*).
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import {
  NARRATIVE_SECTION_KEYS,
  SCENARIO_COUNT,
  classifySection,
  getScenario,
  listScenarios,
  readNarrative,
  scenarioSlug,
  splitScenarioBody,
} from "./scenario-content";
import { parseHeadings } from "./skript-content";
import { SAA_C03_DOMAINS } from "./domains";
import { clfC02Questions } from "../db/seed/index";
import { clfC02QuestionsBatch2 } from "../db/seed/questions/index";
import { clfC02QuestionsBatch3 } from "../db/seed/questions/index-batch3";
import { clfC02Flashcards } from "../db/seed/cards/index";
import { saaC03Flashcards, saaC03Questions } from "../db/seed/saa/index";
import { loadSaaScripts } from "../db/seed/saa-scripts/index";

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
      expect(s.slug).toMatch(/^\d{2,3}$/);
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

  it("multi-domain cards appear under every one of their domains (filter invariant)", () => {
    // ScenarioGrid filters via s.domains.includes(domain) — a card counts
    // once per domain it belongs to, so the per-domain totals overlap.
    const perDomain = SAA_C03_DOMAINS.map(
      (d) => scenarios.filter((s) => s.domains.includes(d)).length,
    );
    const memberships = perDomain.reduce((a, b) => a + b, 0);
    expect(memberships).toBeGreaterThan(SCENARIO_COUNT);
    expect(memberships).toBe(
      scenarios.reduce((a, s) => a + s.domains.length, 0),
    );

    // Explicit multi-domain samples from batch 6.
    const card27 = scenarios.find((s) => s.nr === 27)!;
    expect(card27.domainCodes).toEqual(["D3", "D4"]);
    const card30 = scenarios.find((s) => s.nr === 30)!;
    expect(card30.domainCodes).toEqual(["D1", "D2"]);
    for (const card of [card27, card30]) {
      for (const d of card.domains) {
        expect(
          scenarios.filter((s) => s.domains.includes(d)).map((s) => s.nr),
        ).toContain(card.nr);
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

  it("accepts only the canonical slug format", () => {
    // Rejected by the scenarioSlug round-trip, not by a digit count.
    expect(getScenario("1")).toBeNull();
    expect(getScenario("001")).toBeNull();
    expect(getScenario("1e2")).toBeNull();
    // "NaN" survives the round-trip and both NaN range comparisons — only the
    // leading digit test stops it before it reaches the filesystem.
    expect(getScenario("NaN")).toBeNull();
    // Canonical but out of range.
    expect(getScenario("00")).toBeNull();
  });

  it("serves the last card and rejects the one past it", () => {
    expect(getScenario("100")).not.toBeNull();
  });

  it("rejects card 101", () => {
    expect(getScenario("101")).toBeNull();
  });
});

describe("classifySection / splitScenarioBody", () => {
  // Every card's headings, read once — the classification guards all run
  // against the real files.
  const cards = Array.from({ length: SCENARIO_COUNT }, (_, i) => {
    const nr = i + 1;
    const { body } = getScenario(scenarioSlug(nr))!;
    return { nr, body, headings: parseHeadings(body) };
  });

  it("classifies every heading on every card — no unknowns", () => {
    // The anti-rot guard: a new note heading in the next card batch fails here
    // and has to be sorted into ALLOW_PREFIX or BLOCK_PREFIX. At runtime an
    // unknown heading renders (fail-open), so this test is the only pressure.
    const unknown = cards.flatMap(({ nr, headings }) =>
      headings
        .filter((h) => classifySection(h.text) === "unknown")
        .map((h) => `Karte ${nr}: "${h.text}"`),
    );
    expect(unknown, `unklassifizierte Überschriften:\n${unknown.join("\n")}`)
      .toEqual([]);
  });

  it("renders no section whose heading is a production note", () => {
    for (const { nr, body } of cards) {
      const leaked = splitScenarioBody(body)
        .sections.filter((s) => classifySection(s.text) === "note")
        .map((s) => s.text);
      expect(leaked, `Karte ${nr}`).toEqual([]);
    }
  });

  it("keeps the study/note split in a plausible range", () => {
    const all = cards.flatMap((c) => c.headings);
    const note = all.filter((h) => classifySection(h.text) === "note").length;
    const learn = all.filter((h) => classifySection(h.text) === "learn").length;
    // Lower bounds, not exact counts: card corrections legitimately move these
    // numbers (238 / 479 at the time of writing) and an equality check would
    // break for no reason. The unknown test above is the real guard.
    const msg = `note=${note} learn=${learn}`;
    expect(note, msg).toBeGreaterThanOrEqual(200);
    expect(learn, msg).toBeGreaterThanOrEqual(400);
  });

  it("checks allow before block so 'Faktencheck — Divergenzen' survives", () => {
    expect(classifySection("Faktencheck")).toBe("note");
    expect(classifySection("Faktencheck — Divergenzen")).toBe("learn");
    expect(classifySection("Faktencheck-Notizen")).toBe("note");
  });

  it("normalizes leading emoji, case, umlauts and dashes", () => {
    expect(classifySection("🔴 Korrektur zur Karte")).toBe("note");
    expect(classifySection("  ⚠️ Bewusste Vereinfachungen  ")).toBe("note");
    expect(classifySection("Prüfungs-Kernsatz")).toBe("learn");
    expect(classifySection("Faktencheck – Divergenzen")).toBe("learn");
  });
});

describe("readNarrative", () => {
  // Which cards actually have a narrative.md is read off disk, not hard-coded:
  // the next narrative batch moves the boundary and must not break this file.
  const withFile: number[] = [];
  const withoutFile: number[] = [];
  for (let nr = 1; nr <= SCENARIO_COUNT; nr++) {
    const file = path.join(
      PUBLIC_DIR,
      "scenarios",
      `card-${scenarioSlug(nr)}`,
      "narrative.md",
    );
    (fs.existsSync(file) ? withFile : withoutFile).push(nr);
  }

  it("covers both cases, so neither branch is silently untested", () => {
    expect(withFile.length).toBeGreaterThan(0);
    expect(withoutFile.length).toBeGreaterThan(0);
  });

  it("returns null — never throws — for every card without a file", () => {
    // Load-bearing: generateStaticParams prerenders all SCENARIO_COUNT cards,
    // so a throw here would break the build, not just one page.
    for (const nr of withoutFile) {
      expect(() => readNarrative(nr), `Karte ${nr}`).not.toThrow();
      expect(readNarrative(nr), `Karte ${nr}`).toBeNull();
    }
  });

  it("parses every card that has a file, with the mandatory sections", () => {
    const optional = ["Die entscheidende Unterscheidung", "Syntax lesen"];
    const mandatory = NARRATIVE_SECTION_KEYS.filter(
      (k) => !optional.includes(k),
    );
    for (const nr of withFile) {
      const n = readNarrative(nr);
      expect(n, `Karte ${nr}`).not.toBeNull();
      expect(n!.meta.cardNumber, `Karte ${nr}`).toBe(nr);
      expect(n!.meta.slug, `Karte ${nr}`).not.toBe("");
      expect(n!.meta.domains.length, `Karte ${nr}`).toBeGreaterThan(0);
      const keys = n!.sections.map((s) => s.key);
      for (const k of mandatory) {
        expect(keys, `Karte ${nr}`).toContain(k);
      }
      // Suffixes after " — " are cut for the key but kept for the reader.
      for (const s of n!.sections) {
        expect(s.text.startsWith(s.key), `Karte ${nr}: "${s.text}"`).toBe(true);
      }
    }
  });

  it("keeps the sections in the canonical order", () => {
    const rank = new Map(NARRATIVE_SECTION_KEYS.map((k, i) => [k, i]));
    for (const nr of withFile) {
      const ranks = readNarrative(nr)!.sections.map((s) => rank.get(s.key)!);
      expect(ranks, `Karte ${nr}`).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it("has unique narrative slugs that collide with no other content type", () => {
    const slugs = readNarrativeSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);

    // Script slugs are the risky comparison — both are service-shaped url
    // slugs, whereas seed keys carry a content-type prefix.
    const scriptSlugs = loadSaaScripts().map((s) => s.slug);
    const seedKeys = [
      ...clfC02Questions,
      ...clfC02QuestionsBatch2,
      ...clfC02QuestionsBatch3,
      ...saaC03Questions,
      ...clfC02Flashcards,
      ...saaC03Flashcards,
    ]
      .map((x) => x.seedKey)
      .concat(loadSaaScripts().map((s) => s.seedKey));

    const all = [...slugs, ...scriptSlugs, ...seedKeys];
    const dupes = all.filter((x, i) => all.indexOf(x) !== i);
    expect(dupes, `Kollisionen: ${dupes.join(", ")}`).toEqual([]);
  });

  function readNarrativeSlugs(): string[] {
    return withFile.map((nr) => readNarrative(nr)!.meta.slug);
  }
});

describe("listScenarios build safety", () => {
  it("walks all SCENARIO_COUNT cards without throwing", () => {
    // generateStaticParams calls this; if it throws, no page prerenders.
    expect(() => listScenarios()).not.toThrow();
    expect(listScenarios()).toHaveLength(SCENARIO_COUNT);
  });
});
