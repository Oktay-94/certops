import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import type { DB } from "./index";
import * as schema from "./schema";
import {
  flashcardViews,
  flashcards,
  questionAttempts,
  questions,
} from "./schema";
import type { NewFlashcard, NewQuestion } from "./schema";
import { clfC02Questions } from "./seed/index";
import { clfC02QuestionsBatch2 } from "./seed/questions/index";
import { clfC02QuestionsBatch3 } from "./seed/questions/index-batch3";
import { clfC02Flashcards } from "./seed/cards/index";
import { runSeed } from "./seed-core";

const allQuestions: NewQuestion[] = [
  ...clfC02Questions,
  ...clfC02QuestionsBatch2,
  ...clfC02QuestionsBatch3,
];
const allCards: NewFlashcard[] = clfC02Flashcards;

async function createTestDb(): Promise<DB> {
  const client = createClient({ url: ":memory:" });
  await client.execute("PRAGMA foreign_keys = ON");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  return db;
}

const seedAll = (db: DB, cards = allCards, qs = allQuestions) =>
  runSeed(db, { questions: qs, cards });

async function rowCount(db: DB, table: typeof questions | typeof flashcards) {
  const r = await db.select({ n: sql<number>`count(*)` }).from(table).get();
  return r!.n;
}

describe("idempotent seed (upsert on seed_key)", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("1. seeding twice yields identical counts, no duplicates", async () => {
    await seedAll(db);
    expect(await rowCount(db, questions)).toBe(264);
    expect(await rowCount(db, flashcards)).toBe(150);

    await seedAll(db);
    expect(await rowCount(db, questions)).toBe(264);
    expect(await rowCount(db, flashcards)).toBe(150);

    // No duplicate seed_key after a second pass.
    const qDistinct = await db
      .select({ d: sql<number>`count(distinct ${questions.seedKey})` })
      .from(questions)
      .get();
    expect(qDistinct!.d).toBe(264);
  });

  it("2. a question_attempt survives a reseed, still pointing at the same question_id", async () => {
    await seedAll(db);
    const q = await db.select({ id: questions.id }).from(questions).limit(1).get();
    await db
      .insert(questionAttempts)
      .values({
        questionId: q!.id,
        selected: ["A"],
        correct: true,
        sessionId: "test-session",
        userId: "oktay",
      })
      .run();

    await seedAll(db);

    const attempts = await db.select().from(questionAttempts).all();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]!.questionId).toBe(q!.id);
  });

  it("3. editing a prompt UPDATEs the row in place — id stable, no duplicate", async () => {
    await seedAll(db);
    const before = await db
      .select({ id: questions.id, prompt: questions.prompt })
      .from(questions)
      .where(eq(questions.seedKey, "clf-c02-q-001"))
      .get();
    expect(before).toBeDefined();

    const edited = allQuestions.map((q) =>
      q.seedKey === "clf-c02-q-001"
        ? { ...q, prompt: "EDITED PROMPT — same seed_key, must update in place" }
        : q,
    );
    await seedAll(db, allCards, edited);

    expect(await rowCount(db, questions)).toBe(264); // not duplicated
    const after = await db
      .select({ id: questions.id, prompt: questions.prompt })
      .from(questions)
      .where(eq(questions.seedKey, "clf-c02-q-001"))
      .get();
    expect(after!.id).toBe(before!.id); // id stable
    expect(after!.prompt).toBe("EDITED PROMPT — same seed_key, must update in place");
  });

  it("4. a flashcard_view survives a reseed", async () => {
    await seedAll(db);
    const card = await db.select({ id: flashcards.id }).from(flashcards).limit(1).get();
    await db
      .insert(flashcardViews)
      .values({ cardId: card!.id, userId: "merve" })
      .run();

    await seedAll(db);

    const views = await db.select().from(flashcardViews).all();
    expect(views).toHaveLength(1);
    expect(views[0]!.cardId).toBe(card!.id);
  });

  it("4b. coalesce on back_structured — reseed without it keeps a backfilled value, seed with it wins", async () => {
    await seedAll(db);
    const key = allCards[0]!.seedKey!;

    // Manual backfill (sources carry no back_structured — CLF stays NULL).
    const backfilled = { summary: "Backfilled durch Hand-Edit." };
    await db
      .update(flashcards)
      .set({ backStructured: backfilled })
      .where(eq(flashcards.seedKey, key))
      .run();

    await seedAll(db); // incoming NULL must not wipe the backfill
    const afterReseed = await db
      .select({ backStructured: flashcards.backStructured })
      .from(flashcards)
      .where(eq(flashcards.seedKey, key))
      .get();
    expect(afterReseed!.backStructured).toEqual(backfilled);

    // A source that DOES carry back_structured updates the row.
    const fromSeed = { summary: "Aus dem Seed.", keywords: ["S3"] };
    const edited = allCards.map((c) =>
      c.seedKey === key ? { ...c, backStructured: fromSeed } : c,
    );
    await seedAll(db, edited);
    const afterEdit = await db
      .select({ backStructured: flashcards.backStructured })
      .from(flashcards)
      .where(eq(flashcards.seedKey, key))
      .get();
    expect(afterEdit!.backStructured).toEqual(fromSeed);
  });

  it("5. NULL invariant — no content row has seed_key IS NULL after seeding", async () => {
    await seedAll(db);
    const qNulls = await db
      .select({ n: sql<number>`sum(${questions.seedKey} is null)` })
      .from(questions)
      .get();
    const cNulls = await db
      .select({ n: sql<number>`sum(${flashcards.seedKey} is null)` })
      .from(flashcards)
      .get();
    expect(qNulls!.n).toBe(0);
    expect(cNulls!.n).toBe(0);
  });
});
