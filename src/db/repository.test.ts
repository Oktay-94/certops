import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";

import type { DB } from "./index";
import * as schema from "./schema";
import {
  getAttemptStats,
  getAttemptsBySession,
  getDomainStats,
  getFlashcards,
  getLastNAttempts,
  getNeverSeenQuestions,
  getQuestionStats,
  getQuestionsByCert,
  insertAttempt,
  insertQuestion,
  selectRoundQuestions,
} from "./repository";
import { flashcards } from "./schema";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function createTestDb(): DB {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./src/db/migrations" });
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

describe("repository", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("inserts a question and returns the persisted row", () => {
    const row = insertQuestion(db, sampleClf);

    expect(row.id).toBeGreaterThan(0);
    expect(row.cert).toBe("CLF-C02");
    expect(row.choices).toEqual(sampleClf.choices);
    expect(row.correct).toEqual(["A"]);
    expect(row.createdAt).toBeInstanceOf(Date);
    expect(row.updatedAt).toBeInstanceOf(Date);
  });

  it("returns only questions for the requested cert", () => {
    insertQuestion(db, sampleClf);
    insertQuestion(db, sampleSaa);

    const clf = getQuestionsByCert(db, "CLF-C02");
    expect(clf).toHaveLength(1);
    expect(clf[0].cert).toBe("CLF-C02");

    const saa = getQuestionsByCert(db, "SAA-C03");
    expect(saa).toHaveLength(1);
    expect(saa[0].cert).toBe("SAA-C03");
  });

  it("filters by domain when provided", () => {
    insertQuestion(db, sampleClf);
    insertQuestion(db, { ...sampleClf, domain: "Security and Compliance", prompt: "Other" });

    const cloud = getQuestionsByCert(db, "CLF-C02", { domain: "Cloud Concepts" });
    expect(cloud).toHaveLength(1);
    expect(cloud[0].domain).toBe("Cloud Concepts");
  });

  it("returns an empty array when no questions match", () => {
    expect(getQuestionsByCert(db, "CLF-C02")).toEqual([]);
  });
});

describe("question_attempts", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("inserts an attempt and returns the persisted row", () => {
    const q = insertQuestion(db, sampleClf);

    const row = insertAttempt(db, {
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
    expect(row.answeredAt).toBeInstanceOf(Date);
  });

  it("throws on FK violation when question_id does not exist", () => {
    expect(() =>
      insertAttempt(db, {
        questionId: 9999,
        selected: ["A"],
        correct: false,
        sessionId: "session-x",
      }),
    ).toThrow();
  });

  it("getAttemptsBySession returns only attempts for the requested session", () => {
    const q = insertQuestion(db, sampleClf);

    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-a",
    });
    insertAttempt(db, {
      questionId: q.id,
      selected: ["B"],
      correct: false,
      sessionId: "session-a",
    });
    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-b",
    });

    const a = getAttemptsBySession(db, "session-a");
    expect(a).toHaveLength(2);
    expect(a.every((r) => r.sessionId === "session-a")).toBe(true);

    expect(getAttemptsBySession(db, "session-unknown")).toEqual([]);
  });

  it("roundtrips multi-select selected JSON array", () => {
    const q = insertQuestion(db, sampleClf);

    const row = insertAttempt(db, {
      questionId: q.id,
      selected: ["A", "C"],
      correct: false,
      sessionId: "session-multi",
      timeTakenMs: 4200,
    });

    expect(row.selected).toEqual(["A", "C"]);
    expect(row.timeTakenMs).toBe(4200);

    const [reloaded] = getAttemptsBySession(db, "session-multi");
    expect(reloaded.selected).toEqual(["A", "C"]);
  });
});

