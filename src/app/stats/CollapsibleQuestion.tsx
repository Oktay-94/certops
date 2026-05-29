"use client";

import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

type Props = {
  prompt: string;
  correctAnswerText: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  promptColorClass?: string;
};

export function CollapsibleQuestion({
  prompt,
  correctAnswerText,
  leading,
  trailing,
  promptColorClass = "text-zinc-900",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg bg-white p-3 mb-2 last:mb-0 border border-zinc-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 text-left"
        aria-expanded={open}
      >
        {leading && <span className="mt-0.5 shrink-0">{leading}</span>}
        <span className={`flex-1 text-sm ${promptColorClass}`}>{prompt}</span>
        {trailing && <span className="shrink-0">{trailing}</span>}
        <ChevronRight
          className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-2 border-t border-zinc-100 pt-2 text-sm text-zinc-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Richtige Antwort
          </span>
          <p className="mt-1">{correctAnswerText}</p>
        </div>
      )}
    </div>
  );
}
