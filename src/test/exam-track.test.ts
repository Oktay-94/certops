// Exam-track guards: with BOTH seeds in one DB the cert filter must be tight
// in both directions, attempts must never leak across tracks, round selection
// stays inside its cert, the switcher path mapping follows the spec, and the
// SAA exam_status empty state resolves without a row.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeAll, describe, expect, it } from "vitest";

import type { DB } from "@/db/index";
import * as schema from "@/db/schema";
import { questionAttempts, questions } from "@/db/schema";
import {
  getAttemptStats,
  getExamStatus,
  getFlashcards,
  getQuestionsByCert,
  selectRoundQuestions,
  upsertExamStatus,
} from "@/db/repository";
import { runSeed } from "@/db/seed-core";
import { clfC02Questions } from "@/db/seed/index";
import { clfC02QuestionsBatch2 } from "@/db/seed/questions/index";
import { clfC02QuestionsBatch3 } from "@/db/seed/questions/index-batch3";
import { clfC02Flashcards } from "@/db/seed/cards/index";
import { saaC03Flashcards, saaC03Questions } from "@/db/seed/saa/index";
import { switchExamPath } from "@/lib/exam-path";
import { EXAM_CERT, isExamSlug } from "@/lib/exam";
import { resolveExamStatus } from "@/lib/exam-status";

let db: DB;

beforeAll(async () => {
  const client = createClient({ url: ":memory:" });
  await client.execute("PRAGMA foreign_keys = ON");
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  await runSeed(db, {
    questions: [
      ...clfC02Questions,
      ...clfC02QuestionsBatch2,
      ...clfC02QuestionsBatch3,
      ...saaC03Questions,
    ],
    cards: [...clfC02Flashcards, ...saaC03Flashcards],
  });
});

describe("cert filter is tight in both directions", () => {
  it("question pools: CLF stays 264, SAA is 265", async () => {
    expect(await getQuestionsByCert(db, "CLF-C02")).toHaveLength(264);
    expect(await getQuestionsByCert(db, "SAA-C03")).toHaveLength(265);
  });

  it("flashcard pools: CLF stays 150, SAA is 207", async () => {
    expect(await getFlashcards(db, "CLF-C02")).toHaveLength(150);
    expect(await getFlashcards(db, "SAA-C03")).toHaveLength(207);
  });
});

describe("attempts never leak across tracks", () => {
  it("a CLF attempt is invisible to SAA stats (and vice versa)", async () => {
    const clfQ = (await getQuestionsByCert(db, "CLF-C02"))[0];
    const saaQ = (await getQuestionsByCert(db, "SAA-C03"))[0];
    await db.insert(questionAttempts).values([
      {
        questionId: clfQ.id,
        selected: ["A"],
        correct: true,
        sessionId: "s-test",
        userId: "leak-test",
      },
      {
        questionId: saaQ.id,
        selected: ["A"],
        correct: false,
        sessionId: "s-test",
        userId: "leak-test",
      },
    ]);

    const clfStats = await getAttemptStats(db, "leak-test", "CLF-C02");
    const saaStats = await getAttemptStats(db, "leak-test", "SAA-C03");
    expect(clfStats.total).toBe(1);
    expect(clfStats.correct).toBe(1);
    expect(saaStats.total).toBe(1);
    expect(saaStats.correct).toBe(0);
    // Domains must belong to the queried track only.
    expect(clfStats.byDomain.map((d) => d.domain)).toEqual([clfQ.domain]);
    expect(saaStats.byDomain.map((d) => d.domain)).toEqual([saaQ.domain]);
  });
});

describe("round selection stays inside its cert", () => {
  it("SAA rounds contain only SAA question ids (and CLF only CLF)", async () => {
    const saaIds = new Set(
      (await getQuestionsByCert(db, "SAA-C03")).map((q) => q.id),
    );
    for (const cert of ["CLF-C02", "SAA-C03"] as const) {
      const ids = await selectRoundQuestions(db, {
        cert,
        userId: "leak-test",
        count: 20,
        mode: "random",
        seed: 1,
      });
      expect(ids).toHaveLength(20);
      const inSaa = ids.filter((id) => saaIds.has(id)).length;
      expect(inSaa).toBe(cert === "SAA-C03" ? 20 : 0);
    }
  });
});

describe("exam slug whitelist", () => {
  it("accepts only clf/saa and maps to the right certs", () => {
    expect(isExamSlug("clf")).toBe(true);
    expect(isExamSlug("saa")).toBe(true);
    expect(isExamSlug("foo")).toBe(false);
    expect(isExamSlug("")).toBe(false);
    expect(EXAM_CERT.clf).toBe("CLF-C02");
    expect(EXAM_CERT.saa).toBe("SAA-C03");
  });
});

describe("switcher path mapping (spec: entity segments → dashboard root)", () => {
  it("maps shared static subpaths 1:1", () => {
    expect(switchExamPath("/clf", "saa")).toBe("/saa");
    expect(switchExamPath("/clf/quiz", "saa")).toBe("/saa/quiz");
    expect(switchExamPath("/saa/cards", "clf")).toBe("/clf/cards");
    expect(switchExamPath("/clf/stats", "saa")).toBe("/saa/stats");
  });

  it("sends entity, round-bound and clf-only paths to the target root", () => {
    expect(switchExamPath("/clf/quiz/689", "saa")).toBe("/saa");
    expect(switchExamPath("/clf/quiz/done", "saa")).toBe("/saa");
    expect(switchExamPath("/clf/skript", "saa")).toBe("/saa");
    expect(switchExamPath("/clf/skript/03-storage", "saa")).toBe("/saa");
    expect(switchExamPath("/clf/services", "saa")).toBe("/saa");
    expect(switchExamPath("/clf/uebersicht", "saa")).toBe("/saa");
    expect(switchExamPath("/saa/quiz/1160", "clf")).toBe("/clf");
  });
});

describe("SAA exam_status empty state", () => {
  it("no row → getExamStatus null; the first upsert creates it", async () => {
    expect(await getExamStatus(db, "merve", "SAA-C03")).toBeNull();

    // Page-level rule: cert === SAA && row === null → unscheduled (no
    // app-side fallback like CLF). resolveExamStatus still reports the
    // row as not persisted.
    const resolved = resolveExamStatus(null, "merve");
    expect(resolved.persisted).toBe(false);

    await upsertExamStatus(db, {
      userId: "merve",
      cert: "SAA-C03",
      examDate: new Date("2026-10-15T00:00:00Z"),
      result: "pending",
    });
    const row = await getExamStatus(db, "merve", "SAA-C03");
    expect(row).not.toBeNull();
    expect(row!.result).toBe("pending");
    // CLF row untouched by the SAA upsert.
    expect(await getExamStatus(db, "merve", "CLF-C02")).toBeNull();
  });
});