describe("getLastNAttempts", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("returns an empty array for an unknown session", () => {
    expect(getLastNAttempts(db, "session-none", 5)).toEqual([]);
  });

  it("returns at most n attempts, newest first", async () => {
    const q = insertQuestion(db, sampleClf);

    for (let i = 0; i < 5; i++) {
      insertAttempt(db, {
        questionId: q.id,
        selected: ["A"],
        correct: i % 2 === 0,
        sessionId: "session-x",
      });
      // small gap so answeredAt differs reliably
      await new Promise((r) => setTimeout(r, 5));
    }

    const last3 = getLastNAttempts(db, "session-x", 3);
    expect(last3).toHaveLength(3);

    const timestamps = last3.map((a) => a.answeredAt.getTime());
    const sorted = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sorted);
  });

  it("isolates by session", () => {
    const q = insertQuestion(db, sampleClf);

    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-a",
    });
    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "session-b",
    });

    expect(getLastNAttempts(db, "session-a", 10)).toHaveLength(1);
  });
});

describe("getAttemptStats", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("returns zeroed stats for a session with no attempts", () => {
    expect(getAttemptStats(db, "session-empty")).toEqual({
      total: 0,
      correct: 0,
      byDomain: [],
    });
  });

  it("aggregates totals and per-domain counts", () => {
    const cloud = insertQuestion(db, sampleClf);
    const security = insertQuestion(db, {
      ...sampleClf,
      domain: "Security and Compliance",
      prompt: "S?",
    });

    insertAttempt(db, {
      questionId: cloud.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    insertAttempt(db, {
      questionId: cloud.id,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    insertAttempt(db, {
      questionId: security.id,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });

    const stats = getAttemptStats(db, "s1");
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

  it("does not leak attempts from other sessions", () => {
    const q = insertQuestion(db, sampleClf);

    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s2",
    });

    const stats = getAttemptStats(db, "s1");
    expect(stats.total).toBe(1);
    expect(stats.correct).toBe(1);
  });
});

describe("getQuestionStats", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("omits questions with no attempts", async () => {
    insertQuestion(db, sampleClf);
    expect(getQuestionStats(db, "s1")).toEqual([]);
  });

  it("returns avgCorrectLast3 = 1 and totalAttempts = 1 for a single correct attempt", () => {
    const q = insertQuestion(db, sampleClf);
    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });

    const [stat] = getQuestionStats(db, "s1");
    expect(stat.id).toBe(q.id);
    expect(stat.avgCorrectLast3).toBe(1);
    expect(stat.totalAttempts).toBe(1);
  });

  it("averages exactly 3 attempts (2 right, 1 wrong → ≈0.6667)", async () => {
    const q = insertQuestion(db, sampleClf);
    for (const correct of [true, false, true]) {
      insertAttempt(db, {
        questionId: q.id,
        selected: ["A"],
        correct,
        sessionId: "s1",
      });
      await sleep(5);
    }

    const [stat] = getQuestionStats(db, "s1");
    expect(stat.avgCorrectLast3).toBeCloseTo(2 / 3, 4);
    expect(stat.totalAttempts).toBe(3);
  });

  it("considers only the most recent 3 attempts but counts all in totalAttempts", () => {
    const q = insertQuestion(db, sampleClf);
    // 5 attempts in chronological order: F, F, T, T, T
    // → last 3 are all true → avg = 1.0, totalAttempts = 5
    // Explicit timestamps because the schema stores seconds-precision and
    // multiple inserts in the same second would have undefined ordering.
    const base = Math.floor(Date.now() / 1000);
    const sequence = [false, false, true, true, true];
    sequence.forEach((correct, i) => {
      insertAttempt(db, {
        questionId: q.id,
        selected: ["A"],
        correct,
        sessionId: "s1",
        answeredAt: new Date((base + i) * 1000),
      });
    });

    const [stat] = getQuestionStats(db, "s1");
    expect(stat.avgCorrectLast3).toBe(1);
    expect(stat.totalAttempts).toBe(5);
  });

  it("isolates by session", () => {
    const q = insertQuestion(db, sampleClf);
    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "sA",
    });
    insertAttempt(db, {
      questionId: q.id,
      selected: ["B"],
      correct: false,
      sessionId: "sB",
    });

    expect(getQuestionStats(db, "sA")).toHaveLength(1);
    expect(getQuestionStats(db, "sA")[0].avgCorrectLast3).toBe(1);
    expect(getQuestionStats(db, "sB")[0].avgCorrectLast3).toBe(0);
  });
});

