// Guard: the SAA-C03 seed arrays must stay at the expected size, gapless and
// collision-free (also against CLF keys), and the upsert must populate topic —
// including the coalesce protection for manually backfilled values.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import type { DB } from "../../index";
import * as schema from "../../schema";
import { flashcards, questions } from "../../schema";
import { clfC02Questions } from "../index";
import { clfC02QuestionsBatch2 } from "../questions/index";
import { clfC02QuestionsBatch3 } from "../questions/index-batch3";
import { clfC02Flashcards } from "../cards/index";
import { saaC03Flashcards, saaC03Questions } from "./index";
import { runSeed } from "../../seed-core";

const pad = (n: number) => String(n).padStart(3, "0");

async function createTestDb(): Promise<DB> {
  const client = createClient({ url: ":memory:" });
  await client.execute("PRAGMA foreign_keys = ON");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  return db;
}

describe("SAA-C03 seed arrays", () => {
  it("has exactly 265 questions and 207 flashcards", () => {
    expect(saaC03Questions).toHaveLength(265);
    expect(saaC03Flashcards).toHaveLength(207);
  });

  it("seed keys are gapless (q-001…265, card-001…207)", () => {
    const qKeys = new Set(saaC03Questions.map((q) => q.seedKey));
    const cKeys = new Set(saaC03Flashcards.map((c) => c.seedKey));
    for (let i = 1; i <= 265; i++) expect(qKeys.has(`saa-c03-q-${pad(i)}`)).toBe(true);
    for (let i = 1; i <= 207; i++) expect(cKeys.has(`saa-c03-card-${pad(i)}`)).toBe(true);
    expect(qKeys.size).toBe(265);
    expect(cKeys.size).toBe(207);
  });

  it("no seed_key collisions across the combined CLF+SAA arrays", () => {
    const allQ = [
      ...clfC02Questions,
      ...clfC02QuestionsBatch2,
      ...clfC02QuestionsBatch3,
      ...saaC03Questions,
    ].map((q) => q.seedKey);
    const allC = [...clfC02Flashcards, ...saaC03Flashcards].map((c) => c.seedKey);
    expect(new Set(allQ).size).toBe(allQ.length);
    expect(new Set(allC).size).toBe(allC.length);
  });

  it("every item is SAA-C03 and carries a non-empty topic", () => {
    for (const item of [...saaC03Questions, ...saaC03Flashcards]) {
      expect(item.cert).toBe("SAA-C03");
      expect(item.topic).toBeTruthy();
    }
  });
});

describe("SAA-C03 upsert (topic/sourceRef via coalesce)", () => {
  it("seeding twice is idempotent and topic stays populated", async () => {
    const db = await createTestDb();
    const sources = { questions: saaC03Questions, cards: saaC03Flashcards };

    for (const run of [1, 2]) {
      await runSeed(db, sources);
      const qCount = await db.select({ n: sql<number>`count(*)` }).from(questions).get();
      const cCount = await db.select({ n: sql<number>`count(*)` }).from(flashcards).get();
      expect(qCount!.n, `run ${run}`).toBe(265);
      expect(cCount!.n, `run ${run}`).toBe(207);

      const qTopicNulls = await db
        .select({ n: sql<number>`sum(${questions.topic} is null)` })
        .from(questions)
        .get();
      const cTopicNulls = await db
        .select({ n: sql<number>`sum(${flashcards.topic} is null)` })
        .from(flashcards)
        .get();
      expect(qTopicNulls!.n, `run ${run}`).toBe(0);
      expect(cTopicNulls!.n, `run ${run}`).toBe(0);
    }
  });

  it("coalesce protects a manually backfilled topic from a NULL-topic source", async () => {
    const db = await createTestDb();
    // CLF sources carry no topic — simulate a manual backfill, then reseed.
    const clfSources = { questions: clfC02Questions, cards: clfC02Flashcards };
    await runSeed(db, clfSources);
    await db
      .update(questions)
      .set({ topic: "manually-backfilled" })
      .where(eq(questions.seedKey, "clf-c02-q-001"))
      .run();

    await runSeed(db, clfSources);

    const row = await db
      .select({ topic: questions.topic })
      .from(questions)
      .where(eq(questions.seedKey, "clf-c02-q-001"))
      .get();
    expect(row!.topic).toBe("manually-backfilled");
  });
});
