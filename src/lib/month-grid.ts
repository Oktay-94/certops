// Pure month-grid math for the mini calendar in the countdown tile.
// Works on "YYYY-MM-DD" day keys (same convention as activity.ts) so the
// rendering component stays free of Date-object timezone pitfalls.

export type MonthGrid = {
  /** e.g. "Juli 2026" */
  label: string;
  /** rows of 7 day keys; leading/trailing cells from neighbor months are "" */
  weeks: string[][];
};

const MONTHS_DE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Monday-start grid for the month containing `dayKey` ("YYYY-MM-DD"). */
export function monthGrid(dayKey: string): MonthGrid {
  const [year, month] = dayKey.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year!, month!, 0, 12)).getUTCDate();
  const firstDow = (new Date(Date.UTC(year!, month! - 1, 1, 12)).getUTCDay() + 6) % 7; // Mon=0

  const cells: string[] = [
    ...Array.from({ length: firstDow }, () => ""),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => `${year}-${pad(month!)}-${pad(i + 1)}`,
    ),
  ];
  while (cells.length % 7 !== 0) cells.push("");

  const weeks: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { label: `${MONTHS_DE[month! - 1]} ${year}`, weeks };
}
