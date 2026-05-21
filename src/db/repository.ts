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

export type QuestionStat = {
  id: number;
  cert: Question["cert"];
  domain: string;
  prompt: string;
  avgCorrectLast3: number;
  totalAttempts: number;
  lastAnsweredAt: Date;
};

type QuestionStatRow = {
  id: number;
  cert: Question["cert"];
  domain: string;
  prompt: string;
  avg_correct_last3: number;
  total_attempts: number;
  last_answered_at: number;
};

export function getQuestionStats(db: DB, sessionId: string): QuestionStat[] {
  const rows = db.all(sql`
    WITH ranked AS (
      SELECT question_id, correct, answered_at,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC) AS rn
      FROM question_attempts
      WHERE session_id = ${sessionId}
    ),
    last3 AS (
      SELECT question_id,
             AVG(CAST(correct AS REAL)) AS avg_correct_last3
      FROM ranked
      WHERE rn <= 3
      GROUP BY question_id
    ),
    totals AS (
      SELECT question_id,
             COUNT(*) AS total_attempts,
             MAX(answered_at) AS last_answered_at
      FROM question_attempts
      WHERE session_id = ${sessionId}
      GROUP BY question_id
    )
    SELECT q.id, q.cert, q.domain, q.prompt,
           l.avg_correct_last3,
           t.total_attempts,
           t.last_answered_at
    FROM totals t
    JOIN last3 l ON l.question_id = t.question_id
    JOIN questions q ON q.id = t.question_id
    ORDER BY l.avg_correct_last3 ASC, t.last_answered_at DESC
  `) as QuestionStatRow[];

  return rows.map((r) => ({
    id: Number(r.id),
    cert: r.cert,
    domain: r.domain,
    prompt: r.prompt,
    avgCorrectLast3: Number(r.avg_correct_last3),
    totalAttempts: Number(r.total_attempts),
    lastAnsweredAt: new Date(Number(r.last_answered_at) * 1000),
  }));
}

export type DomainOverview = {
  domain: string;
  avgCorrectRate: number | null;
  questionsPracticed: number;
  questionsUnseen: number;
};

type DomainOverviewRow = {
  domain: string;
  avg_correct_rate: number | null;
  questions_practiced: number;
  questions_unseen: number;
};

export function getDomainStats(
  db: DB,
  sessionId: string,
  cert: Question["cert"],
): DomainOverview[] {
  const rows = db.all(sql`
    WITH ranked AS (
      SELECT question_id, correct, answered_at,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC) AS rn
      FROM question_attempts
      WHERE session_id = ${sessionId}
    ),
    per_question AS (
      SELECT r.question_id,
             AVG(CAST(r.correct AS REAL)) FILTER (WHERE r.rn <= 3) AS avg_correct_last3,
             COUNT(*) AS total_attempts
      FROM ranked r
      GROUP BY r.question_id
    )
    SELECT q.domain,
      AVG(CASE WHEN p.total_attempts >= 2 THEN p.avg_correct_last3 END) AS avg_correct_rate,
      SUM(CASE WHEN p.total_attempts IS NOT NULL THEN 1 ELSE 0 END) AS questions_practiced,
      SUM(CASE WHEN p.total_attempts IS NULL THEN 1 ELSE 0 END) AS questions_unseen
    FROM questions q
    LEFT JOIN per_question p ON p.question_id = q.id
    WHERE q.cert = ${cert}
    GROUP BY q.domain
    ORDER BY q.domain
  `) as DomainOverviewRow[];

  return rows.map((r) => ({
    domain: r.domain,
    avgCorrectRate: r.avg_correct_rate === null ? null : Number(r.avg_correct_rate),
    questionsPracticed: Number(r.questions_practiced),
    questionsUnseen: Number(r.questions_unseen),
  }));
}

export function getNeverSeenQuestions(
  db: DB,
  sessionId: string,
  cert: Question["cert"],
  limit = 20,
): Pick<Question, "id" | "cert" | "domain" | "prompt">[] {
  const rows = db.all(sql`
    SELECT q.id, q.cert, q.domain, q.prompt
    FROM questions q
    WHERE q.cert = ${cert}
      AND NOT EXISTS (
        SELECT 1 FROM question_attempts a
        WHERE a.question_id = q.id AND a.session_id = ${sessionId}
      )
    ORDER BY q.id ASC
    LIMIT ${limit}
  `) as Array<{ id: number; cert: Question["cert"]; domain: string; prompt: string }>;

  return rows.map((r) => ({
    id: Number(r.id),
    cert: r.cert,
    domain: r.domain,
    prompt: r.prompt,
  }));
}
