"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import type { LastRoundReview } from "@/db/repository";
import { CollapsibleQuestion } from "./CollapsibleQuestion";

type Tab = "incorrect" | "correct";

export function LastRoundBox({ review }: { review: LastRoundReview }) {
  const [tab, setTab] = useState<Tab>("incorrect");

  if (review.roundId === null) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-line bg-surface-2 px-4 text-center text-sm text-ink-faint">
        Spiel eine Runde, dann erscheinen hier deine Fragen.
      </div>
    );
  }

  const list = tab === "incorrect" ? review.incorrect : review.correct;
  const isWrong = tab === "incorrect";

  return (
    <div>
      {/* Tab pill (mockup .tabs): surface-2 track, active = surface + ring */}
      <div
        className="inline-flex rounded-full border border-line bg-surface-2 p-[3px] text-xs"
        role="tablist"
        aria-label="Letzte Runde filtern"
      >
        <TabButton
          active={isWrong}
          onClick={() => setTab("incorrect")}
          label={`Falsch · ${review.incorrectCount}`}
          tone="danger"
        />
        <TabButton
          active={!isWrong}
          onClick={() => setTab("correct")}
          label={`Richtig · ${review.correctCount}`}
          tone="success"
        />
      </div>

      <div
        className="mt-3 h-[200px] overflow-y-auto rounded-lg p-3"
        style={{
          background: isWrong ? "var(--danger-soft)" : "var(--success-soft)",
        }}
      >
        {list.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-ink-soft">
            {isWrong
              ? "Keine Fehler in dieser Runde."
              : "Keine richtigen Antworten in dieser Runde."}
          </div>
        ) : (
          list.map((q) => (
            <CollapsibleQuestion
              key={q.questionId}
              prompt={q.questionText}
              correctAnswerText={q.correctAnswerText}
              promptColorClass={isWrong ? "text-red-700" : "text-emerald-700"}
              leading={
                isWrong ? (
                  <Minus className="h-4 w-4 text-red-700" aria-hidden />
                ) : (
                  <Plus className="h-4 w-4 text-emerald-700" aria-hidden />
                )
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone: "danger" | "success";
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="rounded-full px-3.5 py-1 font-semibold transition-colors"
      style={
        active
          ? {
              background: "var(--surface)",
              color: tone === "danger" ? "var(--danger)" : "var(--success)",
              boxShadow: "0 0 0 1px var(--border)",
            }
          : { color: "var(--ink-soft)" }
      }
    >
      {label}
    </button>
  );
}
