// "Karten gesehen" tile — replaces the streak tile (decision 2026-07-12:
// Lern-Aktivität covers recency; the old app's seen-counter returns instead).
// Progress bar uses --success (green = progress per accent convention).
export function CardsSeenTile({
  seen,
  total,
}: {
  seen: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((seen / total) * 100) : 0;

  return (
    <div>
      <div className="text-[38px] font-bold leading-none tracking-[-0.03em] text-ink">
        {seen}
        <small className="text-[15px] font-medium text-ink-faint"> / {total}</small>
      </div>
      <div
        className="relative mt-3.5 h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={seen}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${seen} von ${total} Karten gesehen`}
      >
        <i
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: "var(--success)" }}
        />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
        {pct} % gesehen
      </p>
    </div>
  );
}
