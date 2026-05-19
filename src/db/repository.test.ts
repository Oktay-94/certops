import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";

import type { DB } from "./index";
import * as schema from "./schema";
import {
  getAttemptStats,
  getAttemptsBySession,
  getLastNAttempts,
  getQuestionsByCert,
  insertAttempt,
  insertQuestion,
} from "./repository";

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
