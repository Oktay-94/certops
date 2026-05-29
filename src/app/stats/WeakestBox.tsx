import type { WeakestQuestion } from "@/db/repository";
import { getDomainColor } from "@/lib/domain-colors";
import { CollapsibleQuestion } from "./CollapsibleQuestion";

export function WeakestBox({ items }: { items: WeakestQuestion[] }) {
  if (items.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 px-4 text-center text-sm text-zinc-500">
        Noch keine schwachen Fragen erfasst.
      </div>
    );
  }

  return (
    <div className="h-[200px] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-200 p-3">
      {items.map((q) => {
        const color = getDomainColor(q.domain);
        return (
          <CollapsibleQuestion
            key={q.id}
            prompt={q.prompt}
            correctAnswerText={q.correctAnswerText}
            trailing={
              <div className="flex items-center gap-2">
                <span
                  className={`hidden sm:inline-block rounded-full border px-2 py-0.5 text-xs ${color.tag}`}
                >
                  {q.domain}
                </span>
                <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-red-700">
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
