import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import type { DB } from "./index";
import * as schema from "./schema";
import {
  countAnsweredQuestions,
  countSeenFlashcards,
  getAttemptStats,
  getAttemptsByUser,
  getAttemptTimestamps,
  getDomainPerformance,
  getExamStatus,
  getDomainStats,
  getFlashcards,
  getLastNAttempts,
  getLastRoundReview,
  getNeverSeenQuestions,
  getOverallAvgLast3,
  getQuestionStats,
  getQuestionsByCert,
  getRoundTrend,
  getPersistentWeakest,
  getWeakestQuestions,
  insertAttempt,
  insertQuestion,
  markFlashcardSeen,
  resetFlashcardViews,
  selectRoundQuestions,
  upsertExamStatus,
} from "./repository";
import { flashcardViews, flashcards } from "./schema";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function createTestDb(): Promise<DB> {
  const client = createClient({ url: ":memory:" });
  // libsql does NOT enable FKs by default; enable explicitly. Per-connection
  // pragma is sufficient here because :memory: uses a single connection per
  // client instance — the FK constraint test below verifies this stays true.
  await client.execute("PRAGMA foreign_keys = ON");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  return db;
}

const sampleClf: schema.NewQuestion = {
  cert: "CLF-C02",
  domain: "Cloud Concepts",
  type: "single",
  prompt: "What is elasticity?",
  choices: [
    { id: "A", text: "Auto-scaling capacity" },
    { id: "B", text: "Data durability" },
  ],
  correct: ["A"],
  explanation: "Elasticity means scaling resources up and down with demand.",
  difficulty: 1,
  sourceRef: "test",
};

const sampleSaa: schema.NewQuestion = {
  ...sampleClf,
  cert: "SAA-C03",
  domain: "Design Secure Architectures",
  prompt: "Different question",
};

// Test helper: user_id is the sole filter key for all reads now. Default it to
// the session string so the existing isolation tests (keyed on "s1"/"sA"/…)
// keep their intent without touching every call site. Tests that need user/
// session decoupled call insertAttempt directly with an explicit userId.
async function ins(
  database: DB,
  a: schema.NewQuestionAttempt,
): Promise<schema.QuestionAttempt> {
  return insertAttempt(database, { ...a, userId: a.userId ?? a.sessionId });
}

describe("repository", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("inserts a question and returns the persisted row", async () => {
    const row = await insertQuestion(db, sampleClf);

    expect(row.id).toBeGreaterThan(0);
    expect(row.cert).toBe("CLF-C02");
    expect(row.choices).toEqual(sampleClf.choices);
    expect(row.correct).toEqual(["A"]);
    expect(row.createdAt).toBeInstanceOf(Date);
    expect(row.updatedAt).toBeInstanceOf(Date);
  });

  it("returns only questions for the requested cert", async () => {
    await insertQuestion(db, sampleClf);
    await insertQuestion(db, sampleSaa);

    const clf = await getQuestionsByCert(db, "CLF-C02");
    expect(clf).toHaveLength(1);
    expect(clf[0].cert).toBe("CLF-C02");

    const saa = await getQuestionsByCert(db, "SAA-C03");
    expect(saa).toHaveLength(1);
    expect(saa[0].cert).toBe("SAA-C03");
  });

  it("filters by domain when provided", async () => {
    await insertQuestion(db, sampleClf);
    await insertQuestion(db, { ...sampleClf, domain: "Security and Compliance", prompt: "Other" });

    const cloud = await getQuestionsByCert(db, "CLF-C02", { domain: "Cloud Concepts" });
    expect(cloud).toHaveLength(1);
    expect(cloud[0].domain).toBe("Cloud Concepts");
  });

  it("returns an empty array when no questions match", async () => {
    expect(await getQuestionsByCert(db, "CLF-C02")).toEqual([]);
  });
});

describe("question_attempts", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("inserts an attempt and returns the persisted row", async () => {
    const q = await insertQuestion(db, sampleClf);

    const row = await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-1",
    });

    expect(row.id).toBeGreaterThan(0);
    expect(row.questionId).toBe(q.id);
    expect(row.selected).toEqual(["A"]);
    expect(row.correct).toBe(true);
    expect(row.sessionId).toBe("session-1");
    expect(row.timeTakenMs).toBeNull();
    expect(row.roundId).toBeNull();
    expect(row.answeredAt).toBeInstanceOf(Date);
  });

  it("persists roundId when provided and allows grouping by it", async () => {
    const q = await insertQuestion(db, sampleClf);

    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
      roundId: "r1",
    });
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
      roundId: "r1",
    });
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
      roundId: "r2",
    });
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
      // omitted -> NULL
    });

    const all = await getAttemptsByUser(db, "s1");
    const r1 = all.filter((a) => a.roundId === "r1");
    const r2 = all.filter((a) => a.roundId === "r2");
    const noRound = all.filter((a) => a.roundId === null);
    expect(r1.length).toBe(2);
    expect(r2.length).toBe(1);
    expect(noRound.length).toBe(1);
  });

  it("throws on FK violation when question_id does not exist (verifies FK pragma is active)", async () => {
    await expect(
      ins(db, {
        questionId: 9999,
        selected: ["A"],
        correct: false,
        sessionId: "session-x",
      }),
    ).rejects.toThrow();
  });

  it("getAttemptsByUser returns only attempts for the requested session", async () => {
    const q = await insertQuestion(db, sampleClf);

    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-a",
    });
    await ins(db, {
      questionId: q.id,
      selected: ["B"],
      correct: false,
      sessionId: "session-a",
    });
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-b",
    });

    const a = await getAttemptsByUser(db, "session-a");
    expect(a).toHaveLength(2);
    expect(a.every((r) => r.sessionId === "session-a")).toBe(true);

    expect(await getAttemptsByUser(db, "session-unknown")).toEqual([]);
  });

  it("roundtrips multi-select selected JSON array", async () => {
    const q = await insertQuestion(db, sampleClf);

    const row = await ins(db, {
      questionId: q.id,
      selected: ["A", "C"],
      correct: false,
      sessionId: "session-multi",
      timeTakenMs: 4200,
    });

    expect(row.selected).toEqual(["A", "C"]);
    expect(row.timeTakenMs).toBe(4200);

    const [reloaded] = await getAttemptsByUser(db, "session-multi");
    expect(reloaded.selected).toEqual(["A", "C"]);
  });
});

