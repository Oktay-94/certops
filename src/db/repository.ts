import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { DB } from "./index";
import { shuffle } from "@/lib/shuffle";
import type { QuizMode } from "@/lib/domains";
import {
  flashcards,
  questionAttempts,
  questions,
  type Flashcard,
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

export function getFlashcards(
  db: DB,
  cert: Flashcard["cert"],
): Flashcard[] {
  return db
    .select()
    .from(flashcards)
    .where(eq(flashcards.cert, cert))
    .orderBy(asc(flashcards.id))
    .all();
}

export function countSeenFlashcards(
  db: DB,
  cert: Flashcard["cert"],
): number {
  const row = db
    .select({ n: sql<number>`count(*)`.as("n") })
    .from(flashcards)
    .where(and(eq(flashcards.cert, cert), isNotNull(flashcards.lastSeenAt)))
    .get();
  return Number(row?.n ?? 0);
}

export function markFlashcardSeen(db: DB, id: number): void {
  db.update(flashcards)
    .set({ lastSeenAt: new Date() })
    .where(eq(flashcards.id, id))
    .run();
}

export function resetFlashcardViews(
  db: DB,
  cert: Flashcard["cert"],
): void {
  db.update(flashcards)
    .set({ lastSeenAt: null })
    .where(eq(flashcards.cert, cert))
    .run();
}

export function getOverallAvgLast3(
  db: DB,
  sessionId: string,
  cert: Question["cert"],
): number | null {
  const row = db.get(sql`
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
    SELECT AVG(CASE WHEN p.total_attempts >= 2 THEN p.avg_correct_last3 END) AS avg_correct_rate
    FROM questions q
    LEFT JOIN per_question p ON p.question_id = q.id
    WHERE q.cert = ${cert}
  `) as { avg_correct_rate: number | null } | undefined;

  if (!row || row.avg_correct_rate === null) return null;
  return Number(row.avg_correct_rate);
}

type RoundCandidateRow = {
  id: number;
  avg_correct_last3: number | null;
  total_attempts: number | null;
};

export function selectRoundQuestions(
  db: DB,
  opts: {
    cert: Question["cert"];
    sessionId: string;
    domain?: string;
    count: number | "all";
    mode: QuizMode;
    seed: number;
  },
): number[] {
  const { cert, sessionId, domain, count, mode, seed } = opts;

  const rawRows = db.all(sql`
    WITH ranked AS (
      SELECT question_id, correct, answered_at,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC) AS rn
      FROM question_attempts
      WHERE session_id = ${sessionId}
    ),
    per_question AS (
      SELECT question_id,
             AVG(CAST(correct AS REAL)) FILTER (WHERE rn <= 3) AS avg_correct_last3,
             COUNT(*) AS total_attempts
      FROM ranked
      GROUP BY question_id
    )
    SELECT q.id,
           p.avg_correct_last3,
           p.total_attempts
    FROM questions q
    LEFT JOIN per_question p ON p.question_id = q.id
    WHERE q.cert = ${cert}
      AND (${domain ?? null} IS NULL OR q.domain = ${domain ?? null})
    ORDER BY q.id ASC
  `) as RoundCandidateRow[];

  const ids = rawRows.map((r) => Number(r.id));
  if (ids.length === 0) return [];

  let ordered: number[];
  if (mode === "weakest-first") {
    // Tiebreaker-Shuffle der Pool-IDs (stabil per seed) — ohne fällt bei
    // gleichem total_attempts/avg_correct_last3 die ursprüngliche ID-Reihenfolge
    // immer gleich aus.
    const shuffledIndex = new Map<number, number>();
    shuffle(ids, seed).forEach((id, idx) => shuffledIndex.set(id, idx));

    ordered = [...rawRows]
      .sort((a, b) => {
        const aUnseen = a.total_attempts === null ? 1 : 0;
        const bUnseen = b.total_attempts === null ? 1 : 0;
        if (aUnseen !== bUnseen) return bUnseen - aUnseen; // unseen first
        const aAvg = a.avg_correct_last3 ?? 1;
        const bAvg = b.avg_correct_last3 ?? 1;
        if (aAvg !== bAvg) return aAvg - bAvg; // weakest first
        const aTotal = a.total_attempts ?? 0;
        const bTotal = b.total_attempts ?? 0;
        if (aTotal !== bTotal) return aTotal - bTotal; // less practiced first
        return (
          (shuffledIndex.get(a.id) ?? 0) - (shuffledIndex.get(b.id) ?? 0)
        );
      })
      .map((r) => Number(r.id));
  } else {
    ordered = shuffle(ids, seed);
  }

  const limit = count === "all" ? ordered.length : Math.min(count, ordered.length);
  return ordered.slice(0, limit);
}

export type DomainPerformance = {
  domain: string;
  attempts: number;
  correct: number;
  questionsCount: number;
  rate: number | null;
};

type DomainPerformanceRow = {
  domain: string;
  attempts: number | null;
  correct: number | null;
  questions_count: number;
};

export function getDomainPerformance(
  db: DB,
  sessionId: string,
  cert: Question["cert"],
): DomainPerformance[] {
  const rows = db.all(sql`
    SELECT q.domain,
           SUM(CASE WHEN qa.id IS NOT NULL THEN 1 ELSE 0 END) AS attempts,
           SUM(CASE WHEN qa.correct THEN 1 ELSE 0 END) AS correct,
           COUNT(DISTINCT q.id) AS questions_count
    FROM questions q
    LEFT JOIN question_attempts qa
      ON qa.question_id = q.id AND qa.session_id = ${sessionId}
    WHERE q.cert = ${cert}
    GROUP BY q.domain
    ORDER BY q.domain ASC
  `) as DomainPerformanceRow[];

  return rows.map((r) => {
    const attempts = Number(r.attempts ?? 0);
    const correct = Number(r.correct ?? 0);
    return {
      domain: r.domain,
      attempts,
      correct,
      questionsCount: Number(r.questions_count),
      rate: attempts > 0 ? correct / attempts : null,
    };
  });
}

export type WeakestQuestion = {
  id: number;
  prompt: string;
  domain: string;
  attempts: number;
  rate: number;
};

type WeakestQuestionRow = {
  id: number;
  prompt: string;
  domain: string;
  attempts: number;
  rate: number;
};

export function getWeakestQuestions(
  db: DB,
  sessionId: string,
  cert: Question["cert"],
  limit = 10,
): WeakestQuestion[] {
  const rows = db.all(sql`
    SELECT q.id, q.prompt, q.domain,
           COUNT(*) AS attempts,
           AVG(CAST(qa.correct AS REAL)) AS rate,
           MAX(qa.answered_at) AS last_at
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.session_id = ${sessionId}
      AND q.cert = ${cert}
    GROUP BY q.id
    HAVING COUNT(*) >= 2
    ORDER BY rate ASC, attempts DESC, last_at DESC
    LIMIT ${limit}
  `) as WeakestQuestionRow[];

  return rows.map((r) => ({
    id: Number(r.id),
    prompt: r.prompt,
    domain: r.domain,
    attempts: Number(r.attempts),
    rate: Number(r.rate),
  }));
}

export function countAnsweredQuestions(
  db: DB,
  sessionId: string,
  cert: Question["cert"],
): number {
  const row = db.get(sql`
    SELECT COUNT(DISTINCT qa.question_id) AS n
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.session_id = ${sessionId}
      AND q.cert = ${cert}
  `) as { n: number } | undefined;
  return Number(row?.n ?? 0);
}

export type RoundTrendPoint = {
  roundId: string;
  rate: number;
  attempts: number;
  lastAt: Date;
};

type RoundTrendRow = {
  round: string;
  rate: number;
  attempts: number;
  last_at: number;
};

export function getRoundTrend(
  db: DB,
  sessionId: string,
  cert: Question["cert"],
  limit = 10,
): RoundTrendPoint[] {
  const rows = db.all(sql`
    SELECT qa.round_id AS round,
           AVG(CAST(qa.correct AS REAL)) AS rate,
           COUNT(*) AS attempts,
           MAX(qa.answered_at) AS last_at
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.session_id = ${sessionId}
      AND q.cert = ${cert}
      AND qa.round_id IS NOT NULL
    GROUP BY qa.round_id
    ORDER BY last_at DESC
    LIMIT ${limit}
  `) as RoundTrendRow[];

  return rows
    .map((r) => ({
      roundId: String(r.round),
      rate: Number(r.rate),
      attempts: Number(r.attempts),
      lastAt: new Date(Number(r.last_at) * 1000),
    }))
    .reverse();
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
