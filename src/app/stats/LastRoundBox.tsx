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
      <div className="h-[200px] flex items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200 px-4 text-center text-sm text-zinc-500">
        Spiel eine Runde, dann erscheinen hier deine Fragen.
      </div>
    );
  }

  const list = tab === "incorrect" ? review.incorrect : review.correct;
  const isWrong = tab === "incorrect";

  return (
    <div>
      <div className="flex items-center justify-end">
        <div
          className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-xs"
          role="tablist"
          aria-label="Letzte Runde filtern"
        >
          <TabButton
            active={isWrong}
            onClick={() => setTab("incorrect")}
            label={`Falsch · ${review.incorrectCount}`}
            tone="red"
          />
          <TabButton
            active={!isWrong}
            onClick={() => setTab("correct")}
            label={`Richtig · ${review.correctCount}`}
            tone="emerald"
          />
        </div>
      </div>

      <div
        className={`mt-3 h-[200px] overflow-y-auto rounded-lg p-3 ${
          isWrong ? "bg-red-50" : "bg-emerald-50"
        }`}
      >
        {list.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-zinc-600">
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
  tone: "red" | "emerald";
}) {
  const activeClass =
    tone === "red"
      ? "bg-white text-red-700 shadow-sm"
      : "bg-white text-emerald-700 shadow-sm";
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-md px-3 py-1 font-medium transition ${
        active ? activeClass : "text-zinc-500 hover:text-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}
