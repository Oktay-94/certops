import { and, asc, eq } from "drizzle-orm";
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
