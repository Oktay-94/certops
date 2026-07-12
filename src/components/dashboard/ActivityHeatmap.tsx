import { dayKey, heatLevel, weeksGrid } from "@/lib/activity";

// 26×7 activity grid (mockup .heat): columns = Monday-start weeks, levels via
// --heat-0..4. Future cells (after today) render invisible.
export function ActivityHeatmap({
  buckets,
  today,
}: {
  buckets: Map<string, number>;
  today: Date;
}) {
  const grid = weeksGrid(today);
  const todayKey = dayKey(today);
  const max = Math.max(0, ...buckets.values());

  return (
    <div>
      <div className="flex gap-[3px] overflow-hidden">
        {grid.map((week, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const future = day > todayKey;
              const level = heatLevel(buckets.get(day) ?? 0, max);
              return (
                <i
                  key={day}
                  title={future ? undefined : `${day}: ${buckets.get(day) ?? 0}`}
                  className="h-2.5 w-2.5 rounded-[2.5px]"
                  style={{
                    background: future ? "transparent" : `var(--heat-${level})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 font-mono text-[9.5px] text-ink-faint">
        <span>WENIGER</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <i
            key={l}
            className="inline-block h-[9px] w-[9px] rounded-[2px]"
            style={{ background: `var(--heat-${l})` }}
          />
        ))}
        <span>MEHR</span>
      </div>
    </div>
  );
}
