import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import type { DB } from "./index";
import * as schema from "./schema";
import { flashcards } from "./schema";
import {
  applyBackStructuredBackfill,
  parseBackfillBatch,
} from "./back-structured-backfill";

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

const STRUCTURED = {
  summary: "Zugriffssteuerung für AWS.",
  keywords: ["IAM"],
};

describe("parseBackfillBatch", () => {
  it("accepts a valid batch", () => {
    const entries = parseBackfillBatch([
      { seedKey: "saa-c03-card-001", backStructured: STRUCTURED },
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.backStructured.summary).toBe(STRUCTURED.summary);
  });

  it("strips null sections (authored 'no section' marker) before validating", () => {
    const entries = parseBackfillBatch([
      {
        seedKey: "saa-c03-card-006",
        backStructured: { ...STRUCTURED, example: null },
      },
    ]);
    expect(entries[0]!.backStructured).toEqual(STRUCTURED);
    expect("example" in entries[0]!.backStructured).toBe(false);
  });

  it("rejects non-arrays, missing seedKey, duplicates, and bad shapes", () => {
    expect(() => parseBackfillBatch({})).toThrow(/array/);
    expect(() =>
      parseBackfillBatch([{ backStructured: STRUCTURED }]),
    ).toThrow(/seedKey/);
    expect(() =>
      parseBackfillBatch([
        { seedKey: "a", backStructured: STRUCTURED },
        { seedKey: "a", backStructured: STRUCTURED },
      ]),
    ).toThrow(/duplicate/);
    expect(() =>
      parseBackfillBatch([{ seedKey: "a", backStructured: { summary: 1 } }]),
    ).toThrow(/shape guard/);
  });
});

describe("applyBackStructuredBackfill", () => {
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
    const report = await applyBackStructuredBackfill(db, [
      { seedKey: CARD.seedKey, backStructured: STRUCTURED },
    ]);
    expect(report.updated).toEqual([CARD.seedKey]);
    expect(report.missing).toEqual([]);

    const after = (await getRow())!;
    expect(after.backStructured).toEqual(STRUCTURED);
    expect(after.front).toBe(before.front);
    expect(after.back).toBe(before.back);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
  });

  it("is idempotent — second run yields the identical row", async () => {
    const entries = [{ seedKey: CARD.seedKey, backStructured: STRUCTURED }];
    await applyBackStructuredBackfill(db, entries);
    const first = (await getRow())!;
    await applyBackStructuredBackfill(db, entries);
    const second = (await getRow())!;
    expect(second).toEqual(first);
  });

  it("reports unknown seed_keys as missing without inserting", async () => {
    const report = await applyBackStructuredBackfill(db, [
      { seedKey: "saa-c03-card-999", backStructured: STRUCTURED },
    ]);
    expect(report.updated).toEqual([]);
    expect(report.missing).toEqual(["saa-c03-card-999"]);
    const all = await db.select().from(flashcards).all();
    expect(all).toHaveLength(1);
  });

  it("dry-run writes nothing", async () => {
    const report = await applyBackStructuredBackfill(
      db,
      [{ seedKey: CARD.seedKey, backStructured: STRUCTURED }],
      { dryRun: true },
    );
    expect(report.updated).toEqual([CARD.seedKey]);
    expect((await getRow())!.backStructured).toBeNull();
  });
});
