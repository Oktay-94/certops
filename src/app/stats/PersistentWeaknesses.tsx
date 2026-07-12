import type { PersistentWeakness } from "@/db/repository";

// "Hartnäckigste Schwachstellen" bars (mockup .weak): wrong-rate per question,
// danger-colored bars. Distinct from "Schwächste Fragen" (absolute count).
function clip(text: string, max = 46): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function PersistentWeaknesses({
  items,
}: {
  items: PersistentWeakness[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-lg border border-line bg-surface-2 px-4 text-center text-sm text-ink-faint">
        Noch keine wiederholten Fehler — stark.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((q) => {
        const pct = Math.round(q.wrongRate * 100);
        return (
          <div key={q.id} className="flex items-center gap-3">
            <span className="w-2/5 shrink-0 text-[12.5px] font-medium leading-tight text-ink">
              {clip(q.prompt)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-surface-2">
              <span
                className="block h-full rounded-[3px]"
                style={{ width: `${pct}%`, background: "var(--danger)" }}
              />
            </div>
            <span
              className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums"
              style={{ color: "var(--danger)" }}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
