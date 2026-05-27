/**
 * Reads data/icon-mapping.json and writes icon_slugs onto each flashcard.
 *
 * Run AFTER manually reviewing the JSON:
 *   pnpm tsx scripts/apply-icons.ts
 *
 * Per-card semantics:
 *   - suggestedSlugs.length > 0 → write the array
 *   - suggestedSlugs.length === 0 → write null (domain fallback in UI)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { flashcards } from "../src/db/schema";

type Entry = {
  id: number;
  domain: string;
  front: string;
  suggestedSlugs: string[];
};

const path = resolve(process.cwd(), "data/icon-mapping.json");
const entries: Entry[] = JSON.parse(readFileSync(path, "utf8"));

let withIcons = 0;
let cleared = 0;
for (const e of entries) {
  const value = e.suggestedSlugs.length > 0 ? e.suggestedSlugs : null;
  db.update(flashcards)
    .set({ iconSlugs: value })
    .where(eq(flashcards.id, e.id))
    .run();
  if (value) withIcons++;
  else cleared++;
}

console.log(
  `✓ Updated ${entries.length} flashcards · ${withIcons} with icons · ${cleared} cleared (fallback)`,
);