describe("exam status", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns null without a row, row after upsert", async () => {
    expect(await getExamStatus(db, "merve", "CLF-C02")).toBeNull();

    const examDate = new Date("2026-09-01T00:00:00Z");
    await upsertExamStatus(db, {
      userId: "merve",
      cert: "CLF-C02",
      examDate,
      result: "pending",
    });

    const row = await getExamStatus(db, "merve", "CLF-C02");
    expect(row?.result).toBe("pending");
    expect(row?.examDate.toISOString()).toBe(examDate.toISOString());
    expect(row?.updatedAt).toBeInstanceOf(Date);
  });

  it("upsert updates in place (no duplicate row per user+cert)", async () => {
    const first = new Date("2026-09-01T00:00:00Z");
    const second = new Date("2026-10-01T00:00:00Z");
    await upsertExamStatus(db, {
      userId: "merve",
      cert: "CLF-C02",
      examDate: first,
      result: "pending",
    });
    await upsertExamStatus(db, {
      userId: "merve",
      cert: "CLF-C02",
      examDate: second,
      result: "failed",
    });

    const rows = await db.select().from(schema.examStatus).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.result).toBe("failed");
    expect(rows[0]!.examDate.toISOString()).toBe(second.toISOString());
  });

  it("isolates by user_id \u2014 oktay and merve never see each other", async () => {
    await upsertExamStatus(db, {
      userId: "oktay",
      cert: "CLF-C02",
      examDate: new Date("2026-07-01T00:00:00Z"),
      result: "passed",
    });

    expect(await getExamStatus(db, "merve", "CLF-C02")).toBeNull();
    expect((await getExamStatus(db, "oktay", "CLF-C02"))?.result).toBe(
      "passed",
    );
  });

  it("isolates by cert \u2014 CLF row does not answer SAA", async () => {
    await upsertExamStatus(db, {
      userId: "oktay",
      cert: "CLF-C02",
      examDate: new Date("2026-07-01T00:00:00Z"),
      result: "passed",
    });
    expect(await getExamStatus(db, "oktay", "SAA-C03")).toBeNull();
  });
});

describe("getAttemptTimestamps", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns Dates ascending, filtered by user_id AND cert", async () => {
    const clf = await insertQuestion(db, sampleClf);
    const saa = await insertQuestion(db, sampleSaa);

    const early = new Date("2026-07-01T08:00:00Z");
    const late = new Date("2026-07-02T08:00:00Z");
    await ins(db, {
      questionId: clf.id,
      selected: ["A"],
      correct: true,
      sessionId: "u1",
      answeredAt: late,
    });
    await ins(db, {
      questionId: clf.id,
      selected: ["A"],
      correct: false,
      sessionId: "u1",
      answeredAt: early,
    });
    // Other user and other cert must both be excluded.
    await ins(db, {
      questionId: clf.id,
      selected: ["A"],
      correct: true,
      sessionId: "u2",
    });
    await ins(db, {
      questionId: saa.id,
      selected: ["A"],
      correct: true,
      sessionId: "u1",
    });

    const stamps = await getAttemptTimestamps(db, "u1", "CLF-C02");
    expect(stamps).toHaveLength(2);
    expect(stamps[0]).toBeInstanceOf(Date);
    expect(stamps.map((d) => d.toISOString())).toEqual([
      early.toISOString(),
      late.toISOString(),
    ]);
  });

  it("ignores session_id — filters by user_id alone (identity guard)", async () => {
    const q = await insertQuestion(db, sampleClf);
    await insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "shared-device-session",
      userId: "oktay",
    });
    await insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "shared-device-session",
      userId: "merve",
    });

    expect(await getAttemptTimestamps(db, "oktay", "CLF-C02")).toHaveLength(1);
    expect(await getAttemptTimestamps(db, "merve", "CLF-C02")).toHaveLength(1);
  });
});

describe("getLastNAttempts", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns an empty array for an unknown session", async () => {
    expect(await getLastNAttempts(db, "session-none", 5)).toEqual([]);
  });

  it("returns at most n attempts, newest first", async () => {
    const q = await insertQuestion(db, sampleClf);

    for (let i = 0; i < 5; i++) {
      await ins(db, {
        questionId: q.id,
        selected: ["A"],
        correct: i % 2 === 0,
        sessionId: "session-x",
      });
      // small gap so answeredAt differs reliably
      await new Promise((r) => setTimeout(r, 5));
    }

    const last3 = await getLastNAttempts(db, "session-x", 3);
    expect(last3).toHaveLength(3);

    const timestamps = last3.map((a) => a.answeredAt.getTime());
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });

  it("isolates by session", async () => {
    const q = await insertQuestion(db, sampleClf);

    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-a",
    });
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-b",
    });

    expect(await getLastNAttempts(db, "session-a", 10)).toHaveLength(1);
  });
});

