// Daily activity helpers for the dashboard heatmap + streak. Attempts are
// stored as UTC epoch timestamps; all day-bucketing happens HERE in TS with an
// explicit IANA timezone (Europe/Berlin) so results never depend on the
// machine/server timezone (decision 2026-07-12).

export const ACTIVITY_TZ = "Europe/Berlin";

/** Calendar day of `date` in `tz`, as "YYYY-MM-DD". */
export function dayKey(date: Date, tz: string = ACTIVITY_TZ): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Pure calendar arithmetic on a day key — timezone-independent. */
export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  // Noon UTC keeps the date stable against any offset when slicing back out.
  const shifted = new Date(Date.UTC(y!, m! - 1, d! + delta, 12));
  return shifted.toISOString().slice(0, 10);
}

/** Count of activity per calendar day in `tz`. */
export function bucketByDay(
  dates: Date[],
  tz: string = ACTIVITY_TZ,
): Map<string, number> {
  const buckets = new Map<string, number>();
  for (const date of dates) {
    const key = dayKey(date, tz);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return buckets;
}

/**
 * Consecutive active days ending today — or ending yesterday if today has no
 * activity yet (the streak is not broken before the day is over).
 */
export function computeStreak(
  activeDays: ReadonlySet<string>,
  today: Date,
  tz: string = ACTIVITY_TZ,
): number {
  let cursor = dayKey(today, tz);
  if (!activeDays.has(cursor)) cursor = addDays(cursor, -1);

  let streak = 0;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Heat level 0–4 relative to the busiest day (mockup thresholds). Zero stays
 * level 0 so "no activity" is always visually distinct.
 */
export function heatLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const r = count / max;
  if (r > 0.86) return 4;
  if (r > 0.7) return 3;
  if (r > 0.5) return 2;
  return 1;
}

/**
 * Day keys for the heatmap grid: `weeks` full Monday-start columns, oldest
 * first, ending in the week that contains `today`. Trailing days after today
 * are included (the component renders them as empty future cells).
 */
export function weeksGrid(
  today: Date,
  weeks: number = 26,
  tz: string = ACTIVITY_TZ,
): string[][] {
  const todayKey = dayKey(today, tz);
  // ISO weekday from the key itself (calendar math, tz already applied).
  const [y, m, d] = todayKey.split("-").map(Number);
  const isoDow = (new Date(Date.UTC(y!, m! - 1, d!, 12)).getUTCDay() + 6) % 7; // Mon=0
  const monday = addDays(todayKey, -isoDow);

  const grid: string[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = addDays(monday, -7 * w);
    grid.push(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));
  }
  return grid;
}
