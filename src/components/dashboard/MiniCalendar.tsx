import { dayKey } from "@/lib/activity";
import { monthGrid } from "@/lib/month-grid";
import { BRAND_ORANGE } from "@/lib/brand";

// Compact current-month calendar: today outlined, an optional highlighted day
// (e.g. an exam date) filled orange. Deliberately tiny (7×~14px cells) so it
// fits into a tile corner. Shared by the exam countdown tile and the stats
// activity tile.
export function MiniCalendar({
  highlight,
  className = "",
}: {
  /** "YYYY-MM-DD" day to fill orange (e.g. the exam date). Optional. */
  highlight?: string;
  className?: string;
}) {
  const today = dayKey(new Date());
  const grid = monthGrid(today);

  return (
    <div className={className} aria-hidden>
      <div className="mb-1 text-center font-mono text-[8px] uppercase tracking-[0.1em] text-ink-faint">
        {grid.label}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {["M", "D", "M", "D", "F", "S", "S"].map((d, i) => (
          <span
            key={`h${i}`}
            className="text-center font-mono text-[7px] text-ink-faint"
          >
            {d}
          </span>
        ))}
        {grid.weeks.flat().map((day, i) => {
          if (!day) return <span key={`e${i}`} className="h-3.5 w-3.5" />;
          const isToday = day === today;
          const isHighlight = day === highlight;
          return (
            <span
              key={day}
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] font-mono text-[7.5px] ${
                isHighlight
                  ? "font-bold"
                  : isToday
                    ? "text-ink"
                    : "text-ink-faint"
              }`}
              style={
                isHighlight
                  ? { background: BRAND_ORANGE, color: "var(--cta-ink)" }
                  : isToday
                    ? { boxShadow: "inset 0 0 0 1px var(--border-strong)" }
                    : undefined
              }
            >
              {Number(day.slice(8))}
            </span>
          );
        })}
      </div>
    </div>
  );
}
