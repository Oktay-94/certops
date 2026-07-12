import { addDays, dayKey } from "@/lib/activity";
import { BRAND_ORANGE } from "@/lib/brand";

// Streak count + last-7-days strip (mockup .streak-days). Today is orange
// (signal) when active; past active days success-soft. No freeze feature —
// deliberately omitted (no data model).
export function StreakTile({
  streak,
  activeDays,
  today,
}: {
  streak: number;
  activeDays: ReadonlySet<string>;
  today: Date;
}) {
  const todayKey = dayKey(today);
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(todayKey, i - 6));

  return (
    <div>
      <div className="text-[38px] font-bold leading-none tracking-[-0.03em] text-ink">
        {streak}
        <small className="text-sm font-medium text-ink-faint"> Tage</small>
      </div>
      <div className="mt-3.5 flex gap-[5px]">
        {last7.map((day) => {
          const active = activeDays.has(day);
          const isToday = day === todayKey;
          return (
            <i
              key={day}
              title={day}
              className="h-[22px] flex-1 rounded-[5px] border"
              style={
                isToday && active
                  ? { background: BRAND_ORANGE, borderColor: BRAND_ORANGE }
                  : active
                    ? {
                        background: "var(--success-soft)",
                        borderColor:
                          "color-mix(in srgb, var(--success) 40%, transparent)",
                      }
                    : {
                        background: "var(--surface-2)",
                        borderColor: "var(--border)",
                      }
              }
            />
          );
        })}
      </div>
    </div>
  );
}
