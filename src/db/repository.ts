import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { DB } from "./index";
import { shuffle } from "@/lib/shuffle";
import type { QuizMode } from "@/lib/domains";
import {
  examStatus,
  flashcardViews,
  flashcards,
  questionAttempts,
  questions,
  scripts,
  type Choice,
  type ExamStatus,
  type Flashcard,
  type NewQuestion,
  type NewQuestionAttempt,
  type Question,
  type QuestionAttempt,
  type Script,
} from "./schema";

function parseJsonField<T>(value: unknown): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : (value as T);
}

function resolveCorrectAnswerText(
  choices: Choice[],
  correctIds: string[],
): string {
  const correctSet = new Set(correctIds);
  return choices
    .filter((c) => correctSet.has(c.id))
    .map((c) => c.text)
    .join(", ");
}

export async function getQuestionsByCert(
  db: DB,
  cert: Question["cert"],
  opts?: { domain?: string },
): Promise<Question[]> {
  const where = opts?.domain
    ? and(eq(questions.cert, cert), eq(questions.domain, opts.domain))
    : eq(questions.cert, cert);

  return db.select().from(questions).where(where).orderBy(asc(questions.id)).all();
}

export async function getQuestionById(
  db: DB,
  id: number,
): Promise<Question | undefined> {
  return db.select().from(questions).where(eq(questions.id, id)).get();
}

export async function insertQuestion(db: DB, q: NewQuestion): Promise<Question> {
  const [row] = await db.insert(questions).values(q).returning().all();
  return row;
}

export async function insertAttempt(
  db: DB,
  attempt: NewQuestionAttempt,
): Promise<QuestionAttempt> {
  const [row] = await db.insert(questionAttempts).values(attempt).returning().all();
  return row;
}

export async function getAttemptsByUser(
  db: DB,
  userId: string,
): Promise<QuestionAttempt[]> {
  return db
    .select()
    .from(questionAttempts)
    .where(eq(questionAttempts.userId, userId))
    .orderBy(asc(questionAttempts.answeredAt))
    .all();
}

// Per-profile exam status (dashboard). Reads filter by user_id alone.
export async function getExamStatus(
  db: DB,
  userId: string,
  cert: Question["cert"],
): Promise<ExamStatus | null> {
  const row = await db
    .select()
    .from(examStatus)
    .where(and(eq(examStatus.userId, userId), eq(examStatus.cert, cert)))
    .get();
  return row ?? null;
}

export async function upsertExamStatus(
  db: DB,
  input: {
    userId: string;
    cert: Question["cert"];
    examDate: Date;
    result: ExamStatus["result"];
  },
): Promise<void> {
  const now = new Date();
  await db
    .insert(examStatus)
    .values({ ...input, updatedAt: now })
    .onConflictDoUpdate({
      target: [examStatus.userId, examStatus.cert],
      set: { examDate: input.examDate, result: input.result, updatedAt: now },
    })
    .run();
}

// Lean feed for the dashboard heatmap/streak: timestamps only (no row payload).
// Reads filter by user_id ALONE — never session_id (identity invariant).
export async function getAttemptTimestamps(
  db: DB,
  userId: string,
  cert: Question["cert"],
): Promise<Date[]> {
  const rows = await db
    .select({ answeredAt: questionAttempts.answeredAt })
    .from(questionAttempts)
    .innerJoin(questions, eq(questionAttempts.questionId, questions.id))
    .where(and(eq(questionAttempts.userId, userId), eq(questions.cert, cert)))
    .orderBy(asc(questionAttempts.answeredAt))
    .all();
  return rows.map((r) => r.answeredAt);
}