describe("getAttemptStats", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns zeroed stats for a session with no attempts", async () => {
    expect(await getAttemptStats(db, "session-empty", "CLF-C02")).toEqual({
      total: 0,
      correct: 0,
      byDomain: [],
    });
  });

  it("aggregates totals and per-domain counts", async () => {
    const cloud = await insertQuestion(db, sampleClf);
    const security = await insertQuestion(db, {
      ...sampleClf,
      domain: "Security and Compliance",
      prompt: "S?",
    });

    await ins(db, {
      questionId: cloud.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    await ins(db, {
      questionId: cloud.id,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    await ins(db, {
      questionId: security.id,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });

    const stats = await getAttemptStats(db, "s1", "CLF-C02");
    expect(stats.total).toBe(3);
    expect(stats.correct).toBe(1);

    const cloudStat = stats.byDomain.find((d) => d.domain === "Cloud Concepts");
    const secStat = stats.byDomain.find(
      (d) => d.domain === "Security and Compliance",
    );
    expect(cloudStat).toEqual({
      domain: "Cloud Concepts",
      total: 2,
      correct: 1,
    });
    expect(secStat).toEqual({
      domain: "Security and Compliance",
      total: 1,
      correct: 0,
    });
  });

  it("does not leak attempts from other sessions", async () => {
    const q = await insertQuestion(db, sampleClf);

    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s2",
    });

    const stats = await getAttemptStats(db, "s1", "CLF-C02");
    expect(stats.total).toBe(1);
    expect(stats.correct).toBe(1);
  });
});

describe("getQuestionStats", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("omits questions with no attempts", async () => {
    await insertQuestion(db, sampleClf);
    expect(await getQuestionStats(db, "s1")).toEqual([]);
  });

  it("returns avgCorrectLast3 = 1 and totalAttempts = 1 for a single correct attempt", async () => {
    const q = await insertQuestion(db, sampleClf);
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });

    const [stat] = await getQuestionStats(db, "s1");
    expect(stat.id).toBe(q.id);
    expect(stat.avgCorrectLast3).toBe(1);
    expect(stat.totalAttempts).toBe(1);
  });

  it("averages exactly 3 attempts (2 right, 1 wrong → ≈0.6667)", async () => {
    const q = await insertQuestion(db, sampleClf);
    for (const correct of [true, false, true]) {
      await ins(db, {
        questionId: q.id,
        selected: ["A"],
        correct,
        sessionId: "s1",
      });
      await sleep(5);
    }

    const [stat] = await getQuestionStats(db, "s1");
    expect(stat.avgCorrectLast3).toBeCloseTo(2 / 3, 4);
    expect(stat.totalAttempts).toBe(3);
  });

  it("considers only the most recent 3 attempts but counts all in totalAttempts", async () => {
    const q = await insertQuestion(db, sampleClf);
    // 5 attempts in chronological order: F, F, T, T, T
    // → last 3 are all true → avg = 1.0, totalAttempts = 5
    // Explicit timestamps because the schema stores seconds-precision and
    // multiple inserts in the same second would have undefined ordering.
    const base = Math.floor(Date.now() / 1000);
    const sequence = [false, false, true, true, true];
    for (let i = 0; i < sequence.length; i++) {
      await ins(db, {
        questionId: q.id,
        selected: ["A"],
        correct: sequence[i],
        sessionId: "s1",
        answeredAt: new Date((base + i) * 1000),
      });
    }

    const [stat] = await getQuestionStats(db, "s1");
    expect(stat.avgCorrectLast3).toBe(1);
    expect(stat.totalAttempts).toBe(5);
  });

  it("isolates by session", async () => {
    const q = await insertQuestion(db, sampleClf);
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "sA",
    });
    await ins(db, {
      questionId: q.id,
      selected: ["B"],
      correct: false,
      sessionId: "sB",
    });

    expect(await getQuestionStats(db, "sA")).toHaveLength(1);
    expect((await getQuestionStats(db, "sA"))[0].avgCorrectLast3).toBe(1);
    expect((await getQuestionStats(db, "sB"))[0].avgCorrectLast3).toBe(0);
  });
});

