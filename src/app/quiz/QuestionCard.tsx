"use client";

import { useState } from "react";
import type { Question } from "@/db/schema";

type Props = {
  question: Question;
};

export function QuestionCard({ question }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const correctSet = new Set(question.correct);
  const selectedSet = new Set(selected);
  const isCorrect =
    checked &&
    selectedSet.size === correctSet.size &&
    [...selectedSet].every((id) => correctSet.has(id));

  function toggle(choiceId: string) {
    if (checked) return;
    if (question.type === "single") {
      setSelected([choiceId]);
      return;
    }
    setSelected((prev) =>
      prev.includes(choiceId)
        ? prev.filter((id) => id !== choiceId)
        : [...prev, choiceId],
    );
  }

  function choiceClass(choiceId: string): string {
    const base =
      "w-full text-left border rounded-xl px-5 py-4 transition flex items-start gap-3";
    const isSelected = selectedSet.has(choiceId);
    const isAnswer = correctSet.has(choiceId);

    if (!checked) {
      return `${base} ${
        isSelected
          ? "border-zinc-900 bg-zinc-50"
          : "border-zinc-200 hover:border-zinc-400"
      }`;
    }

    if (isAnswer && isSelected) {
      return `${base} border-emerald-600 bg-emerald-50`;
    }
    if (isAnswer && !isSelected) {
      return `${base} border-emerald-600`;
    }
    if (!isAnswer && isSelected) {
      return `${base} border-rose-600 bg-rose-50`;
    }
    return `${base} border-zinc-200 opacity-60`;
  }

  return (
    <article>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700">
          {question.domain}
        </span>
        <span>{question.cert}</span>
        {question.type === "multiple" && (
          <span className="ml-auto text-zinc-400">Mehrfachauswahl</span>
        )}
      </div>

      <h1 className="mt-6 text-xl sm:text-2xl font-medium leading-relaxed text-zinc-900">
        {question.prompt}
      </h1>

      <div className="mt-8 flex flex-col gap-3">
        {question.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => toggle(choice.id)}
            disabled={checked}
            aria-pressed={selectedSet.has(choice.id)}
            className={choiceClass(choice.id)}
          >
            <span className="font-medium text-zinc-500">{choice.id}</span>
            <span className="text-zinc-900">{choice.text}</span>
          </button>
        ))}
      </div>

      {!checked && (
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={selected.length === 0}
          className="mt-8 rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Antwort prüfen
        </button>
      )}

      {checked && (
        <section className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <header
            className={`text-sm font-semibold uppercase tracking-wide ${
              isCorrect ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {isCorrect ? "Richtig" : "Falsch"}
          </header>
          <p className="mt-3 leading-relaxed text-zinc-800">
            {question.explanation}
          </p>
        </section>
      )}
    </article>
  );
}
