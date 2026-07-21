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

const CONTENT_DIR = path.join(process.cwd(), "public", "scenarios");

export const SCENARIO_COUNT = 70;

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

function assetUrl(nr: number, ext: "svg" | "pdf" | "png"): string {
  return `/scenarios/${cardDir(nr)}/${cardStem(nr)}.${ext}`;
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

/** Scenario by zero-padded slug ("01".."NN"); null for anything else. */
export function getScenario(
  slug: string,
): { meta: ScenarioMeta; body: string } | null {
  if (!/^\d{2}$/.test(slug)) return null;
  const nr = Number(slug);
  if (nr < 1 || nr > SCENARIO_COUNT) return null;
  return readScenario(nr);
}