describe("getDomainStats", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("aggregates avgCorrectRate over questions with ≥2 attempts, separates unseen counts", async () => {
    const cloud = await insertQuestion(db, sampleClf);
    const cloud2 = await insertQuestion(db, {
      ...sampleClf,
      prompt: "Other cloud question",
    });
    const security = await insertQuestion(db, {
      ...sampleClf,
      domain: "Security and Compliance",
      prompt: "Sec q",
    });

    // cloud: 2 attempts, both correct → avg 1.0
    await ins(db, {
      questionId: cloud.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    await sleep(5);
    await ins(db, {
      questionId: cloud.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    // cloud2: only 1 attempt → excluded from avgCorrectRate
    await ins(db, {
      questionId: cloud2.id,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    // security: 0 attempts → unseen

    void security;

    const stats = await getDomainStats(db, "s1", "CLF-C02");
    const cc = stats.find((d) => d.domain === "Cloud Concepts")!;
    const sec = stats.find((d) => d.domain === "Security and Compliance")!;

    // Cloud Concepts: only cloud (≥2 attempts) counts toward avg; cloud2 (1 attempt) excluded.
    expect(cc.avgCorrectRate).toBe(1);
    expect(cc.questionsPracticed).toBe(2);
    expect(cc.questionsUnseen).toBe(0);

    expect(sec.avgCorrectRate).toBeNull();
    expect(sec.questionsPracticed).toBe(0);
    expect(sec.questionsUnseen).toBe(1);
  });

  it("respects the cert filter", async () => {
    await insertQuestion(db, sampleClf);
    await insertQuestion(db, sampleSaa);
    const stats = await getDomainStats(db, "s1", "CLF-C02");
    expect(stats.some((d) => d.domain === "Cloud Concepts")).toBe(true);
    expect(stats.some((d) => d.domain === "Design Secure Architectures")).toBe(
      false,
    );
  });
});

describe("getNeverSeenQuestions", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns questions without any attempt for the given session", async () => {
    const q1 = await insertQuestion(db, sampleClf);
    const q2 = await insertQuestion(db, { ...sampleClf, prompt: "Q2" });
    await insertQuestion(db, { ...sampleClf, prompt: "Q3" });

    await ins(db, {
      questionId: q1.id,
      selected: ["A"],
      correct: true,
      sessionId: "sA",
    });

    const unseen = await getNeverSeenQuestions(db, "sA", "CLF-C02");
    expect(unseen.map((q) => q.id).sort()).toEqual(
      [q2.id, q2.id + 1].sort(),
    );
  });

  it("treats a question as unseen for session-a even if session-b answered it", async () => {
    const q = await insertQuestion(db, sampleClf);
    await ins(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "sB",
    });

    const unseen = await getNeverSeenQuestions(db, "sA", "CLF-C02");
    expect(unseen).toHaveLength(1);
    expect(unseen[0].id).toBe(q.id);
  });

  it("respects the cert filter", async () => {
    await insertQuestion(db, sampleClf);
    await insertQuestion(db, sampleSaa);

    const clf = await getNeverSeenQuestions(db, "sA", "CLF-C02");
    expect(clf).toHaveLength(1);
    expect(clf[0].cert).toBe("CLF-C02");
  });
});

describe("selectRoundQuestions", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  async function seedPool(n: number, domain = "Cloud Concepts") {
    const ids: number[] = [];
    for (let i = 0; i < n; i++) {
      const q = await insertQuestion(db, {
        ...sampleClf,
        domain,
        prompt: `Q${i}`,
      });
      ids.push(q.id);
    }
    return ids;
  }

  it("random: limits to count", async () => {
    await seedPool(10);
    const ids = await selectRoundQuestions(db, {
      cert: "CLF-C02",
      userId: "s1",
      count: 3,
      mode: "random",
      seed: 42,
    });
    expect(ids).toHaveLength(3);
  });

  it("count > pool: returns pool size, no padding", async () => {
    await seedPool(5);
    const ids = await selectRoundQuestions(db, {
      cert: "CLF-C02",
      userId: "s1",
      count: 100,
      mode: "random",
      seed: 42,
    });
    expect(ids).toHaveLength(5);
  });

  it("count = 'all' returns full pool", async () => {
    await seedPool(7);
    const ids = await selectRoundQuestions(db, {
      cert: "CLF-C02",
      userId: "s1",
      count: "all",
      mode: "random",
      seed: 42,
    });
    expect(ids).toHaveLength(7);
  });

  it("filters by domain", async () => {
    await seedPool(3, "Cloud Concepts");
    const secIds = await seedPool(2, "Security and Compliance");
    const ids = await selectRoundQuestions(db, {
      cert: "CLF-C02",
      userId: "s1",
      domain: "Security and Compliance",
      count: "all",
      mode: "random",
      seed: 42,
    });
    expect(ids.sort()).toEqual(secIds.sort());
  });

  it("weakest-first with no attempts falls back to non-empty random order", async () => {
    await seedPool(5);
    const ids = await selectRoundQuestions(db, {
      cert: "CLF-C02",
      userId: "s1",
      count: 5,
      mode: "weakest-first",
      seed: 42,
    });
    expect(ids).toHaveLength(5);
  });

  it("weakest-first: unseen first, then weakest practiced", async () => {
    const [a, b, c] = await seedPool(3);
    // B: 2× falsch → avg = 0
    await ins(db, {
      questionId: b,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    await ins(db, {
      questionId: b,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    // C: 2× richtig → avg = 1
    await ins(db, {
      questionId: c,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    await ins(db, {
      questionId: c,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    // A bleibt unseen

    const ids = await selectRoundQuestions(db, {
      cert: "CLF-C02",
      userId: "s1",
      count: 3,
      mode: "weakest-first",
      seed: 42,
    });
    expect(ids).toEqual([a, b, c]);
  });

  it("weakest-first respects session isolation", async () => {
    const [a] = await seedPool(1);
    // sessionB beantwortet richtig — sessionA sieht A trotzdem als unseen
    await ins(db, {
      questionId: a,
      selected: ["A"],
      correct: true,
      sessionId: "sB",
    });

    const ids = await selectRoundQuestions(db, {
      cert: "CLF-C02",
      userId: "sA",
      count: 1,
      mode: "weakest-first",
      seed: 42,
    });
    expect(ids).toEqual([a]);
  });
});

describe("getFlashcards", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns flashcards for the requested cert, ordered by id", async () => {
    await db.insert(flashcards)
      .values([
        {
          cert: "CLF-C02",
          domain: "Cloud Technology and Services",
          front: "F1",
          back: "B1",
        },
        {
          cert: "CLF-C02",
          domain: "Cloud Technology and Services",
          front: "F2",
          back: "B2",
        },
        {
          cert: "SAA-C03",
          domain: "Design Secure Architectures",
          front: "F3",
          back: "B3",
        },
      ])
      .run();

    const clf = await getFlashcards(db, "CLF-C02");
    expect(clf).toHaveLength(2);
    expect(clf[0].front).toBe("F1");
    expect(clf[1].front).toBe("F2");
    expect(clf[0].id).toBeLessThan(clf[1].id);

    const saa = await getFlashcards(db, "SAA-C03");
    expect(saa).toHaveLength(1);
    expect(saa[0].front).toBe("F3");
  });

  it("returns an empty array when no cards match", async () => {
    expect(await getFlashcards(db, "CLF-C02")).toEqual([]);
  });

  it("roundtrips iconSlugs as a JSON array (null + populated)", async () => {
    await db.insert(flashcards)
      .values([
        {
          cert: "CLF-C02",
          domain: "Cloud Technology and Services",
          front: "no icons",
          back: "B",
        },
        {
          cert: "CLF-C02",
          domain: "Cloud Technology and Services",
          front: "with icons",
          back: "B",
          iconSlugs: ["ec2", "s3"],
        },
      ])
      .run();

    const rows = await getFlashcards(db, "CLF-C02");
    const noIcons = rows.find((r) => r.front === "no icons")!;
    const withIcons = rows.find((r) => r.front === "with icons")!;
    expect(noIcons.iconSlugs).toBeNull();
    expect(withIcons.iconSlugs).toEqual(["ec2", "s3"]);
  });
});

describe("flashcard view tracking", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
    await db.insert(flashcards)
      .values([
        { cert: "CLF-C02", domain: "Cloud Concepts", front: "F1", back: "B1" },
        { cert: "CLF-C02", domain: "Cloud Concepts", front: "F2", back: "B2" },
        {
          cert: "SAA-C03",
          domain: "Design Secure Architectures",
          front: "F3",
          back: "B3",
        },
      ])
      .run();
  });

  it("counts only seen flashcards for this user, scoped by cert", async () => {
    const [c1, c2] = await getFlashcards(db, "CLF-C02");
    expect(await countSeenFlashcards(db, "CLF-C02", "oktay")).toBe(0);

    await markFlashcardSeen(db, c1.id, "oktay");
    expect(await countSeenFlashcards(db, "CLF-C02", "oktay")).toBe(1);

    // marking the same card again keeps the count at 1 (upsert on card+user)
    await markFlashcardSeen(db, c1.id, "oktay");
    expect(await countSeenFlashcards(db, "CLF-C02", "oktay")).toBe(1);

    await markFlashcardSeen(db, c2.id, "oktay");
    expect(await countSeenFlashcards(db, "CLF-C02", "oktay")).toBe(2);

    await resetFlashcardViews(db, "CLF-C02", "oktay");
    expect(await countSeenFlashcards(db, "CLF-C02", "oktay")).toBe(0);
  });

  it("does not affect other certs when resetting", async () => {
    const [c1] = await getFlashcards(db, "CLF-C02");
    const [s1] = await getFlashcards(db, "SAA-C03");
    await markFlashcardSeen(db, c1.id, "oktay");
    await markFlashcardSeen(db, s1.id, "oktay");

    await resetFlashcardViews(db, "CLF-C02", "oktay");
    expect(await countSeenFlashcards(db, "CLF-C02", "oktay")).toBe(0);
    expect(await countSeenFlashcards(db, "SAA-C03", "oktay")).toBe(1);
  });

  it("tracks the same card separately per user, with independent seen_at", async () => {
    const [c1] = await getFlashcards(db, "CLF-C02");

    await markFlashcardSeen(db, c1.id, "oktay");
    await markFlashcardSeen(db, c1.id, "merve");

    // Both users have one seen card — no cross-overwrite.
    expect(await countSeenFlashcards(db, "CLF-C02", "oktay")).toBe(1);
    expect(await countSeenFlashcards(db, "CLF-C02", "merve")).toBe(1);

    // Two distinct rows for the same card, one per user.
    const rows = await db
      .select()
      .from(flashcardViews)
      .where(eq(flashcardViews.cardId, c1.id))
      .all();
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r) => r.userId))).toEqual(
      new Set(["oktay", "merve"]),
    );
    expect(rows.every((r) => r.seenAt instanceof Date)).toBe(true);
  });

  it("resetting one user's views leaves the other user untouched", async () => {
    const [c1] = await getFlashcards(db, "CLF-C02");
    await markFlashcardSeen(db, c1.id, "oktay");
    await markFlashcardSeen(db, c1.id, "merve");

    await resetFlashcardViews(db, "CLF-C02", "oktay");
    expect(await countSeenFlashcards(db, "CLF-C02", "oktay")).toBe(0);
    expect(await countSeenFlashcards(db, "CLF-C02", "merve")).toBe(1);
  });

  it("throws on FK violation when card_id does not exist", async () => {
    await expect(markFlashcardSeen(db, 9999, "oktay")).rejects.toThrow();
  });
});

