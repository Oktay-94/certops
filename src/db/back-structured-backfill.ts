// Core of the back_structured backfill: apply structured card backs to
// existing flashcards rows, keyed on seed_key. Factored out of the CLI so it
// runs against :memory: SQLite in tests on the exact production code path.
//
// Guarantees:
// - touches ONLY the back_structured column (raw UPDATE — deliberately not
//   db.update(), whose $onUpdateFn would silently bump updated_at),
// - idempotent: re-running the same batch yields the same rows,
// - never INSERTs: entries whose seed_key has no live row are reported as
//   missing, not created (content creation stays with the seed).
import { sql } from "drizzle-orm";
import type { DB } from "./index";
import {
  isFlashcardBackStructured,
  type FlashcardBackStructured,
} from "../lib/flashcard-back";

export type BackfillEntry = {
  seedKey: string;
  backStructured: FlashcardBackStructured;
};

export type BackfillReport = {
  updated: string[];
  missing: string[];
};

/**
 * Parse + validate the raw JSON batch. Throws with the offending index/seedKey
 * on any malformed entry — a batch is applied all-or-nothing, so a typo in
 * entry 17 cannot half-apply the file.
 */
export function parseBackfillBatch(raw: unknown): BackfillEntry[] {
  if (!Array.isArray(raw)) {
    throw new Error("batch must be a JSON array");
  }
  const seen = new Set<string>();
  return raw.map((item, i) => {
    const obj = item as Record<string, unknown>;
    const seedKey = obj?.seedKey;
    if (typeof seedKey !== "string" || seedKey.trim() === "") {
      throw new Error(`entry ${i}: missing/invalid seedKey`);
    }
    if (seen.has(seedKey)) {
      throw new Error(`entry ${i}: duplicate seedKey ${seedKey}`);
    }
    seen.add(seedKey);
    // Normalize at the boundary: authored batches use null for "no section"
    // (e.g. example: null) — strip those so the stored JSON stays clean and
    // the shape guard (string | undefined) applies unchanged.
    const withoutNulls = Object.fromEntries(
      Object.entries(obj.backStructured ?? {}).filter(([, v]) => v !== null),
    );
    if (!isFlashcardBackStructured(withoutNulls)) {
      throw new Error(
        `entry ${i} (${seedKey}): backStructured fails the shape guard`,
      );
    }
    return { seedKey, backStructured: withoutNulls };
  });
}

/** Apply the batch. dryRun only checks which seed_keys exist, writes nothing. */
export async function applyBackStructuredBackfill(
  db: DB,
  entries: BackfillEntry[],
  opts: { dryRun?: boolean } = {},
): Promise<BackfillReport> {
  const updated: string[] = [];
  const missing: string[] = [];

  for (const { seedKey, backStructured } of entries) {
    const row = await db.get<{ n: number }>(
      sql`select count(*) as n from flashcards where seed_key = ${seedKey}`,
    );
    if (!row || row.n === 0) {
      missing.push(seedKey);
      continue;
    }
    if (!opts.dryRun) {
      await db.run(
        sql`update flashcards set back_structured = ${JSON.stringify(backStructured)} where seed_key = ${seedKey}`,
      );
    }
    updated.push(seedKey);
  }

  return { updated, missing };
}
