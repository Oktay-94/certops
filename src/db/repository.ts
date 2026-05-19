import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { DB } from "./index";
import {
  questionAttempts,
  questions,
  type NewQuestion,
  type NewQuestionAttempt,
  type Question,
  type QuestionAttempt,
} from "./schema";

export function getQuestionsByCert(
  db: DB,
  cert: Question["cert"],
  opts?: { domain?: string },
): Question[] {
  const where = opts?.domain
    ? and(eq(questions.cert, cert), eq(questions.domain, opts.domain))
    : eq(questions.cert, cert);

  return db.select().from(questions).where(where).orderBy(asc(questions.id)).all();
}

export function getQuestionById(db: DB, id: number): Question | undefined {
  return db.select().from(questions).where(eq(questions.id, id)).get();
}

export function insertQuestion(db: DB, q: NewQuestion): Question {
  const [row] = db.insert(questions).values(q).returning().all();
  return row;
}

export function insertAttempt(
  db: DB,
  attempt: NewQuestionAttempt,
): QuestionAttempt {
  const [row] = db.insert(questionAttempts).values(attempt).returning().all();
  return row;
}

export function getAttemptsBySession(
  db: DB,
  sessionId: string,
): QuestionAttempt[] {
  return db
    .select()
    .from(questionAttempts)
    .where(eq(questionAttempts.sessionId, sessionId))
    .orderBy(asc(questionAttempts.answeredAt))
    .all();
}

export function getLastNAttempts(
  db: DB,
  sessionId: string,
  n: number,
): QuestionAttempt[] {
  return db
    .select()
    .from(questionAttempts)
    .where(eq(questionAttempts.sessionId, sessionId))
    .orderBy(desc(questionAttempts.answeredAt))
    .limit(n)
    .all();
}

export type DomainStat = { domain: string; total: number; correct: number };
export type AttemptStats = {
  total: number;
  correct: number;
  byDomain: DomainStat[];
};

export function getAttemptStats(db: DB, sessionId: string): AttemptStats {
  const rows = db
    .select({
      domain: questions.domain,
      total: sql<number>`count(*)`.as("total"),
      correct: sql<number>`sum(case when ${questionAttempts.correct} then 1 else 0 end)`.as(
        "correct",
      ),
    })
    .from(questionAttempts)
    .innerJoin(questions, eq(questionAttempts.questionId, questions.id))
    .where(eq(questionAttempts.sessionId, sessionId))
    .groupBy(questions.domain)
    .orderBy(asc(questions.domain))
    .all();

  const byDomain: DomainStat[] = rows.map((r) => ({
    domain: r.domain,
    total: Number(r.total),
    correct: Number(r.correct),
  }));

  const total = byDomain.reduce((sum, d) => sum + d.total, 0);
  const correct = byDomain.reduce((sum, d) => sum + d.correct, 0);

  return { total, correct, byDomain };
}
