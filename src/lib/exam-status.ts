// Per-profile exam status logic (pure — DB access lives in repository.ts).
// Initial states are APP-SIDE defaults, not migration data (repo convention:
// migrations are DDL-only): the first write lazily persists a row.
import { EXAM_DATE } from "@/lib/config";
import type { ExamResult, ExamStatus } from "@/db/schema";

export type ResolvedExamStatus = {
  examDate: Date;
  result: ExamResult;
  /** countdown anchor: when the current exam date was set */
  setAt: Date;
  /** false until a real DB row exists */
  persisted: boolean;
};

// Known state as of July 2026: Oktay passed CLF-C02; Merve's exam is still
// ahead (defaults to the original shared date until she sets her own).
const INITIAL_RESULT: Record<string, ExamResult> = {
  oktay: "passed",
  merve: "pending",
};

export function resolveExamStatus(
  row: ExamStatus | null,
  userId: string,
): ResolvedExamStatus {
  if (row) {
    return {
      examDate: row.examDate,
      result: row.result,
      setAt: row.updatedAt,
      persisted: true,
    };
  }
  return {
    examDate: EXAM_DATE,
    result: INITIAL_RESULT[userId] ?? "pending",
    setAt: EXAM_DATE, // no anchor yet → countdown ring shows 100% (am Termin)
    persisted: false,
  };
}

export function isExpired(examDate: Date, now: Date): boolean {
  return now.getTime() >= examDate.getTime();
}

/**
 * Countdown progress 0–100: elapsed share of the window between setting the
 * date and the exam. Degenerate window (setAt ≥ examDate) counts as 100.
 */
export function countdownProgress(
  setAt: Date,
  examDate: Date,
  now: Date,
): number {
  const total = examDate.getTime() - setAt.getTime();
  if (total <= 0) return 100;
  const elapsed = now.getTime() - setAt.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}
