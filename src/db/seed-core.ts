// Idempotent seed core — the upsert logic, factored out so it can run against
// :memory: SQLite in tests on the exact production code path. No DELETE/TRUNCATE:
// question_attempts and flashcard_views are never touched. seed.ts wraps this
// with the env/target guards.
import { sql } from "drizzle-orm";
import type { DB } from "./index";
import { flashcards, questions } from "./schema";
import type { NewFlashcard, NewQuestion } from "./schema";
import { addBoldedTerms } from "../lib/markdown-bold";
import { addServiceMarkers } from "../lib/markdown-marks";

export type SeedSources = {
  questions: NewQuestion[];
  cards: NewFlashcard[];
};

export type SeedResult = { questions: number; cards: number };

/**
 * Upsert all questions and flashcards keyed on seed_key (UNIQUE). Conflicts
 * update every seed-owned content column from the incoming (excluded) row,
 * except id and seed_key. Rows whose seed_key is no longer in the sources stay
 * in place — pure insert+update, no hard delete (FK integrity, attempts survive).
 */
export async function runSeed(db: DB, sources: SeedSources): Promise<SeedResult> {
  await db
    .insert(questions)
    .values(sources.questions)
    .onConflictDoUpdate({
      target: questions.seedKey,
      set: {
        prompt: sql`excluded.prompt`,
        choices: sql`excluded.choices`,
        correct: sql`excluded.correct`,
        explanation: sql`excluded.explanation`,
        difficulty: sql`excluded.difficulty`,
        domain: sql`excluded.domain`,
        type: sql`excluded.type`,
      },
    })
    .run();

  const markdownCards = sources.cards.map((c) => ({
    ...c,
    back: addServiceMarkers(addBoldedTerms(c.back)),
  }));
  await db
    .insert(flashcards)
    .values(markdownCards)
    .onConflictDoUpdate({
      target: flashcards.seedKey,
      set: {
        front: sql`excluded.front`,
        back: sql`excluded.back`,
      },
    })
    .run();

  return { questions: sources.questions.length, cards: sources.cards.length };
}
