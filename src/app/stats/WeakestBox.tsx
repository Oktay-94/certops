import type { WeakestQuestion } from "@/db/repository";
import { getDomainColor } from "@/lib/domain-colors";
import { CollapsibleQuestion } from "./CollapsibleQuestion";

export function WeakestBox({ items }: { items: WeakestQuestion[] }) {
  if (items.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-line bg-surface-2 px-4 text-center text-sm text-ink-faint">
        Noch keine schwachen Fragen erfasst.
      </div>
    );
  }

  return (
    <div className="h-[200px] overflow-y-auto rounded-lg border border-line bg-surface-2 p-3">
      {items.map((q) => {
        const color = getDomainColor(q.domain);
        return (
          <CollapsibleQuestion
            key={q.id}
            prompt={q.prompt}
            correctAnswerText={q.correctAnswerText}
            trailing={
              <div className="flex items-center gap-2">
                {/* Domain chip: solid hex + soft tint (mockup), dark-friendly */}
                <span
                  className="hidden rounded-full px-2 py-0.5 text-xs sm:inline-block"
                  style={{
                    color: color.solid,
                    background: `color-mix(in srgb, ${color.solid} 12%, transparent)`,
                  }}
                >
                  {q.domain}
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums"
                  style={{
                    color: "var(--danger)",
                    background: "var(--danger-soft)",
                  }}
                >
                  {q.wrongCount}× falsch
                </span>
              </div>
            }
          />
        );
      })}
    </div>
  );
}