describe("getOverallAvgLast3", () => {
  let db: DB;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns null when no attempts exist", async () => {
    await insertQuestion(db, sampleClf);
    expect(await getOverallAvgLast3(db, "s1", "CLF-C02")).toBeNull();
  });

  it("averages last-3 across questions with >=2 attempts", async () => {
    const q1 = await insertQuestion(db, sampleClf);
    const q2 = await insertQuestion(db, { ...sampleClf, prompt: "Q2" });

    // q1: 2 attempts, 1 correct → 0.5
    await ins(db, {
      questionId: q1.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    await ins(db, {
      questionId: q1.id,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    // q2: 2 attempts, 2 correct → 1.0
    await ins(db, {
      questionId: q2.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    await ins(db, {
      questionId: q2.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });

    const avg = await getOverallAvgLast3(db, "s1", "CLF-C02");
    expect(avg).not.toBeNull();
    expect(avg).toBeCloseTo(0.75, 4);
  });
});

describe("getDomainPerformance", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("aggregates attempts/correct/distinct questions per domain", async () => {
    const q1 = await insertQuestion(db, { ...sampleClf, domain: "Cloud Concepts", prompt: "q1" });
    const q2 = await insertQuestion(db, { ...sampleClf, domain: "Cloud Concepts", prompt: "q2" });
    const q3 = await insertQuestion(db, { ...sampleClf, domain: "Security and Compliance", prompt: "q3" });
    // unused-but-present question to confirm questionsCount counts all cert questions
    await insertQuestion(db, { ...sampleClf, domain: "Billing, Pricing, and Support", prompt: "q4" });

    await ins(db, { questionId: q1.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: q1.id, selected: ["B"], correct: false, sessionId: "s1" });
    await ins(db, { questionId: q2.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: q3.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: q3.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: q3.id, selected: ["B"], correct: false, sessionId: "s1" });

    const perf = await getDomainPerformance(db, "s1", "CLF-C02");
    const byDomain = Object.fromEntries(perf.map((p) => [p.domain, p]));

    expect(byDomain["Cloud Concepts"].attempts).toBe(3);
    expect(byDomain["Cloud Concepts"].correct).toBe(2);
    expect(byDomain["Cloud Concepts"].rate).toBeCloseTo(2 / 3, 4);
    expect(byDomain["Cloud Concepts"].questionsCount).toBe(2);

    expect(byDomain["Security and Compliance"].attempts).toBe(3);
    expect(byDomain["Security and Compliance"].correct).toBe(2);
    expect(byDomain["Security and Compliance"].rate).toBeCloseTo(2 / 3, 4);
    expect(byDomain["Security and Compliance"].questionsCount).toBe(1);

    expect(byDomain["Billing, Pricing, and Support"].attempts).toBe(0);
    expect(byDomain["Billing, Pricing, and Support"].rate).toBeNull();
    expect(byDomain["Billing, Pricing, and Support"].questionsCount).toBe(1);
  });

  it("ignores attempts from other certs and other sessions", async () => {
    const qClf = await insertQuestion(db, { ...sampleClf, prompt: "clf" });
    const qSaa = await insertQuestion(db, { ...sampleSaa, prompt: "saa" });

    await ins(db, { questionId: qClf.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: qClf.id, selected: ["B"], correct: false, sessionId: "s2" });
    await ins(db, { questionId: qSaa.id, selected: ["A"], correct: true, sessionId: "s1" });

    const perf = await getDomainPerformance(db, "s1", "CLF-C02");
    const cc = perf.find((p) => p.domain === "Cloud Concepts")!;
    expect(cc.attempts).toBe(1);
    expect(cc.correct).toBe(1);
  });
});

describe("getWeakestQuestions", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns questions with >=1 wrong attempt sorted by wrongCount DESC", async () => {
    const q1 = await insertQuestion(db, { ...sampleClf, prompt: "q1" });
    const q2 = await insertQuestion(db, { ...sampleClf, prompt: "q2" });
    const q3 = await insertQuestion(db, { ...sampleClf, prompt: "q3" });
    const qAllCorrect = await insertQuestion(db, { ...sampleClf, prompt: "qAllCorrect" });

    // q1: 1 wrong
    await ins(db, { questionId: q1.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: q1.id, selected: ["B"], correct: false, sessionId: "s1" });
    // q2: 3 wrong
    await ins(db, { questionId: q2.id, selected: ["B"], correct: false, sessionId: "s1" });
    await ins(db, { questionId: q2.id, selected: ["B"], correct: false, sessionId: "s1" });
    await ins(db, { questionId: q2.id, selected: ["B"], correct: false, sessionId: "s1" });
    // q3: 2 wrong (also includes a correct attempt — shouldn't count)
    await ins(db, { questionId: q3.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: q3.id, selected: ["B"], correct: false, sessionId: "s1" });
    await ins(db, { questionId: q3.id, selected: ["B"], correct: false, sessionId: "s1" });
    // qAllCorrect: 2 right, 0 wrong → excluded
    await ins(db, { questionId: qAllCorrect.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: qAllCorrect.id, selected: ["A"], correct: true, sessionId: "s1" });

    const weakest = await getWeakestQuestions(db, "s1", "CLF-C02");
    expect(weakest.map((w) => w.id)).toEqual([q2.id, q3.id, q1.id]);
    expect(weakest[0].wrongCount).toBe(3);
    expect(weakest[1].wrongCount).toBe(2);
    expect(weakest[2].wrongCount).toBe(1);
    // correctAnswerText resolved from choices + correct ("A" -> "Auto-scaling capacity")
    expect(weakest[0].correctAnswerText).toBe("Auto-scaling capacity");
  });

  it("includes attempts with round_id NULL", async () => {
    const q = await insertQuestion(db, { ...sampleClf, prompt: "qNoRound" });
    await ins(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "s1" });
    const weakest = await getWeakestQuestions(db, "s1", "CLF-C02");
    expect(weakest).toHaveLength(1);
    expect(weakest[0].wrongCount).toBe(1);
  });

  it("respects the limit parameter", async () => {
    for (let i = 0; i < 5; i++) {
      const q = await insertQuestion(db, { ...sampleClf, prompt: `q${i}` });
      await ins(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "s1" });
      await ins(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "s1" });
    }
    const weakest = await getWeakestQuestions(db, "s1", "CLF-C02", 3);
    expect(weakest).toHaveLength(3);
  });
});

