import { and, asc, eq } from "drizzle-orm";
import type { DB } from "./index";
import { questions, type NewQuestion, type Question } from "./schema";

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
