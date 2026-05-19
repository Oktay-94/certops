"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { QuestionDisplay } from "@/db/schema";
import { submitAnswer } from "./[id]/actions";

type Props = {
  question: QuestionDisplay;
  nextHref: string;
  isLast: boolean;
};

type Verdict = {
  correct: boolean;
  explanation: string;
  correctIds: Set<string>;
};

export function QuestionCard({ question, nextHref, isLast }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const checked = verdict !== null;
  const selectedSet = new Set(selected);
  const lastChoiceId = question.choices[question.choices.length - 1]?.id ?? "";

  const toggle = useCallback(
    (choiceId: string) => {
      if (checked || isPending) return;
      if (question.type === "single") {
        setSelected([choiceId]);
        return;
      }
      setSelected((prev) =>
        prev.includes(choiceId)
          ? prev.filter((id) => id !== choiceId)
          : [...prev, choiceId],
      );
    },
    [checked, isPending, question.type],
  );

  const onSubmit = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await submitAnswer({
          questionId: question.id,
          selected,
        });
        setVerdict({
          correct: res.correct,
          explanation: res.explanation,
          correctIds: new Set(res.correctIds),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      }
    });
  }, [question.id, selected]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      if (!checked) {
        // Choice-Buchstaben: case-insensitiv gegen choice.id matchen.
        const match = question.choices.find(
          (c) => c.id.toLowerCase() === key.toLowerCase(),
        );
        if (match) {
          e.preventDefault();
          toggle(match.id);
          return;
        }
        if (key === "Enter" && selected.length > 0 && !isPending) {
          e.preventDefault();
          onSubmit();
        }
        return;
      }

      // verdict gesetzt → Weiter-Navigation
      if (key === "Enter" || key === "ArrowRight" || key.toLowerCase() === "n") {
        e.preventDefault();
        router.push(nextHref);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    question.choices,
    selected,
    checked,
    isPending,
    nextHref,
    router,
    toggle,
    onSubmit,
  ]);

  function choiceClass(choiceId: string): string {
    const base =
      "w-full text-left border rounded-xl px-5 py-4 transition flex items-start gap-3";
    const isSelected = selectedSet.has(choiceId);

    if (!verdict) {
      return `${base} ${
        isSelected
          ? "border-zinc-900 bg-zinc-50"
          : "border-zinc-200 hover:border-zinc-400"
      }`;
    }

    const isAnswer = verdict.correctIds.has(choiceId);
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
            disabled={checked || isPending}
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
          onClick={onSubmit}
          disabled={selected.length === 0 || isPending}
          className="mt-8 rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isPending ? "Prüfe …" : "Antwort prüfen"}
        </button>
      )}

      {error && (
        <p className="mt-4 text-sm text-rose-700">Fehler: {error}</p>
      )}

      {verdict && (
        <>
          <section className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <header
              className={`text-sm font-semibold uppercase tracking-wide ${
                verdict.correct ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {verdict.correct ? "Richtig" : "Falsch"}
            </header>
            <p className="mt-3 leading-relaxed text-zinc-800">
              {verdict.explanation}
            </p>
          </section>

          <Link
            href={nextHref}
            className="mt-6 inline-block rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800"
          >
            {isLast ? "Quiz beenden" : "Nächste Frage"}
          </Link>
        </>
      )}

      <p className="mt-6 text-xs text-zinc-500">
        {checked
          ? "Tasten: Enter · N · → für nächste Frage"
          : `Tasten: A–${lastChoiceId} wählen · Enter prüfen`}
      </p>
    </article>
  );
}
