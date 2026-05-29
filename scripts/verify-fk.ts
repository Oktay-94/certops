/**
 * Verifies foreign-key enforcement on the real app DB path (src/db/index.ts,
 * file: URL). Inserts a question_attempt with a guaranteed-nonexistent
 * question_id; FK ON -> insert rejects, FK OFF -> insert succeeds (and we
 * roll it back). Diagnostic only — does NOT touch Turso.
 */
import { db } from "../src/db";
import { questionAttempts } from "../src/db/schema";
import { eq } from "drizzle-orm";

const SENTINEL_SESSION = `fk-verify-${process.pid}-${Date.now()}`;
const BAD_QUESTION_ID = 2_000_000_000;

async function main() {
  let inserted = false;
  let errorMessage: string | null = null;
  try {
    await db.insert(questionAttempts).values({
      questionId: BAD_QUESTION_ID,
      selected: ["A"],
      correct: false,
      sessionId: SENTINEL_SESSION,
    }).run();
    inserted = true;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  if (inserted) {
    console.log("RESULT: FK OFF — insert with invalid question_id succeeded.");
    const cleanup = await db
      .delete(questionAttempts)
      .where(eq(questionAttempts.sessionId, SENTINEL_SESSION))
      .run();
    console.log("Cleanup rows affected:", cleanup);
    process.exit(2);
  } else {
    console.log("RESULT: FK ON — insert rejected as expected.");
    console.log("Error:", errorMessage);
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("Unexpected:", e);
  process.exit(1);
});
