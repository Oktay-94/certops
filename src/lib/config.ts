export const EXAM_DATE = new Date("2026-07-15T00:00:00Z");

// Exam outcome lives PER PROFILE in the exam_status table since 2026-07-12
// (src/lib/exam-status.ts) — EXAM_DATE remains only as the initial default
// date for profiles without a row yet.

const MS_PER_DAY = 86_400_000;

export function daysUntil(target: Date, now: Date = new Date()): number {
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / MS_PER_DAY));
}
