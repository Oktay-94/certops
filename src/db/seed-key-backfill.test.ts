import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import type { DB } from "./index";
import * as schema from "./schema";
import { flashcards, questions } from "./schema";
import type { NewFlashcard, NewQuestion } from "./schema";
import { clfC02Questions } from "./seed/index";
import { clfC02QuestionsBatch2 } from "./seed/questions/index";
import { clfC02QuestionsBatch3 } from "./seed/questions/index-batch3";
import { clfC02Flashcards } from "./seed/cards/index";
import {
  backfillSeedKeys,
  checkSeedKeyCompleteness,
  reportSeedKeyState,
} from "./seed-key-backfill";

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

const stripKey = <T extends { seedKey?: string | null }>(o: T): T => ({
  ...o,
  seedKey: null,
});

/** Seed the content tables the way pre-seed_key live rows look: no seed_key. */
async function seedWithoutKeys(db: DB): Promise<void> {
  await db.insert(questions).values(allQuestions.map(stripKey)).run();
  await db.insert(flashcards).values(allCards.map(stripKey)).run();
}

// ── Source-level guards (no DB): the literals in the seed files. ──────────────
describe("seed_key source literals", () => {
  it("assigns a non-empty seedKey to every question and card", () => {
    for (const q of allQuestions) expect(q.seedKey).toBeTruthy();
    for (const c of allCards) expect(c.seedKey).toBeTruthy();
  });

  it("seed keys are globally unique across 264 questions + 150 cards", () => {
    const keys = [...allQuestions, ...allCards].map((o) => o.seedKey);
    expect(keys).toHaveLength(414);
    expect(new Set(keys).size).toBe(414);
  });

  it("prompts (264) and fronts (150) are the unique backfill bridge", () => {
    expect(new Set(allQuestions.map((q) => q.prompt)).size).toBe(264);
    expect(new Set(allCards.map((c) => c.front)).size).toBe(150);
  });
});

// ── Backfill behaviour against :memory: SQLite (real migrations applied). ─────
describe("backfillSeedKeys", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("matches every seed entry — no NULL seed_key left, gate passes", async () => {
    await seedWithoutKeys(db);
    const result = await backfillSeedKeys(db, {
      questions: allQuestions,
      cards: allCards,
    });
    expect(result.questionsUpdated).toBe(264);
    expect(result.cardsUpdated).toBe(150);

    const gate = await checkSeedKeyCompleteness(db);
    expect(gate.ok).toBe(true);
    expect(gate.unmatchedQuestions).toEqual([]);
    expect(gate.unmatchedCards).toEqual([]);
  });

  it("yields a unique, NULL-free seed_key per row after backfill (cutover ok)", async () => {
    await seedWithoutKeys(db);
    await backfillSeedKeys(db, { questions: allQuestions, cards: allCards });

    const qStats = await db
      .select({
        total: sql<number>`count(*)`,
        distinct: sql<number>`count(distinct ${questions.seedKey})`,
        nulls: sql<number>`sum(${questions.seedKey} is null)`,
      })
      .from(questions)
      .get();
    expect(qStats).toEqual({ total: 264, distinct: 264, nulls: 0 });

    const cStats = await db
      .select({
        total: sql<number>`count(*)`,
        distinct: sql<number>`count(distinct ${flashcards.seedKey})`,
        nulls: sql<number>`sum(${flashcards.seedKey} is null)`,
      })
      .from(flashcards)
      .get();
    expect(cStats).toEqual({ total: 150, distinct: 150, nulls: 0 });
  });

  it("is idempotent — a second run updates nothing", async () => {
    await seedWithoutKeys(db);
    await backfillSeedKeys(db, { questions: allQuestions, cards: allCards });
    const second = await backfillSeedKeys(db, {
      questions: allQuestions,
      cards: allCards,
    });
    expect(second).toEqual({ questionsUpdated: 0, cardsUpdated: 0 });
  });

  it("GATE catches a drifted row — unmatched list non-empty, gate stops", async () => {
    await seedWithoutKeys(db);

    // Simulate a live row whose prompt drifted away from the seed source: no
    // seed entry matches it, so its seed_key stays NULL after backfill.
    const target = await db
      .select({ id: questions.id })
      .from(questions)
      .limit(1)
      .get();
    expect(target).toBeDefined();
    await db
      .update(questions)
      .set({ prompt: "DRIFTED — no seed entry matches this prompt anymore" })
      .where(eq(questions.id, target!.id))
      .run();

    await backfillSeedKeys(db, { questions: allQuestions, cards: allCards });

    const gate = await checkSeedKeyCompleteness(db);
    expect(gate.ok).toBe(false);
    expect(gate.unmatchedQuestions).toHaveLength(1);
    expect(gate.unmatchedQuestions[0]!.id).toBe(target!.id);
  });
});

// ── Dry-run report: read-only preview of what a backfill run would do. ────────
describe("reportSeedKeyState", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  const sources = { questions: allQuestions, cards: allCards };

  it("pre-backfill live state: everything matchable, nothing keyed", async () => {
    await seedWithoutKeys(db);
    const report = await reportSeedKeyState(db, sources);

    expect(report.questions).toEqual({
      total: 264,
      alreadyKeyed: 0,
      matchable: 264,
      drift: [],
      missingLive: [],
      dupLive: [],
    });
    expect(report.cards).toEqual({
      total: 150,
      alreadyKeyed: 0,
      matchable: 150,
      drift: [],
      missingLive: [],
      dupLive: [],
    });
  });

  it("is read-only — reporting leaves every seed_key NULL", async () => {
    await seedWithoutKeys(db);
    await reportSeedKeyState(db, sources);

    const nulls = await db
      .select({ n: sql<number>`sum(${questions.seedKey} is null)` })
      .from(questions)
      .get();
    expect(nulls!.n).toBe(264);
  });

  it("post-backfill state: all keyed, nothing left to match", async () => {
    await seedWithoutKeys(db);
    await backfillSeedKeys(db, sources);
    const report = await reportSeedKeyState(db, sources);

    expect(report.questions.alreadyKeyed).toBe(264);
    expect(report.questions.matchable).toBe(0);
    expect(report.cards.alreadyKeyed).toBe(150);
    expect(report.cards.matchable).toBe(0);
  });

  it("flags a drifted row as drift AND its seed entry as missingLive", async () => {
    await seedWithoutKeys(db);
    const target = await db
      .select({ id: questions.id, prompt: questions.prompt })
      .from(questions)
      .limit(1)
      .get();
    await db
      .update(questions)
      .set({ prompt: "DRIFTED — no seed entry matches this prompt anymore" })
      .where(eq(questions.id, target!.id))
      .run();

    const report = await reportSeedKeyState(db, sources);
    expect(report.questions.matchable).toBe(263);
    expect(report.questions.drift).toHaveLength(1);
    expect(report.questions.drift[0]!.id).toBe(target!.id);

    const driftedSource = allQuestions.find((q) => q.prompt === target!.prompt);
    expect(report.questions.missingLive).toEqual([driftedSource!.seedKey]);
  });

  it("flags duplicate live rows (same prompt) as dupLive collision risk", async () => {
    await seedWithoutKeys(db);
    // Simulate a leftover duplicate from the destructive-seed era.
    await db.insert(questions).values(stripKey(allQuestions[0]!)).run();

    const report = await reportSeedKeyState(db, sources);
    expect(report.questions.total).toBe(265);
    expect(report.questions.dupLive).toHaveLength(1);
    expect(report.questions.dupLive[0]!.ids).toHaveLength(2);
  });
});
