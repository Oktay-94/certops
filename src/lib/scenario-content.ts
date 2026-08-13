// Battle-card scenario content access — server-only (node:fs + gray-matter).
// The cards live in public/scenarios/ so their SVG/PDF assets are served
// statically; the .md files are read from the same tree at build time only
// (routes are fully SSG via generateStaticParams + dynamicParams=false).
// Invalid frontmatter throws — the build fails loudly instead of silently
// dropping a card.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { SAA_C03_DOMAINS, type SaaC03Domain } from "./domains";
import { splitChapter, type SkriptSection } from "./skript-content";

const CONTENT_DIR = path.join(process.cwd(), "public", "scenarios");

export const SCENARIO_COUNT = 100;

export type ScenarioDomainCode = "D1" | "D2" | "D3" | "D4";

// SAA_C03_DOMAINS is in exam-guide order, so index = D-code — derived, not
// duplicated, and can never diverge from the canonical names.
const DOMAIN_BY_CODE: Record<ScenarioDomainCode, SaaC03Domain> = {
  D1: SAA_C03_DOMAINS[0],
  D2: SAA_C03_DOMAINS[1],
  D3: SAA_C03_DOMAINS[2],
  D4: SAA_C03_DOMAINS[3],
};

function isDomainCode(v: unknown): v is ScenarioDomainCode {
  return v === "D1" || v === "D2" || v === "D3" || v === "D4";
}

export type ScenarioMeta = {
  nr: number;
  /** Route slug, zero-padded ("01".."NN") — matches the card-NN directories. */
  slug: string;
  title: string;
  services: string[];
  signalwords: string[];
  /** Frontmatter order kept; [0] = primary domain (accent, grouping). */
  domainCodes: ScenarioDomainCode[];
  /** Canonical exam-guide names mapped from domainCodes; [0] = primary. */
  domains: SaaC03Domain[];
  svgUrl: string;
  pdfUrl: string;
  pngUrl: string;
  statusNote?: string;
};

/**
 * Glyph for the Szenarien area — dashboard tile AND the overview page eyebrow.
 * Deliberately one constant: two literals for the same area is the kind of
 * drift nobody finds again once it exists.
 */
export const SZENARIEN_GLYPH = "🗺️";

export function scenarioSlug(nr: number): string {
  return String(nr).padStart(2, "0");
}

// Directory is zero-padded (card-01) but the files inside are not
// (battle_card_1.*) — that asymmetry lives in exactly this one place.
function cardDir(nr: number): string {
  return `card-${scenarioSlug(nr)}`;
}

function cardStem(nr: number): string {
  return `battle_card_${nr}`;
}

/** Generated diagram stem — three digits, unlike the two-digit directory. */
function diagramStem(nr: number): string {
  return `card-${String(nr).padStart(3, "0")}`;
}

/**
 * Asset URL with fallback: the generated diagram when it exists on disk,
 * otherwise the hand-authored battle card.
 *
 * 90 of 100 cards have a generated diagram; 4, 7, 9, 25, 30, 37, 40, 54, 55 and
 * 80 have no spec yet and keep their battle_card_N.* — see
 * docs/diagramm-specs-fehlend.md.
 *
 * TWO things the field names no longer carry on their own:
 *
 * 1. `svg` resolves to `card-NNN.web.svg`, the WEB cut — no title, no legend.
 *    The print SVG is not shipped; it stays in the gitignored build output.
 *
 * 2. This resolves at BUILD TIME, not per request. Every scenario page is SSG,
 *    so dropping a new asset into public/ without rebuilding leaves the old
 *    image on the page. If a diagram looks stale, rebuild before looking for
 *    the bug in the frontend — it is not there.
 */
function assetUrl(nr: number, ext: "svg" | "pdf" | "png"): string {
  const dir = cardDir(nr);
  const generated = ext === "svg" ? `${diagramStem(nr)}.web.svg` : `${diagramStem(nr)}.${ext}`;
  if (fs.existsSync(path.join(CONTENT_DIR, dir, generated))) {
    return `/scenarios/${dir}/${generated}`;
  }
  return `/scenarios/${dir}/${cardStem(nr)}.${ext}`;
}

function requireString(v: unknown, key: string, file: string): string {
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`Frontmatter ungültig: "${key}" in ${file}`);
  }
  return v;
}

function requireNumber(v: unknown, key: string, file: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`Frontmatter ungültig: "${key}" in ${file}`);
  }
  return v;
}

function requireStringArray(v: unknown, key: string, file: string): string[] {
  if (
    !Array.isArray(v) ||
    v.length === 0 ||
    !v.every((x) => typeof x === "string" && x.trim() !== "")
  ) {
    throw new Error(`Szenario-Frontmatter ungültig: "${key}" in ${file}`);
  }
  return v;
}

