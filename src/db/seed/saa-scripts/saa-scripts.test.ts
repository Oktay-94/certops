// Guard: the 137 SAA service scripts must load completely, with seed keys
// collision-free across ALL content types, slugs unique, exactly one
// Organizations script (the b10 duplicate was removed upstream), and an
// idempotent upsert against :memory: on the production code path.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { describe, expect, it } from "vitest";

import type { DB } from "../../index";
import * as schema from "../../schema";
import { scripts } from "../../schema";
import { SAA_C03_DOMAINS } from "../../../lib/domains";
import { clfC02Questions } from "../index";
import { clfC02QuestionsBatch2 } from "../questions/index";
import { clfC02QuestionsBatch3 } from "../questions/index-batch3";
import { clfC02Flashcards } from "../cards/index";
import { saaC03Flashcards, saaC03Questions } from "../saa/index";
import { loadSaaScripts } from "./index";
import { runSeed } from "../../seed-core";

const saaScripts = loadSaaScripts();

async function createTestDb(): Promise<DB> {
  const client = createClient({ url: ":memory:" });
  await client.execute("PRAGMA foreign_keys = ON");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  return db;
}

describe("SAA-C03 script sources", () => {
  it("loads exactly 137 scripts", () => {
    expect(saaScripts).toHaveLength(137);
  });

  it("seed keys match the script pattern and collide with NO other content type", () => {
    const scriptKeys = saaScripts.map((s) => s.seedKey);
    for (const key of scriptKeys) {
      expect(key).toMatch(/^saa-c03-script-[a-z0-9-]+$/);
    }
    const allKeys = [
      ...clfC02Questions,
      ...clfC02QuestionsBatch2,
      ...clfC02QuestionsBatch3,
      ...saaC03Questions,
      ...clfC02Flashcards,
      ...saaC03Flashcards,
    ]
      .map((x) => x.seedKey)
      .concat(scriptKeys);
    expect(new Set(allKeys).size).toBe(allKeys.length);
  });

  it("slugs are unique across all 137 scripts", () => {
    const slugs = saaScripts.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("has exactly ONE Organizations script — from batch B5, not the removed b10 duplicate", () => {
    const orgs = saaScripts.filter((s) => /organizations/i.test(s.service));
    expect(orgs).toHaveLength(1);
    expect(orgs[0].batch).toBe("B5");
  });

  it("every script is SAA-C03 with known domains, content and a unique position", () => {
    const positions = new Set(saaScripts.map((s) => s.position));
    expect(positions.size).toBe(saaScripts.length);
    for (const s of saaScripts) {
      expect(s.cert).toBe("SAA-C03");
      expect(s.content.length).toBeGreaterThan(0);
      expect(s.domains.length).toBeGreaterThan(0);
      for (const d of s.domains) {
        expect(SAA_C03_DOMAINS).toContain(d);
      }
    }
  });
});

describe("SAA-C03 script upsert", () => {
  it("seeding twice is idempotent (137 rows, content unchanged)", async () => {
    const db = await createTestDb();
    const sources = {
      questions: saaC03Questions,
      cards: saaC03Flashcards,
      scripts: saaScripts,
    };

    for (const run of [1, 2]) {
      const result = await runSeed(db, sources);
      expect(result.scripts, `run ${run}`).toBe(137);
      const rows = await db.select().from(scripts).all();
      expect(rows, `run ${run}`).toHaveLength(137);
    }

    const s3 = (await db.select().from(scripts).all()).find(
      (r) => r.seedKey === "saa-c03-script-s3",
    );
    expect(s3?.service).toBe("Amazon S3");
    expect(s3?.slug).toBe("amazon-s3");
    expect(s3?.content).toContain("SAA-Vertiefung");
    expect(s3?.sourceRef?.length).toBeGreaterThan(0);
  });
});