describe("getPersistentWeakest", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("ranks by wrong RATE and applies the minAttempts floor", async () => {
    const hi = await insertQuestion(db, { ...sampleClf, prompt: "hi-rate" });
    const lo = await insertQuestion(db, { ...sampleClf, prompt: "lo-rate" });
    const single = await insertQuestion(db, { ...sampleClf, prompt: "single" });

    // hi: 2/2 wrong = 100%
    await ins(db, { questionId: hi.id, selected: ["B"], correct: false, sessionId: "s1" });
    await ins(db, { questionId: hi.id, selected: ["B"], correct: false, sessionId: "s1" });
    // lo: 1/4 wrong = 25%
    await ins(db, { questionId: lo.id, selected: ["B"], correct: false, sessionId: "s1" });
    await ins(db, { questionId: lo.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: lo.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: lo.id, selected: ["A"], correct: true, sessionId: "s1" });
    // single: 1/1 wrong — excluded by minAttempts=2 (a single miss isn't 100%)
    await ins(db, { questionId: single.id, selected: ["B"], correct: false, sessionId: "s1" });

    const weak = await getPersistentWeakest(db, "s1", "CLF-C02", 4, 2);
    expect(weak.map((w) => w.id)).toEqual([hi.id, lo.id]);
    expect(weak[0].wrongRate).toBe(1);
    expect(weak[0].attempts).toBe(2);
    expect(weak[1].wrongRate).toBeCloseTo(0.25);
  });

  it("filters by user_id alone (identity guard)", async () => {
    const q = await insertQuestion(db, sampleClf);
    await insertAttempt(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "shared", userId: "oktay" });
    await insertAttempt(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "shared", userId: "oktay" });
    await insertAttempt(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "shared", userId: "merve" });
    await insertAttempt(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "shared", userId: "merve" });

    expect(await getPersistentWeakest(db, "oktay", "CLF-C02")).toHaveLength(1);
    expect(await getPersistentWeakest(db, "merve", "CLF-C02")).toHaveLength(1);
    expect(await getPersistentWeakest(db, "nobody", "CLF-C02")).toHaveLength(0);
  });
});