function readScenario(nr: number): { meta: ScenarioMeta; body: string } {
  const file = path.join(CONTENT_DIR, cardDir(nr), `${cardStem(nr)}.md`);
  const { data, content } = matter(fs.readFileSync(file, "utf8"));

  if (data.nr !== nr) {
    throw new Error(`Szenario-Frontmatter ungültig: nr=${data.nr} in ${file}`);
  }
  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`Szenario-Frontmatter ungültig: "title" in ${file}`);
  }
  const domainCodes = requireStringArray(data.domains, "domains", file);
  if (!domainCodes.every(isDomainCode)) {
    throw new Error(
      `Szenario-Frontmatter ungültig: "domains" muss D1–D4 sein in ${file}`,
    );
  }

  const meta: ScenarioMeta = {
    nr,
    slug: scenarioSlug(nr),
    title: data.title,
    services: requireStringArray(data.services, "services", file),
    signalwords: requireStringArray(data.signalwords, "signalwords", file),
    domainCodes,
    domains: domainCodes.map((c) => DOMAIN_BY_CODE[c]),
    svgUrl: assetUrl(nr, "svg"),
    pdfUrl: assetUrl(nr, "pdf"),
    pngUrl: assetUrl(nr, "png"),
    ...(typeof data.status_note === "string" && data.status_note.trim() !== ""
      ? { statusNote: data.status_note.trim() }
      : {}),
  };

  // The body's own `# …` h1 would duplicate the page header.
  const body = content.replace(/^\s*# .*\n/, "").trim();
  return { meta, body };
}

/** All SCENARIO_COUNT scenarios sorted by nr; throws on any invalid card (build guard). */
export function listScenarios(): ScenarioMeta[] {
  return Array.from({ length: SCENARIO_COUNT }, (_, i) => readScenario(i + 1).meta);
}

// --- Narrative long-form companion ------------------------------------------
// Cards 1–39 have a narrative.md next to the battle card; 40–100 do not, and
// that is the normal state, not an error. Every card prerenders, so a missing
// file must never throw — a malformed one must.

/** The nine canonical h2 keys, in the order check.py enforces. */
export const NARRATIVE_SECTION_KEYS = [
  "Die Grundidee zuerst",
  "Was es eigentlich ist",
  "Der Weg durch die Karte",
  "Die entscheidende Unterscheidung",
  "Die ehrliche Feinheit",
  "Syntax lesen",
  "Was du dadurch nicht baust",
  "Wenn du dir eine Sache merkst",
  "Prüfungsknackpunkte",
] as const;

export type NarrativeSectionKey = (typeof NARRATIVE_SECTION_KEYS)[number];

/** The two keys a narrative may omit; the other seven are mandatory. */
const OPTIONAL_SECTION_KEYS: readonly NarrativeSectionKey[] = [
  "Die entscheidende Unterscheidung",
  "Syntax lesen",
];

export type NarrativeMeta = {
  cardNumber: number;
  slug: string;
  title: string;
  services: string[];
  domainCodes: ScenarioDomainCode[];
  domains: SaaC03Domain[];
  badgeCount: number;
  narrativeVersion: number;
  factCheckedAt: string;
  sources: string[];
};

/** A narrative section; `key` is the canonical h2 with its " — " suffix cut. */
export type NarrativeSection = SkriptSection & { key: NarrativeSectionKey };

export type Narrative = {
  meta: NarrativeMeta;
  /** File order, which check.py pins to NARRATIVE_SECTION_KEYS order. */
  sections: NarrativeSection[];
};

/**
 * Headings carry free-form suffixes ("Syntax lesen — `evaluateOnExit`"); only
 * the part before the em-dash separator identifies the section. The full text
 * stays in `raw`/`text` and is what the reader sees.
 */
function narrativeKey(headingText: string): string {
  return headingText.split(" — ")[0].trim();
}

/**
 * The narrative for a card, or null when it has none.
 *
 * Missing file → null. That is load-bearing: listScenarios() feeds
 * generateStaticParams over all SCENARIO_COUNT cards, so a throw on card 40
 * would break the whole prerender. A file that exists but is malformed still
 * throws — same loud-failure house style as readScenario.
 */
