import { LEARNING_TARGET, scoreColorClass } from "@/lib/scoreColor";

type Props = {
  lastRoundRate: number | null;
  overallRate: number | null;
};

export function TrendCompactBars({ lastRoundRate, overallRate }: Props) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="space-y-3">
        <Row label="Letzte Runde" rate={lastRoundRate} />
        <Row label="Dein Schnitt" rate={overallRate} />
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Lernziel 70% (nicht Bestehensgrenze).
      </p>
    </div>
  );
}

function Row({ label, rate }: { label: string; rate: number | null }) {
  const pct = rate === null ? 0 : Math.round(rate * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-zinc-600">{label}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
        {rate !== null && (
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-zinc-700"
            style={{ width: `${pct}%` }}
          />
        )}
        <span
          className="absolute top-0 bottom-0 border-l border-dashed border-zinc-600"
          style={{ left: `${LEARNING_TARGET * 100}%` }}
          aria-hidden
        />
      </div>
      <span
        className={`w-12 shrink-0 text-right text-sm font-semibold tabular-nums ${
          rate === null ? "text-zinc-400" : scoreColorClass(rate)
        }`}
      >
        {rate === null ? "—" : `${pct}%`}
      </span>
    </div>
  );
}
