// Core of the structured-content backfills: apply structured JSON columns
// (flashcards.back_structured, questions.explanation_structured) to existing
// rows, keyed on seed_key. Factored out of the CLIs so it runs against
// :memory: SQLite in tests on the exact production code path.
//
// Guarantees (per target):
// - touches ONLY the configured column (raw UPDATE — deliberately not
//   db.update(), whose $onUpdateFn would silently bump updated_at),
// - idempotent: re-running the same batch yields the same rows,
// - never INSERTs: entries whose seed_key has no live row are reported as
//   missing, not created (content creation stays with the seed).
import { sql } from "drizzle-orm";
import type { DB } from "./index";
import { isFlashcardBackStructured } from "../lib/flashcard-back";
import { isQuestionExplanationStructured } from "../lib/question-explanation";

export type BackfillTarget = {
  /** SQL identifiers — fixed literals from the configs below, never user input. */
  table: "flashcards" | "questions";
  column: "back_structured" | "explanation_structured";
  /** JSON key carrying the payload in each batch entry. */
  entryKey: "backStructured" | "explanationStructured";
  validate: (value: unknown) => boolean;
};

export const FLASHCARD_BACKS: BackfillTarget = {
  table: "flashcards",
  column: "back_structured",
  entryKey: "backStructured",
  validate: isFlashcardBackStructured,
};

export const QUESTION_EXPLANATIONS: BackfillTarget = {
  table: "questions",
  column: "explanation_structured",
  entryKey: "explanationStructured",
  validate: isQuestionExplanationStructured,
};

export type BackfillEntry = {
  seedKey: string;
  value: Record<string, unknown>;
};

export type BackfillReport = {
  updated: string[];
  missing: string[];
};

/** Drop null-valued keys (authored "no section" marker) — one level deep. */
function stripNulls(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null));
}

/**
 * Parse + validate the raw JSON batch against the target. Throws with the
 * offending index/seedKey on any malformed entry — a batch is applied
 * all-or-nothing, so a typo in entry 17 cannot half-apply the file.
 */
export function parseBackfillBatch(
  raw: unknown,
  target: BackfillTarget,
): BackfillEntry[] {
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
    const payload = obj[target.entryKey];
    if (typeof payload !== "object" || payload === null) {
      throw new Error(`entry ${i} (${seedKey}): missing ${target.entryKey}`);
    }
    const value = stripNulls(payload as Record<string, unknown>);
    if (!target.validate(value)) {
      throw new Error(
        `entry ${i} (${seedKey}): ${target.entryKey} fails the shape guard`,
      );
    }
    return { seedKey, value };
  });
}

/** Apply the batch. dryRun only checks which seed_keys exist, writes nothing. */
export async function applyStructuredBackfill(
  db: DB,
  entries: BackfillEntry[],
  target: BackfillTarget,
  opts: { dryRun?: boolean } = {},
): Promise<BackfillReport> {
  const updated: string[] = [];
  const missing: string[] = [];
  const table = sql.raw(target.table);
  const column = sql.raw(target.column);

  for (const { seedKey, value } of entries) {
    const row = await db.get<{ n: number }>(
      sql`select count(*) as n from ${table} where seed_key = ${seedKey}`,
    );
    if (!row || row.n === 0) {
      missing.push(seedKey);
      continue;
    }
    if (!opts.dryRun) {
      await db.run(
        sql`update ${table} set ${column} = ${JSON.stringify(value)} where seed_key = ${seedKey}`,
      );
    }
    updated.push(seedKey);
  }

  return { updated, missing };
}