describe("getLastRoundReview", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("returns empty review when no round_id has been recorded", async () => {
    const q = await insertQuestion(db, sampleClf);
    await ins(db, {
      questionId: q.id, selected: ["A"], correct: true, sessionId: "s1",
    });
    const review = await getLastRoundReview(db, "s1", "CLF-C02");
    expect(review.roundId).toBeNull();
    expect(review.correct).toEqual([]);
    expect(review.incorrect).toEqual([]);
    expect(review.correctCount).toBe(0);
    expect(review.incorrectCount).toBe(0);
  });

  it("returns the latest round's attempts split into correct/incorrect", async () => {
    const q1 = await insertQuestion(db, { ...sampleClf, prompt: "q1" });
    const q2 = await insertQuestion(db, { ...sampleClf, prompt: "q2" });
    const q3 = await insertQuestion(db, { ...sampleClf, prompt: "q3" });

    // Older round r-old: all correct
    await ins(db, {
      questionId: q1.id, selected: ["A"], correct: true,
      sessionId: "s1", roundId: "r-old",
      answeredAt: new Date(1_700_000_000_000),
    });
    // Latest round r-new: q1 right, q2 wrong, q3 wrong
    await ins(db, {
      questionId: q1.id, selected: ["A"], correct: true,
      sessionId: "s1", roundId: "r-new",
      answeredAt: new Date(1_700_000_100_000),
    });
    await ins(db, {
      questionId: q2.id, selected: ["B"], correct: false,
      sessionId: "s1", roundId: "r-new",
      answeredAt: new Date(1_700_000_200_000),
    });
    await ins(db, {
      questionId: q3.id, selected: ["B"], correct: false,
      sessionId: "s1", roundId: "r-new",
      answeredAt: new Date(1_700_000_300_000),
    });

    const review = await getLastRoundReview(db, "s1", "CLF-C02");
    expect(review.roundId).toBe("r-new");
    expect(review.correctCount).toBe(1);
    expect(review.incorrectCount).toBe(2);
    expect(review.correct.map((q) => q.questionId)).toEqual([q1.id]);
    expect(review.incorrect.map((q) => q.questionId).sort()).toEqual(
      [q2.id, q3.id].sort(),
    );
    expect(review.correct[0].correctAnswerText).toBe("Auto-scaling capacity");
    expect(review.correct[0].isCorrect).toBe(true);
    expect(review.incorrect[0].isCorrect).toBe(false);
  });

  it("uses the latest attempt per question when a round retried it", async () => {
    const q = await insertQuestion(db, sampleClf);
    // q answered wrong, then re-attempted right within the same round
    await ins(db, {
      questionId: q.id, selected: ["B"], correct: false,
      sessionId: "s1", roundId: "r1",
      answeredAt: new Date(1_700_000_000_000),
    });
    await ins(db, {
      questionId: q.id, selected: ["A"], correct: true,
      sessionId: "s1", roundId: "r1",
      answeredAt: new Date(1_700_000_010_000),
    });

    const review = await getLastRoundReview(db, "s1", "CLF-C02");
    expect(review.roundId).toBe("r1");
    expect(review.correctCount).toBe(1);
    expect(review.incorrectCount).toBe(0);
  });

  it("ignores rounds from other certs", async () => {
    const clf = await insertQuestion(db, sampleClf);
    const saa = await insertQuestion(db, sampleSaa);

    await ins(db, {
      questionId: saa.id, selected: ["B"], correct: false,
      sessionId: "s1", roundId: "r-saa-newer",
      answeredAt: new Date(1_700_000_500_000),
    });
    await ins(db, {
      questionId: clf.id, selected: ["A"], correct: true,
      sessionId: "s1", roundId: "r-clf-older",
      answeredAt: new Date(1_700_000_100_000),
    });

    const review = await getLastRoundReview(db, "s1", "CLF-C02");
    expect(review.roundId).toBe("r-clf-older");
    expect(review.correctCount).toBe(1);
  });
});

describe("countAnsweredQuestions", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  it("counts distinct questions answered in this cert+session", async () => {
    const q1 = await insertQuestion(db, { ...sampleClf, prompt: "q1" });
    const q2 = await insertQuestion(db, { ...sampleClf, prompt: "q2" });
    const qSaa = await insertQuestion(db, { ...sampleSaa, prompt: "saa" });

    await ins(db, { questionId: q1.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: q1.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: q2.id, selected: ["A"], correct: true, sessionId: "s1" });
    await ins(db, { questionId: qSaa.id, selected: ["A"], correct: true, sessionId: "s1" });

    expect(await countAnsweredQuestions(db, "s1", "CLF-C02")).toBe(2);
    expect(await countAnsweredQuestions(db, "s1", "SAA-C03")).toBe(1);
    expect(await countAnsweredQuestions(db, "s2", "CLF-C02")).toBe(0);
  });
});