export function readNarrative(nr: number): Narrative | null {
  const file = path.join(CONTENT_DIR, cardDir(nr), "narrative.md");
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }

  const { data, content } = matter(raw);

  const cardNumber = requireNumber(data.cardNumber, "cardNumber", file);
  if (cardNumber !== nr) {
    throw new Error(
      `Narrativ-Frontmatter ungültig: cardNumber=${cardNumber} in ${file}`,
    );
  }
  const domainCodes = requireStringArray(data.domains, "domains", file);
  if (!domainCodes.every(isDomainCode)) {
    throw new Error(
      `Narrativ-Frontmatter ungültig: "domains" muss D1–D4 sein in ${file}`,
    );
  }

  const meta: NarrativeMeta = {
    cardNumber,
    slug: requireString(data.slug, "slug", file),
    title: requireString(data.title, "title", file),
    services: requireStringArray(data.services, "services", file),
    domainCodes,
    domains: domainCodes.map((c) => DOMAIN_BY_CODE[c]),
    badgeCount: requireNumber(data.badgeCount, "badgeCount", file),
    narrativeVersion: requireNumber(
      data.narrativeVersion,
      "narrativeVersion",
      file,
    ),
    factCheckedAt: requireString(data.factCheckedAt, "factCheckedAt", file),
    sources: requireStringArray(data.sources, "sources", file),
  };

  const body = content.replace(/^\s*# .*\n/, "").trim();
  const sections: NarrativeSection[] = [];
  for (const s of splitChapter(body).sections) {
    const key = narrativeKey(s.text);
    if (!(NARRATIVE_SECTION_KEYS as readonly string[]).includes(key)) {
      throw new Error(`Narrativ-Sektion unbekannt: "${s.text}" in ${file}`);
    }
    sections.push({ ...s, key: key as NarrativeSectionKey });
  }

  const present = new Set(sections.map((s) => s.key));
  const missing = NARRATIVE_SECTION_KEYS.filter(
    (k) => !present.has(k) && !OPTIONAL_SECTION_KEYS.includes(k),
  );
  if (missing.length > 0) {
    throw new Error(
      `Narrativ unvollständig: fehlende Sektionen ${missing.join(", ")} in ${file}`,
    );
  }

  return { meta, sections };
}

// --- Production notes vs. study material ------------------------------------
// The card .md files carry production notes (colour conventions, fact-check
// bookkeeping, deliberate simplifications) next to the actual study sections.
// Both stay in the files; only the rendering drops the notes — same principle
// as status_note.

/** Headings whose (normalized) prefix marks a section as study material. */
const ALLOW_PREFIX = [
  "szenario",
  "ablauf",
  "pruefungs-kernsatz",
  "klassiker-fallen",
  "abgrenzung",
  "faktencheck - divergenzen",
  "nachtrag zur abgrenzung",
  "rand",
  "die ",
  "pflicht-abgrenzung",
  "divergenzen",
  "aktueller service-status",
  "vorbemerkung",
];

/** Exact (normalized) headings that are pure production notes. */
const BLOCK_EXACT = ["faktencheck"];

/** Heading prefixes that mark a section as a pure production note. */
const BLOCK_PREFIX = [
  "bewusste vereinfachungen",
  "farbkonvention",
  "farben",
  "faktencheck-notizen",
  "faktencheck-quellen",
  "faktenlage geprueft",
  "nicht bestaetigt",
  "korrektur",
  "werkzeug-learning",
  "vorschlag fuer batch",
  "abweichung vom masterplan",
  "technische notiz",
  "ausblick, bewusst nicht",
];

/**
 * Fold a heading to the form the ALLOW/BLOCK lists are written in: leading
 * emoji and warning signs dropped, lowercase, umlauts folded, dashes and
 * whitespace unified. Parentheses survive the strip — some headings start
 * with one.
 */
function normalizeHeading(heading: string): string {
  return heading
    .trim()
    .replace(/^[^\p{L}\p{N}(]+/u, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ");
}

/**
 * Classify a card section by its `## ` heading.
 *
 * Allow is checked BEFORE block, and that order is binding: the block entry
 * "faktencheck" would otherwise swallow "Faktencheck — Divergenzen", which is
 * study material.
 *
 * "unknown" means the lists have not caught up with a new heading. It renders
 * like "learn" (fail-open — never silently drop study material); the guard test
 * in scenario-content.test.ts is what forces the classification.
 */
export function classifySection(heading: string): "learn" | "note" | "unknown" {
  const h = normalizeHeading(heading);
  if (ALLOW_PREFIX.some((p) => h.startsWith(p))) return "learn";
  if (BLOCK_EXACT.includes(h)) return "note";
  if (BLOCK_PREFIX.some((p) => h.startsWith(p))) return "note";
  return "unknown";
}

/**
 * Split a card body into intro + renderable sections. The single place where
 * production notes are filtered out — the page just renders what comes back.
 */
export function splitScenarioBody(body: string): {
  intro: string;
  sections: SkriptSection[];
} {
  const { intro, sections } = splitChapter(body);
  return {
    intro,
    sections: sections.filter((s) => classifySection(s.text) !== "note"),
  };
}

/** Scenario by canonical slug ("01".."99", "100"); null for anything else. */
export function getScenario(
  slug: string,
): { meta: ScenarioMeta; body: string } | null {
  // Digits first, then a round-trip against scenarioSlug — the canonical slug
  // is by definition the one scenarioSlug produces, so "1", "001" and "1e2"
  // fall out without hard-coding a digit count (card 100 is three digits).
  // The digit test is not redundant: "NaN" survives the round-trip
  // (Number("NaN") is NaN, scenarioSlug(NaN) is "NaN") and both range
  // comparisons against NaN are false.
  if (!/^\d+$/.test(slug)) return null;
  const nr = Number(slug);
  if (slug !== scenarioSlug(nr)) return null;
  if (nr < 1 || nr > SCENARIO_COUNT) return null;
  return readScenario(nr);
}
