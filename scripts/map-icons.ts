/**
 * Reads all CLF-C02 flashcards from the DB, runs matchServices() over
 * front+back, and writes data/icon-mapping.json for manual review.
 *
 * No DB writes. Review the JSON, edit if needed, then run apply-icons.ts.
 *
 * Run: pnpm tsx scripts/map-icons.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { db } from "../src/db";
import { getFlashcards } from "../src/db/repository";
import { matchServices } from "../src/lib/aws-services";

type Entry = {
  id: number;
  domain: string;
  front: string;
  suggestedSlugs: string[];
};

const cards = getFlashcards(db, "CLF-C02");
const entries: Entry[] = cards.map((c) => ({
  id: c.id,
  domain: c.domain,
  front: c.front,
  suggestedSlugs: matchServices(`${c.front} ${c.back}`, 2),
}));

const matched = entries.filter((e) => e.suggestedSlugs.length > 0).length;
const unmatched = entries.length - matched;

const outDir = resolve(process.cwd(), "data");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "icon-mapping.json");
writeFileSync(outPath, JSON.stringify(entries, null, 2) + "\n");

console.log(`✓ Wrote ${outPath}`);
console.log(
  `  ${entries.length} cards · ${matched} matched · ${unmatched} without match`,
);
