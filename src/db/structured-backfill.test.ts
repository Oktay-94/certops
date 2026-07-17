import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import type { DB } from "./index";
import * as schema from "./schema";
import { flashcards, questions } from "./schema";
import {
  FLASHCARD_BACKS,
  QUESTION_EXPLANATIONS,
  applyStructuredBackfill,
  parseBackfillBatch,
} from "./structured-backfill";

async function createTestDb(): Promise<DB> {
  const client = createClient({ url: ":memory:" });
  await client.execute("PRAGMA foreign_keys = ON");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  return db;
}

const CARD = {
  cert: "SAA-C03" as const,
  domain: "Design Secure Architectures",
  front: "Was ist IAM?",
  back: "Zugriffssteuerung.",
  seedKey: "saa-c03-card-001",
};

const CARD_STRUCTURED = {
  summary: "Zugriffssteuerung für AWS.",
  keywords: ["IAM"],
};

const QUESTION = {
  cert: "SAA-C03" as const,
  domain: "Design Secure Architectures",
  type: "single" as const,
  prompt: "Was gewinnt?",
  choices: [
    { id: "A", text: "Allow" },
    { id: "B", text: "Deny" },
  ],
  correct: ["B"],
  explanation: "Explizites Deny gewinnt.",
  seedKey: "saa-c03-q-001",
};

const Q_STRUCTURED = {
  verdict: "**Explizites Deny** gewinnt immer.",
  optionAnalysis: { A: "Falsch — Allow verliert.", B: "Richtig — Deny." },
  mnemonic: "Deny schlägt Allow.",
  examTrap: "Kein Allow hebt ein Deny auf.",
};

describe("parseBackfillBatch", () => {
  it("accepts valid batches for both targets", () => {
    const cards = parseBackfillBatch(
      [{ seedKey: "saa-c03-card-001", backStructured: CARD_STRUCTURED }],
      FLASHCARD_BACKS,
    );
    expect(cards[0]!.value).toEqual(CARD_STRUCTURED);

    const qs = parseBackfillBatch(
      [{ seedKey: "saa-c03-q-001", explanationStructured: Q_STRUCTURED }],
      QUESTION_EXPLANATIONS,
    );
    expect(qs[0]!.value).toEqual(Q_STRUCTURED);
  });

  it("strips null sections (authored 'no section' marker) before validating", () => {
    const entries = parseBackfillBatch(
      [
        {
          seedKey: "saa-c03-card-006",
          backStructured: { ...CARD_STRUCTURED, example: null },
        },
      ],
      FLASHCARD_BACKS,
    );
    expect(entries[0]!.value).toEqual(CARD_STRUCTURED);
    expect("example" in entries[0]!.value).toBe(false);
  });

  it("rejects non-arrays, missing seedKey, duplicates, and bad shapes", () => {
    expect(() => parseBackfillBatch({}, FLASHCARD_BACKS)).toThrow(/array/);
    expect(() =>
      parseBackfillBatch([{ backStructured: CARD_STRUCTURED }], FLASHCARD_BACKS),
    ).toThrow(/seedKey/);
    expect(() =>
      parseBackfillBatch(
        [
          { seedKey: "a", backStructured: CARD_STRUCTURED },
          { seedKey: "a", backStructured: CARD_STRUCTURED },
        ],
        FLASHCARD_BACKS,
      ),
    ).toThrow(/duplicate/);
    expect(() =>
      parseBackfillBatch(
        [{ seedKey: "a", backStructured: { summary: 1 } }],
        FLASHCARD_BACKS,
      ),
    ).toThrow(/shape guard/);
    expect(() =>
      parseBackfillBatch(
        [{ seedKey: "a", explanationStructured: { optionAnalysis: { A: 1 } } }],
        QUESTION_EXPLANATIONS,
      ),
    ).toThrow(/shape guard/);
    // Entry carrying the WRONG payload key for the target must fail loudly.
    expect(() =>
      parseBackfillBatch(
        [{ seedKey: "a", backStructured: CARD_STRUCTURED }],
        QUESTION_EXPLANATIONS,
      ),
    ).toThrow(/missing explanationStructured/);
  });
});

describe("applyStructuredBackfill (flashcards target)", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
    await db.insert(flashcards).values(CARD).run();
  });

  async function getRow() {
    return db
      .select()
      .from(flashcards)
      .where(eq(flashcards.seedKey, CARD.seedKey))
      .get();
  }

  it("sets back_structured and touches NOTHING else (incl. updated_at)", async () => {
    const before = (await getRow())!;
    const report = await applyStructuredBackfill(
      db,
      [{ seedKey: CARD.seedKey, value: CARD_STRUCTURED }],
      FLASHCARD_BACKS,
    );
    expect(report.updated).toEqual([CARD.seedKey]);
    expect(report.missing).toEqual([]);

    const after = (await getRow())!;
    expect(after.backStructured).toEqual(CARD_STRUCTURED);
    expect(after.front).toBe(before.front);
    expect(after.back).toBe(before.back);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
  });

  it("is idempotent — second run yields the identical row", async () => {
    const entries = [{ seedKey: CARD.seedKey, value: CARD_STRUCTURED }];
    await applyStructuredBackfill(db, entries, FLASHCARD_BACKS);
    const first = (await getRow())!;
    await applyStructuredBackfill(db, entries, FLASHCARD_BACKS);
    expect(await getRow()).toEqual(first);
  });

  it("reports unknown seed_keys as missing without inserting", async () => {
    const report = await applyStructuredBackfill(
      db,
      [{ seedKey: "saa-c03-card-999", value: CARD_STRUCTURED }],
      FLASHCARD_BACKS,
    );
    expect(report.updated).toEqual([]);
    expect(report.missing).toEqual(["saa-c03-card-999"]);
    expect(await db.select().from(flashcards).all()).toHaveLength(1);
  });

  it("dry-run writes nothing", async () => {
    const report = await applyStructuredBackfill(
      db,
      [{ seedKey: CARD.seedKey, value: CARD_STRUCTURED }],
      FLASHCARD_BACKS,
      { dryRun: true },
    );
    expect(report.updated).toEqual([CARD.seedKey]);
    expect((await getRow())!.backStructured).toBeNull();
  });
});

describe("applyStructuredBackfill (questions target)", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
    await db.insert(questions).values(QUESTION).run();
  });

  async function getRow() {
    return db
      .select()
      .from(questions)
      .where(eq(questions.seedKey, QUESTION.seedKey))
      .get();
  }

  it("sets explanation_structured and touches NOTHING else", async () => {
    const before = (await getRow())!;
    const report = await applyStructuredBackfill(
      db,
      [{ seedKey: QUESTION.seedKey, value: Q_STRUCTURED }],
      QUESTION_EXPLANATIONS,
    );
    expect(report.updated).toEqual([QUESTION.seedKey]);

    const after = (await getRow())!;
    expect(after.explanationStructured).toEqual(Q_STRUCTURED);
    expect(after.explanation).toBe(before.explanation);
    expect(after.choices).toEqual(before.choices);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
  });

  it("must not cross-write: flashcards target leaves questions untouched", async () => {
    await db.insert(flashcards).values(CARD).run();
    await applyStructuredBackfill(
      db,
      [{ seedKey: CARD.seedKey, value: CARD_STRUCTURED }],
      FLASHCARD_BACKS,
    );
    expect((await getRow())!.explanationStructured).toBeNull();
  });
});