export async function getLastNAttempts(
  db: DB,
  userId: string,
  n: number,
): Promise<QuestionAttempt[]> {
  return db
    .select()
    .from(questionAttempts)
    .where(eq(questionAttempts.userId, userId))
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

export async function getAttemptStats(
  db: DB,
  userId: string,
  cert: Question["cert"],
): Promise<AttemptStats> {
  const rows = await db
    .select({
      domain: questions.domain,
      total: sql<number>`count(*)`.as("total"),
      correct: sql<number>`sum(case when ${questionAttempts.correct} then 1 else 0 end)`.as(
        "correct",
      ),
    })
    .from(questionAttempts)
    .innerJoin(questions, eq(questionAttempts.questionId, questions.id))
    .where(and(eq(questionAttempts.userId, userId), eq(questions.cert, cert)))
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

export async function getQuestionStats(
  db: DB,
  userId: string,
): Promise<QuestionStat[]> {
  const rows = (await db.all(sql`
    WITH ranked AS (
      SELECT question_id, correct, answered_at,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC) AS rn
      FROM question_attempts
      WHERE user_id = ${userId}
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
      WHERE user_id = ${userId}
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
  `)) as QuestionStatRow[];

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

export async function getDomainStats(
  db: DB,
  userId: string,
  cert: Question["cert"],
): Promise<DomainOverview[]> {
  const rows = (await db.all(sql`
    WITH ranked AS (
      SELECT question_id, correct, answered_at,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC) AS rn
      FROM question_attempts
      WHERE user_id = ${userId}
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
  `)) as DomainOverviewRow[];

  return rows.map((r) => ({
    domain: r.domain,
    avgCorrectRate: r.avg_correct_rate === null ? null : Number(r.avg_correct_rate),
    questionsPracticed: Number(r.questions_practiced),
    questionsUnseen: Number(r.questions_unseen),
  }));
}

export async function getFlashcards(
  db: DB,
  cert: Flashcard["cert"],
): Promise<Flashcard[]> {
  return db
    .select()
    .from(flashcards)
    .where(eq(flashcards.cert, cert))
    .orderBy(asc(flashcards.id))
    .all();
}

export async function countSeenFlashcards(
  db: DB,
  cert: Flashcard["cert"],
  userId: string,
): Promise<number> {
  const row = await db
    .select({ n: sql<number>`count(*)`.as("n") })
    .from(flashcardViews)
    .innerJoin(flashcards, eq(flashcardViews.cardId, flashcards.id))
    .where(and(eq(flashcards.cert, cert), eq(flashcardViews.userId, userId)))
    .get();
  return Number(row?.n ?? 0);
}

export async function markFlashcardSeen(
  db: DB,
  id: number,
  userId: string,
): Promise<void> {
  // Upsert on (card_id, user_id): first view inserts, re-views refresh seen_at.
  await db
    .insert(flashcardViews)
    .values({ cardId: id, userId, seenAt: new Date() })
    .onConflictDoUpdate({
      target: [flashcardViews.cardId, flashcardViews.userId],
      set: { seenAt: new Date() },
    })
    .run();
}

export async function resetFlashcardViews(
  db: DB,
  cert: Flashcard["cert"],
  userId: string,
): Promise<void> {
  // Only this user's views for the given cert — the other profile is untouched.
  await db
    .delete(flashcardViews)
    .where(
      and(
        eq(flashcardViews.userId, userId),
        sql`${flashcardViews.cardId} IN (SELECT id FROM flashcards WHERE cert = ${cert})`,
      ),
    )
    .run();
}

export async function getOverallAvgLast3(
  db: DB,
  userId: string,
  cert: Question["cert"],
): Promise<number | null> {
  const row = (await db.get(sql`
    WITH ranked AS (
      SELECT question_id, correct, answered_at,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC) AS rn
      FROM question_attempts
      WHERE user_id = ${userId}
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
  `)) as { avg_correct_rate: number | null } | undefined;

  if (!row || row.avg_correct_rate === null) return null;
  return Number(row.avg_correct_rate);
}

type RoundCandidateRow = {
  id: number;
  avg_correct_last3: number | null;
  total_attempts: number | null;
};

export async function selectRoundQuestions(
  db: DB,
  opts: {
    cert: Question["cert"];
    userId: string;
    domain?: string;
    count: number | "all";
    mode: QuizMode;
    seed: number;
  },
): Promise<number[]> {
  const { cert, userId, domain, count, mode, seed } = opts;

  const rawRows = (await db.all(sql`
    WITH ranked AS (
      SELECT question_id, correct, answered_at,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC) AS rn
      FROM question_attempts
      WHERE user_id = ${userId}
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
  `)) as RoundCandidateRow[];

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

export async function getDomainPerformance(
  db: DB,
  userId: string,
  cert: Question["cert"],
): Promise<DomainPerformance[]> {
  const rows = (await db.all(sql`
    SELECT q.domain,
           SUM(CASE WHEN qa.id IS NOT NULL THEN 1 ELSE 0 END) AS attempts,
           SUM(CASE WHEN qa.correct THEN 1 ELSE 0 END) AS correct,
           COUNT(DISTINCT q.id) AS questions_count
    FROM questions q
    LEFT JOIN question_attempts qa
      ON qa.question_id = q.id AND qa.user_id = ${userId}
    WHERE q.cert = ${cert}
    GROUP BY q.domain
    ORDER BY q.domain ASC
  `)) as DomainPerformanceRow[];

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
  wrongCount: number;
  correctAnswerText: string;
};

type WeakestQuestionRow = {
  id: number;
  prompt: string;
  domain: string;
  choices: unknown;
  correct: unknown;
  wrong_count: number;
};

export async function getWeakestQuestions(
  db: DB,
  userId: string,
  cert: Question["cert"],
  limit = 10,
): Promise<WeakestQuestion[]> {
  const rows = (await db.all(sql`
    SELECT q.id, q.prompt, q.domain, q.choices, q.correct,
           SUM(CASE WHEN qa.correct THEN 0 ELSE 1 END) AS wrong_count,
           MAX(qa.answered_at) AS last_at
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.user_id = ${userId}
      AND q.cert = ${cert}
    GROUP BY q.id
    HAVING SUM(CASE WHEN qa.correct THEN 0 ELSE 1 END) >= 1
    ORDER BY wrong_count DESC, last_at DESC
    LIMIT ${limit}
  `)) as WeakestQuestionRow[];

  return rows.map((r) => ({
    id: Number(r.id),
    prompt: r.prompt,
    domain: r.domain,
    wrongCount: Number(r.wrong_count),
    correctAnswerText: resolveCorrectAnswerText(
      parseJsonField<Choice[]>(r.choices),
      parseJsonField<string[]>(r.correct),
    ),
  }));
}

export type PersistentWeakness = {
  id: number;
  prompt: string;
  domain: string;
  wrongRate: number; // 0..1
  attempts: number;
};

type PersistentWeaknessRow = {
  id: number;
  prompt: string;
  domain: string;
  attempts: number;
  wrong_count: number;
};

// "Hartnäckigste Schwachstellen" — ranked by wrong RATE, not absolute count
// (distinct from getWeakestQuestions). minAttempts guards against a single miss
// reading as 100%. Reads filter by user_id alone.
export async function getPersistentWeakest(
  db: DB,
  userId: string,
  cert: Question["cert"],
  limit = 4,
  minAttempts = 2,
): Promise<PersistentWeakness[]> {
  const rows = (await db.all(sql`
    SELECT q.id, q.prompt, q.domain,
           COUNT(*) AS attempts,
           SUM(CASE WHEN qa.correct THEN 0 ELSE 1 END) AS wrong_count
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.user_id = ${userId}
      AND q.cert = ${cert}
    GROUP BY q.id
    HAVING attempts >= ${minAttempts}
       AND wrong_count >= 1
    ORDER BY (wrong_count * 1.0 / attempts) DESC, attempts DESC
    LIMIT ${limit}
  `)) as PersistentWeaknessRow[];

  return rows.map((r) => ({
    id: Number(r.id),
    prompt: r.prompt,
    domain: r.domain,
    attempts: Number(r.attempts),
    wrongRate: Number(r.wrong_count) / Number(r.attempts),
  }));
}

export type LastRoundQuestion = {
  questionId: number;
  questionText: string;
  correctAnswerText: string;
  isCorrect: boolean;
};

export type LastRoundReview = {
  roundId: string | null;
  correct: LastRoundQuestion[];
  incorrect: LastRoundQuestion[];
  correctCount: number;
  incorrectCount: number;
};

type LastRoundAttemptRow = {
  question_id: number;
  prompt: string;
  choices: unknown;
  correct_ids: unknown;
  is_correct: number;
};

export async function getLastRoundReview(
  db: DB,
  userId: string,
  cert: Question["cert"],
): Promise<LastRoundReview> {
  const empty: LastRoundReview = {
    roundId: null,
    correct: [],
    incorrect: [],
    correctCount: 0,
    incorrectCount: 0,
  };

  const latestRows = (await db.all(sql`
    SELECT qa.round_id AS round_id
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.user_id = ${userId}
      AND q.cert = ${cert}
      AND qa.round_id IS NOT NULL
    ORDER BY qa.answered_at DESC
    LIMIT 1
  `)) as Array<{ round_id: string }>;

  const latest = latestRows[0];
  if (!latest?.round_id) return empty;

  // One row per question — newest attempt wins if a question was retried
  // within the same round.
  const rows = (await db.all(sql`
    SELECT qa.question_id AS question_id,
           q.prompt AS prompt,
           q.choices AS choices,
           q.correct AS correct_ids,
           qa.correct AS is_correct
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.user_id = ${userId}
      AND qa.round_id = ${latest.round_id}
      AND qa.id IN (
        SELECT MAX(qa2.id)
        FROM question_attempts qa2
        WHERE qa2.user_id = ${userId}
          AND qa2.round_id = ${latest.round_id}
        GROUP BY qa2.question_id
      )
    ORDER BY qa.answered_at ASC
  `)) as LastRoundAttemptRow[];

  const correct: LastRoundQuestion[] = [];
  const incorrect: LastRoundQuestion[] = [];
  for (const r of rows) {
    const item: LastRoundQuestion = {
      questionId: Number(r.question_id),
      questionText: r.prompt,
      correctAnswerText: resolveCorrectAnswerText(
        parseJsonField<Choice[]>(r.choices),
        parseJsonField<string[]>(r.correct_ids),
      ),
      isCorrect: Boolean(Number(r.is_correct)),
    };
    if (item.isCorrect) correct.push(item);
    else incorrect.push(item);
  }

  return {
    roundId: latest.round_id,
    correct,
    incorrect,
    correctCount: correct.length,
    incorrectCount: incorrect.length,
  };
}

export async function countAnsweredQuestions(
  db: DB,
  userId: string,
  cert: Question["cert"],
): Promise<number> {
  const row = (await db.get(sql`
    SELECT COUNT(DISTINCT qa.question_id) AS n
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.user_id = ${userId}
      AND q.cert = ${cert}
  `)) as { n: number } | undefined;
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

export async function getRoundTrend(
  db: DB,
  userId: string,
  cert: Question["cert"],
  limit = 10,
): Promise<RoundTrendPoint[]> {
  const rows = (await db.all(sql`
    SELECT qa.round_id AS round,
           AVG(CAST(qa.correct AS REAL)) AS rate,
           COUNT(*) AS attempts,
           MAX(qa.answered_at) AS last_at
    FROM question_attempts qa
    JOIN questions q ON q.id = qa.question_id
    WHERE qa.user_id = ${userId}
      AND q.cert = ${cert}
      AND qa.round_id IS NOT NULL
    GROUP BY qa.round_id
    ORDER BY last_at DESC
    LIMIT ${limit}
  `)) as RoundTrendRow[];

  return rows
    .map((r) => ({
      roundId: String(r.round),
      rate: Number(r.rate),
      attempts: Number(r.attempts),
      lastAt: new Date(Number(r.last_at) * 1000),
    }))
    .reverse();
}

export async function getNeverSeenQuestions(
  db: DB,
  userId: string,
  cert: Question["cert"],
  limit = 20,
): Promise<Pick<Question, "id" | "cert" | "domain" | "prompt">[]> {
  const rows = (await db.all(sql`
    SELECT q.id, q.cert, q.domain, q.prompt
    FROM questions q
    WHERE q.cert = ${cert}
      AND NOT EXISTS (
        SELECT 1 FROM question_attempts a
        WHERE a.question_id = q.id AND a.user_id = ${userId}
      )
    ORDER BY q.id ASC
    LIMIT ${limit}
  `)) as Array<{ id: number; cert: Question["cert"]; domain: string; prompt: string }>;

  return rows.map((r) => ({
    id: Number(r.id),
    cert: r.cert,
    domain: r.domain,
    prompt: r.prompt,
  }));
}

// --- SAA service scripts (Lernskript, DB-based track) ---

export type ScriptListItem = Pick<
  Script,
  "slug" | "service" | "title" | "domains" | "batch" | "position"
>;

/** Overview list in reading order — no content column (137 markdown bodies). */
export async function getScriptsByCert(
  db: DB,
  cert: Script["cert"],
): Promise<ScriptListItem[]> {
  return db
    .select({
      slug: scripts.slug,
      service: scripts.service,
      title: scripts.title,
      domains: scripts.domains,
      batch: scripts.batch,
      position: scripts.position,
    })
    .from(scripts)
    .where(eq(scripts.cert, cert))
    .orderBy(asc(scripts.position))
    .all();
}

export async function getScriptBySlug(
  db: DB,
  cert: Script["cert"],
  slug: string,
): Promise<Script | undefined> {
  return db
    .select()
    .from(scripts)
    .where(and(eq(scripts.cert, cert), eq(scripts.slug, slug)))
    .get();
}
