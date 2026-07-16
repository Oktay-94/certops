// Idempotent seed core — the upsert logic, factored out so it can run against
// :memory: SQLite in tests on the exact production code path. No DELETE/TRUNCATE:
// question_attempts and flashcard_views are never touched. seed.ts wraps this
// with the env/target guards.
import { sql } from "drizzle-orm";
import type { DB } from "./index";
import { flashcards, questions, scripts } from "./schema";
import type { NewFlashcard, NewQuestion, NewScript } from "./schema";
import { addBoldedTerms } from "../lib/markdown-bold";
import { addServiceMarkers } from "../lib/markdown-marks";

export type SeedSources = {
  questions: NewQuestion[];
  cards: NewFlashcard[];
  scripts?: NewScript[];
};

export type SeedResult = { questions: number; cards: number; scripts: number };

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
        // coalesce: sources without topic/sourceRef (CLF) must not wipe values
        // that were backfilled manually. Trade-off: a deliberate reset to NULL
        // via seed is impossible — accepted.
        topic: sql`coalesce(excluded.topic, ${questions.topic})`,
        sourceRef: sql`coalesce(excluded.source_ref, ${questions.sourceRef})`,
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
        // See questions: coalesce protects manual backfills.
        topic: sql`coalesce(excluded.topic, ${flashcards.topic})`,
        sourceRef: sql`coalesce(excluded.source_ref, ${flashcards.sourceRef})`,
        backStructured: sql`coalesce(excluded.back_structured, ${flashcards.backStructured})`,
      },
    })
    .run();

  const scriptRows = sources.scripts ?? [];
  if (scriptRows.length > 0) {
    await db
      .insert(scripts)
      .values(scriptRows)
      .onConflictDoUpdate({
        target: scripts.seedKey,
        set: {
          service: sql`excluded.service`,
          title: sql`excluded.title`,
          slug: sql`excluded.slug`,
          domains: sql`excluded.domains`,
          batch: sql`excluded.batch`,
          content: sql`excluded.content`,
          position: sql`excluded.position`,
          // See questions: coalesce protects manual backfills.
          sourceRef: sql`coalesce(excluded.source_ref, ${scripts.sourceRef})`,
        },
      })
      .run();
  }

  return {
    questions: sources.questions.length,
    cards: sources.cards.length,
    scripts: scriptRows.length,
  };
}
