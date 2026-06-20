// seed_key backfill — PR 1 (foundation). Pure, DB-handle-taking functions so
// they can be exercised against :memory: SQLite in tests. The destructive seed
// path in seed.ts is untouched; this only fills the new seed_key column on
// rows that predate it, matching by the unique natural bridge (prompt / front).
//
// Idempotent: only rows WHERE seed_key IS NULL are updated, so re-running never
// overwrites an already-assigned key.
import { and, eq, isNull } from "drizzle-orm";
import type { DB } from "./index";
import { flashcards, questions } from "./schema";
import type { NewFlashcard, NewQuestion } from "./schema";

export type SeedKeySources = {
  questions: NewQuestion[];
  cards: NewFlashcard[];
};

export type BackfillResult = {
  questionsUpdated: number;
  cardsUpdated: number;
};

/**
 * Assign seed_key to existing rows by exact-string match on the stable natural
 * bridge: questions.prompt (264/264 distinct) and flashcards.front (150/150
 * distinct). Only NULL seed_key rows are touched. Never deletes, never updates
 * any other column, never touches question_attempts / flashcard_views.
 */
export async function backfillSeedKeys(
  db: DB,
  sources: SeedKeySources,
): Promise<BackfillResult> {
  let questionsUpdated = 0;
  for (const q of sources.questions) {
    if (!q.seedKey) continue;
    const res = await db
      .update(questions)
      .set({ seedKey: q.seedKey })
      .where(and(eq(questions.prompt, q.prompt), isNull(questions.seedKey)))
      .run();
    questionsUpdated += res.rowsAffected;
  }

  let cardsUpdated = 0;
  for (const c of sources.cards) {
    if (!c.seedKey) continue;
    const res = await db
      .update(flashcards)
      .set({ seedKey: c.seedKey })
      .where(and(eq(flashcards.front, c.front), isNull(flashcards.seedKey)))
      .run();
    cardsUpdated += res.rowsAffected;
  }

  return { questionsUpdated, cardsUpdated };
}

export type UnmatchedRow = { id: number; text: string };

export type CompletenessReport = {
  ok: boolean;
  unmatchedQuestions: UnmatchedRow[];
  unmatchedCards: UnmatchedRow[];
};

const TRUNCATE = 80;
const clip = (s: string) => (s.length > TRUNCATE ? `${s.slice(0, TRUNCATE)}…` : s);

/**
 * Mandatory pre-cutover gate. ok=true only when NO row on either content table
 * still has a NULL seed_key. Otherwise the offending rows are listed (id +
 * clipped prompt/front) so a drifted/unmatched row can be investigated — never
 * silently cut over.
 */
export async function checkSeedKeyCompleteness(
  db: DB,
): Promise<CompletenessReport> {
  const qRows = await db
    .select({ id: questions.id, text: questions.prompt })
    .from(questions)
    .where(isNull(questions.seedKey))
    .all();
  const cRows = await db
    .select({ id: flashcards.id, text: flashcards.front })
    .from(flashcards)
    .where(isNull(flashcards.seedKey))
    .all();

  const unmatchedQuestions = qRows.map((r) => ({ id: r.id, text: clip(r.text) }));
  const unmatchedCards = cRows.map((r) => ({ id: r.id, text: clip(r.text) }));

  return {
    ok: unmatchedQuestions.length === 0 && unmatchedCards.length === 0,
    unmatchedQuestions,
    unmatchedCards,
  };
}
