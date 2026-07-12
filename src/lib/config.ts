export const EXAM_DATE = new Date("2026-07-15T00:00:00Z");

// Real exam outcome — flipped MANUALLY after the exam (no data source exists;
// deliberate decision 2026-07-12). "passed" switches the dashboard into the
// certificate/archive view (cert tile + confetti, ring becomes Ø-Trefferquote).
export type ClfResult = "pending" | "passed";
export const CLF_RESULT: ClfResult = "pending";

const MS_PER_DAY = 86_400_000;

export function daysUntil(target: Date, now: Date = new Date()): number {
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / MS_PER_DAY));
}
