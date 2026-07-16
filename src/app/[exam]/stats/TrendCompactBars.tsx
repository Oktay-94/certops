import { LEARNING_TARGET, scoreColorClass } from "@/lib/scoreColor";

type Props = {
  lastRoundRate: number | null;
  overallRate: number | null;
};

export function TrendCompactBars({ lastRoundRate, overallRate }: Props) {
  return (
    <div>
      <div className="space-y-3">
        <Row label="Letzte Runde" rate={lastRoundRate} />
        <Row label="Dein Schnitt" rate={overallRate} />
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Lernziel 70% (nicht Bestehensgrenze).
      </p>
    </div>
  );
}

function Row({ label, rate }: { label: string; rate: number | null }) {
  const pct = rate === null ? 0 : Math.round(rate * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-ink-soft">{label}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
        {rate !== null && (
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%`, background: "var(--ink)" }}
          />
        )}
        <span
          className="absolute top-0 bottom-0 border-l border-dashed"
          style={{
            left: `${LEARNING_TARGET * 100}%`,
            borderColor: "var(--ink-faint)",
          }}
          aria-hidden
        />
      </div>
      <span
        className={`w-12 shrink-0 text-right text-sm font-semibold tabular-nums ${
          rate === null ? "text-ink-faint" : scoreColorClass(rate)
        }`}
      >
        {rate === null ? "—" : `${pct}%`}
      </span>
    </div>
  );
}
