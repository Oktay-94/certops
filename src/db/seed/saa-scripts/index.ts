// SAA-C03 service scripts — audited artifacts copied byte-identical from the
// content pipeline (saa-v2 + batch10a KORRIGIERT overrides); do not hand-edit
// here, patch upstream and re-copy. Deliberate storage split: these seed into
// the `scripts` DB table, while the CLF Skript stays file-based in
// src/content/skript/ (see schema.ts).
//
// The loader runs at seed/test time only (fs) — pages read the DB, never this
// directory. gray-matter over a hand-rolled parser because the frontmatter is
// real YAML with two list syntaxes (inline `[D1, D3]` and block lists for
// sourceRef).
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { slugifyHeading } from "../../../lib/skript";
import type { NewScript } from "../../schema";

const SCRIPTS_DIR = path.join(
  process.cwd(),
  "src",
  "db",
  "seed",
  "saa-scripts",
);

// Frontmatter domain codes → full exam-guide names (order = D1..D4 as in
// src/lib/domains.ts). Frontmatter ORDER is preserved: the first entry is the
// script's primary domain (grouping + accent colour on /saa/skript).
const DOMAIN_BY_CODE: Record<string, string> = {
  D1: "Design Secure Architectures",
  D2: "Design Resilient Architectures",
  D3: "Design High-Performing Architectures",
  D4: "Design Cost-Optimized Architectures",
};

const SEED_KEY_RE = /^saa-c03-script-[a-z0-9-]+$/;
const BATCH_RE = /^B(\d+)$/;

type Frontmatter = {
  service?: unknown;
  seedKey?: unknown;
  batch?: unknown;
  domains?: unknown;
  sourceRef?: unknown;
};

function fail(file: string, msg: string): never {
  throw new Error(`saa-scripts loader: ${file}: ${msg}`);
}

function parseScriptFile(file: string): Omit<NewScript, "position"> & {
  batchNum: number;
} {
  const raw = fs.readFileSync(path.join(SCRIPTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Frontmatter;

  const { service, seedKey, batch } = fm;
  if (typeof service !== "string" || !service.trim()) {
    fail(file, "missing frontmatter field `service`");
  }
  if (typeof seedKey !== "string" || !SEED_KEY_RE.test(seedKey)) {
    fail(file, `invalid seedKey ${JSON.stringify(seedKey)}`);
  }
  const batchMatch = typeof batch === "string" ? batch.match(BATCH_RE) : null;
  if (!batchMatch) fail(file, `invalid batch ${JSON.stringify(batch)}`);

  if (!Array.isArray(fm.domains) || fm.domains.length === 0) {
    fail(file, "missing frontmatter field `domains`");
  }
  const domains = fm.domains.map((code) => {
    const name = DOMAIN_BY_CODE[String(code)];
    if (!name) fail(file, `unknown domain code ${JSON.stringify(code)}`);
    return name;
  });

  const sourceRef = Array.isArray(fm.sourceRef)
    ? fm.sourceRef.map(String)
    : undefined;

  return {
    cert: "SAA-C03",
    seedKey,
    service,
    title: service,
    slug: slugifyHeading(service),
    domains,
    batch: batchMatch[0],
    batchNum: Number(batchMatch[1]),
    sourceRef,
    content: content.trim(),
  };
}

/**
 * All 137 scripts in deterministic reading order. `position` = batch number
 * * 1000 + alphabetic filename index within the batch — plain `batch` sorts
 * lexicographically wrong (B10 < B2), so the loader assigns an explicit
 * integer once and queries just ORDER BY position.
 */
export function loadSaaScripts(): NewScript[] {
  const files = fs
    .readdirSync(SCRIPTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const parsed = files.map(parseScriptFile);
  parsed.sort((a, b) => a.batchNum - b.batchNum);

  let lastBatch = -1;
  let indexInBatch = 0;
  return parsed.map(({ batchNum, ...script }) => {
    indexInBatch = batchNum === lastBatch ? indexInBatch + 1 : 0;
    lastBatch = batchNum;
    return { ...script, position: batchNum * 1000 + indexInBatch };
  });
}