describe("getRoundTrend", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  const t = (offsetSec: number) => new Date(1_700_000_000_000 + offsetSec * 1000);

  it("groups by round_id and returns chronological order by lastAt", async () => {
    const q = await insertQuestion(db, { ...sampleClf, prompt: "q" });

    // r1: 2/2
    await ins(db, { questionId: q.id, selected: ["A"], correct: true, sessionId: "s1", roundId: "r1", answeredAt: t(10) });
    await ins(db, { questionId: q.id, selected: ["A"], correct: true, sessionId: "s1", roundId: "r1", answeredAt: t(20) });
    // r2: 1/2
    await ins(db, { questionId: q.id, selected: ["A"], correct: true, sessionId: "s1", roundId: "r2", answeredAt: t(30) });
    await ins(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "s1", roundId: "r2", answeredAt: t(40) });
    // r3: 0/2
    await ins(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "s1", roundId: "r3", answeredAt: t(50) });
    await ins(db, { questionId: q.id, selected: ["B"], correct: false, sessionId: "s1", roundId: "r3", answeredAt: t(60) });

    const trend = await getRoundTrend(db, "s1", "CLF-C02");
    expect(trend.map((p) => p.roundId)).toEqual(["r1", "r2", "r3"]);
    expect(trend[0].rate).toBe(1);
    expect(trend[1].rate).toBeCloseTo(0.5, 4);
    expect(trend[2].rate).toBe(0);
    expect(trend[0].attempts).toBe(2);
  });

  it("ignores attempts with NULL round_id", async () => {
    const q = await insertQuestion(db, { ...sampleClf, prompt: "q" });
    await ins(db, { questionId: q.id, selected: ["A"], correct: true, sessionId: "s1", answeredAt: t(10) });
    await ins(db, { questionId: q.id, selected: ["A"], correct: true, sessionId: "s1", roundId: "r1", answeredAt: t(20) });

    const trend = await getRoundTrend(db, "s1", "CLF-C02");
    expect(trend).toHaveLength(1);
    expect(trend[0].roundId).toBe("r1");
  });

  it("returns only the most recent N rounds", async () => {
    const q = await insertQuestion(db, { ...sampleClf, prompt: "q" });
    for (let i = 0; i < 15; i++) {
      await ins(db, {
        questionId: q.id,
        selected: ["A"],
        correct: true,
        sessionId: "s1",
        roundId: `r${i}`,
        answeredAt: t(i * 10),
      });
    }
    const trend = await getRoundTrend(db, "s1", "CLF-C02", 10);
    expect(trend).toHaveLength(10);
    // chronological: oldest of the 10 youngest first → r5..r14
    expect(trend[0].roundId).toBe("r5");
    expect(trend[9].roundId).toBe("r14");
  });
});

// Guard for the kept-but-unfiltered session_id column: one user learning on two
// devices (two session_ids) must see ALL their progress, regardless of session.
// If any read query secretly (re-)added an `AND session_id = ?` filter, it would
// see only one device's attempts and these counts would drop — making the test
// red. The browser smoke test runs on a single device (one session_id) and so
// CANNOT distinguish user_id-only from additive filtering; this is that proof.
describe("read queries filter by user_id only, never session_id", () => {
  let db: DB;
  beforeEach(async () => {
    db = await createTestDb();
  });

  const t = (offsetSec: number) =>
    new Date(1_700_000_000_000 + offsetSec * 1000);

  // Same user, two different sessions/devices. q1 always right, q2 always wrong.
  async function seedTwoDeviceUser() {
    const q1 = await insertQuestion(db, { ...sampleClf, prompt: "q1" });
    const q2 = await insertQuestion(db, { ...sampleClf, prompt: "q2" });
    // device A → round rA
    await insertAttempt(db, { questionId: q1.id, selected: ["A"], correct: true, userId: "oktay", sessionId: "device-a", roundId: "rA", answeredAt: t(10) });
    await insertAttempt(db, { questionId: q2.id, selected: ["B"], correct: false, userId: "oktay", sessionId: "device-a", roundId: "rA", answeredAt: t(20) });
    // device B → round rB (different session, SAME user)
    await insertAttempt(db, { questionId: q1.id, selected: ["A"], correct: true, userId: "oktay", sessionId: "device-b", roundId: "rB", answeredAt: t(30) });
    await insertAttempt(db, { questionId: q2.id, selected: ["B"], correct: false, userId: "oktay", sessionId: "device-b", roundId: "rB", answeredAt: t(40) });
    return { q1, q2 };
  }

  it("getAttemptStats / getLastNAttempts span both sessions of the user", async () => {
    await seedTwoDeviceUser();
    const stats = await getAttemptStats(db, "oktay", "CLF-C02");
    expect(stats.total).toBe(4); // not 2 — both devices counted
    expect(stats.correct).toBe(2);
    expect(await getLastNAttempts(db, "oktay", 10)).toHaveLength(4);
  });

  it("countAnsweredQuestions / getOverallAvgLast3 span both sessions", async () => {
    await seedTwoDeviceUser();
    expect(await countAnsweredQuestions(db, "oktay", "CLF-C02")).toBe(2);
    // q1 (2× right)=1, q2 (2× wrong)=0 → overall 0.5, only possible if both
    // sessions' attempts contribute to each question's last-3.
    expect(await getOverallAvgLast3(db, "oktay", "CLF-C02")).toBeCloseTo(0.5, 4);
  });

  it("getDomainPerformance / getWeakestQuestions span both sessions", async () => {
    const { q2 } = await seedTwoDeviceUser();
    const perf = await getDomainPerformance(db, "oktay", "CLF-C02");
    const cc = perf.find((p) => p.domain === "Cloud Concepts")!;
    expect(cc.attempts).toBe(4);
    expect(cc.correct).toBe(2);

    const weakest = await getWeakestQuestions(db, "oktay", "CLF-C02");
    const q2Weak = weakest.find((w) => w.id === q2.id)!;
    expect(q2Weak.wrongCount).toBe(2); // both sessions' wrong attempts
  });

  it("getRoundTrend / getLastRoundReview span both sessions", async () => {
    await seedTwoDeviceUser();
    const trend = await getRoundTrend(db, "oktay", "CLF-C02");
    // Both rounds visible despite living on different sessions.
    expect(trend.map((p) => p.roundId)).toEqual(["rA", "rB"]);

    const review = await getLastRoundReview(db, "oktay", "CLF-C02");
    expect(review.roundId).toBe("rB"); // latest round, on device-b
    expect(review.correctCount).toBe(1);
    expect(review.incorrectCount).toBe(1);
  });

  it("a different user_id sees none of oktay's two-session data", async () => {
    await seedTwoDeviceUser();
    expect(await getAttemptStats(db, "merve", "CLF-C02")).toEqual({
      total: 0,
      correct: 0,
      byDomain: [],
    });
    expect(await countAnsweredQuestions(db, "merve", "CLF-C02")).toBe(0);
    expect(await getLastNAttempts(db, "merve", 10)).toHaveLength(0);
  });
});