describe("getDomainStats", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("aggregates avgCorrectRate over questions with ≥2 attempts, separates unseen counts", async () => {
    const cloud = insertQuestion(db, sampleClf);
    const cloud2 = insertQuestion(db, {
      ...sampleClf,
      prompt: "Other cloud question",
    });
    const security = insertQuestion(db, {
      ...sampleClf,
      domain: "Security and Compliance",
      prompt: "Sec q",
    });

    // cloud: 2 attempts, both correct → avg 1.0
    insertAttempt(db, {
      questionId: cloud.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    await sleep(5);
    insertAttempt(db, {
      questionId: cloud.id,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    // cloud2: only 1 attempt → excluded from avgCorrectRate
    insertAttempt(db, {
      questionId: cloud2.id,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    // security: 0 attempts → unseen

    void security;

    const stats = getDomainStats(db, "s1", "CLF-C02");
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

  it("respects the cert filter", () => {
    insertQuestion(db, sampleClf);
    insertQuestion(db, sampleSaa);
    const stats = getDomainStats(db, "s1", "CLF-C02");
    expect(stats.some((d) => d.domain === "Cloud Concepts")).toBe(true);
    expect(stats.some((d) => d.domain === "Design Secure Architectures")).toBe(
      false,
    );
  });
});

describe("getNeverSeenQuestions", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("returns questions without any attempt for the given session", () => {
    const q1 = insertQuestion(db, sampleClf);
    const q2 = insertQuestion(db, { ...sampleClf, prompt: "Q2" });
    insertQuestion(db, { ...sampleClf, prompt: "Q3" });

    insertAttempt(db, {
      questionId: q1.id,
      selected: ["A"],
      correct: true,
      sessionId: "sA",
    });

    const unseen = getNeverSeenQuestions(db, "sA", "CLF-C02");
    expect(unseen.map((q) => q.id).sort()).toEqual(
      [q2.id, q2.id + 1].sort(),
    );
  });

  it("treats a question as unseen for session-a even if session-b answered it", () => {
    const q = insertQuestion(db, sampleClf);
    insertAttempt(db, {
      questionId: q.id,
      selected: ["A"],
      correct: true,
      sessionId: "sB",
    });

    const unseen = getNeverSeenQuestions(db, "sA", "CLF-C02");
    expect(unseen).toHaveLength(1);
    expect(unseen[0].id).toBe(q.id);
  });

  it("respects the cert filter", () => {
    insertQuestion(db, sampleClf);
    insertQuestion(db, sampleSaa);

    const clf = getNeverSeenQuestions(db, "sA", "CLF-C02");
    expect(clf).toHaveLength(1);
    expect(clf[0].cert).toBe("CLF-C02");
  });
});

describe("selectRoundQuestions", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  function seedPool(n: number, domain = "Cloud Concepts") {
    const ids: number[] = [];
    for (let i = 0; i < n; i++) {
      const q = insertQuestion(db, {
        ...sampleClf,
        domain,
        prompt: `Q${i}`,
      });
      ids.push(q.id);
    }
    return ids;
  }

  it("random: limits to count", () => {
    seedPool(10);
    const ids = selectRoundQuestions(db, {
      cert: "CLF-C02",
      sessionId: "s1",
      count: 3,
      mode: "random",
      seed: 42,
    });
    expect(ids).toHaveLength(3);
  });

  it("count > pool: returns pool size, no padding", () => {
    seedPool(5);
    const ids = selectRoundQuestions(db, {
      cert: "CLF-C02",
      sessionId: "s1",
      count: 100,
      mode: "random",
      seed: 42,
    });
    expect(ids).toHaveLength(5);
  });

  it("count = 'all' returns full pool", () => {
    seedPool(7);
    const ids = selectRoundQuestions(db, {
      cert: "CLF-C02",
      sessionId: "s1",
      count: "all",
      mode: "random",
      seed: 42,
    });
    expect(ids).toHaveLength(7);
  });

  it("filters by domain", () => {
    seedPool(3, "Cloud Concepts");
    const secIds = seedPool(2, "Security and Compliance");
    const ids = selectRoundQuestions(db, {
      cert: "CLF-C02",
      sessionId: "s1",
      domain: "Security and Compliance",
      count: "all",
      mode: "random",
      seed: 42,
    });
    expect(ids.sort()).toEqual(secIds.sort());
  });

  it("weakest-first with no attempts falls back to non-empty random order", () => {
    seedPool(5);
    const ids = selectRoundQuestions(db, {
      cert: "CLF-C02",
      sessionId: "s1",
      count: 5,
      mode: "weakest-first",
      seed: 42,
    });
    expect(ids).toHaveLength(5);
  });

  it("weakest-first: unseen first, then weakest practiced", () => {
    const [a, b, c] = seedPool(3);
    // B: 2× falsch → avg = 0
    insertAttempt(db, {
      questionId: b,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    insertAttempt(db, {
      questionId: b,
      selected: ["B"],
      correct: false,
      sessionId: "s1",
    });
    // C: 2× richtig → avg = 1
    insertAttempt(db, {
      questionId: c,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    insertAttempt(db, {
      questionId: c,
      selected: ["A"],
      correct: true,
      sessionId: "s1",
    });
    // A bleibt unseen

    const ids = selectRoundQuestions(db, {
      cert: "CLF-C02",
      sessionId: "s1",
      count: 3,
      mode: "weakest-first",
      seed: 42,
    });
    expect(ids).toEqual([a, b, c]);
  });

  it("weakest-first respects session isolation", () => {
    const [a] = seedPool(1);
    // sessionB beantwortet richtig — sessionA sieht A trotzdem als unseen
    insertAttempt(db, {
      questionId: a,
      selected: ["A"],
      correct: true,
      sessionId: "sB",
    });

    const ids = selectRoundQuestions(db, {
      cert: "CLF-C02",
      sessionId: "sA",
      count: 1,
      mode: "weakest-first",
      seed: 42,
    });
    expect(ids).toEqual([a]);
  });
});

describe("getFlashcards", () => {
  let db: DB;

  beforeEach(() => {
    db = createTestDb();
  });

  it("returns flashcards for the requested cert, ordered by id", () => {
    db.insert(flashcards)
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

    const clf = getFlashcards(db, "CLF-C02");
    expect(clf).toHaveLength(2);
    expect(clf[0].front).toBe("F1");
    expect(clf[1].front).toBe("F2");
    expect(clf[0].id).toBeLessThan(clf[1].id);

    const saa = getFlashcards(db, "SAA-C03");
    expect(saa).toHaveLength(1);
    expect(saa[0].front).toBe("F3");
  });

  it("returns an empty array when no cards match", () => {
    expect(getFlashcards(db, "CLF-C02")).toEqual([]);
  });

  it("roundtrips iconSlugs as a JSON array (null + populated)", () => {
    db.insert(flashcards)
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

    const rows = getFlashcards(db, "CLF-C02");
    const noIcons = rows.find((r) => r.front === "no icons")!;
    const withIcons = rows.find((r) => r.front === "with icons")!;
    expect(noIcons.iconSlugs).toBeNull();
    expect(withIcons.iconSlugs).toEqual(["ec2", "s3"]);
  });
});
