"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";
import { renderInline } from "@/lib/inline-markup";
import type { Choice, QuestionDisplay } from "@/db/schema";
import type { QuestionExplanationStructured } from "@/lib/question-explanation";
import { BRAND_ORANGE } from "@/lib/brand";
import { submitAnswer } from "./[id]/actions";

type Props = {
  question: QuestionDisplay;
  nextHref: string;
  homeHref: string;
  isLast: boolean;
};

type Verdict = {
  correct: boolean;
  explanation: string;
  explanationStructured: QuestionExplanationStructured | null;
  correctIds: Set<string>;
};

// Structured explanation blocks under the verdict box. Tint recipe = the
// flashcard section boxes (v4): Eselsbrücke = rose tint + rose border,
// Prüfungsfalle = borderless amber fill. Option rows reuse the quiz verdict
// colors (correct → success, chosen-wrong → danger).
function StructuredExplanation({
  data,
  choices,
  selected,
  correctIds,
}: {
  data: QuestionExplanationStructured;
  choices: Choice[];
  selected: Set<string>;
  correctIds: Set<string>;
}) {
  const label =
    "flex items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em]";
  const rows = choices.filter((c) => data.optionAnalysis?.[c.id]?.trim());
  const both = !!data.mnemonic && !!data.examTrap;

  return (
    <>
      {(data.mnemonic || data.examTrap) && (
        <div className={`mt-3 grid gap-3 ${both ? "sm:grid-cols-2" : ""}`}>
          {data.mnemonic && (
            <section className="rounded-lg border border-rose-500 bg-rose-500/10 p-3 dark:border-rose-400">
              <h4 className={`${label} text-rose-700 dark:text-rose-300`}>
                <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Eselsbrücke
              </h4>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink-soft">
                {renderInline(data.mnemonic)}
              </p>
            </section>
          )}
          {data.examTrap && (
            <section className="rounded-lg bg-amber-500/15 p-3">
              <h4 className={`${label} text-amber-700 dark:text-amber-300`}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Prüfungsfalle
              </h4>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink-soft">
                {renderInline(data.examTrap)}
              </p>
            </section>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-3 space-y-1.5" data-testid="option-analysis">
          {rows.map((c) => {
            const isAnswer = correctIds.has(c.id);
            const isChosenWrong = !isAnswer && selected.has(c.id);
            // Every wrong option gets a red tint; the CHOSEN wrong one stands
            // out with the stronger soft fill + a danger border (transparent
            // border on the others keeps row sizes identical).
            return (
              <p
                key={c.id}
                className={`flex items-start gap-2.5 rounded-md border px-3 py-2 text-[13.5px] leading-relaxed ${
                  isAnswer
                    ? "border-transparent bg-success-soft"
                    : isChosenWrong
                      ? "border-danger/50 bg-danger-soft"
                      : "border-transparent bg-danger/5"
                }`}
              >
                <span
                  className={`pt-px font-mono font-bold ${
                    isAnswer ? "text-success" : "text-danger"
                  }`}
                >
                  {c.id}
                </span>
                <span className="whitespace-pre-wrap break-words text-ink-soft">
                  {renderInline(data.optionAnalysis![c.id]!)}
                </span>
              </p>
            );
          })}
        </div>
      )}
    </>
  );
}

export function QuestionCard({ question, nextHref, homeHref, isLast }: Props) {
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
          explanationStructured: res.explanationStructured,
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

  // Option state → token classes (mockup .opt / .sel / .correct / .wrong).
  // Conditions unchanged; only the color mapping is tokenized.
  function choiceClass(choiceId: string): string {
    const base =
      "w-full text-left flex items-start gap-3 rounded-[10px] border-[1.5px] px-[15px] py-[13px] transition-colors";
    const isSelected = selectedSet.has(choiceId);

    if (!verdict) {
      return `${base} ${
        isSelected
          ? "border-accent bg-accent-soft"
          : "border-line bg-surface hover:border-line-strong"
      }`;
    }

    const isAnswer = verdict.correctIds.has(choiceId);
    if (isAnswer && isSelected) {
      return `${base} border-success bg-success-soft`;
    }
    if (isAnswer && !isSelected) {
      return `${base} border-success`;
    }
    if (!isAnswer && isSelected) {
      return `${base} border-danger bg-danger-soft`;
    }
    return `${base} border-line opacity-60`;
  }

  // Letter badge (mockup .key), recolored per option verdict state.
  function keyClass(choiceId: string): string {
    const base =
      "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border font-mono text-[10.5px]";
    if (verdict) {
      const isAnswer = verdict.correctIds.has(choiceId);
      const isSelected = selectedSet.has(choiceId);
      if (isAnswer) return `${base} border-success text-success`;
      if (isSelected) return `${base} border-danger text-danger`;
    }
    return `${base} border-line-strong text-ink-faint`;
  }

  return (
    <article>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-ink-soft">
          {question.domain}
        </span>
        <span>{question.cert}</span>
        {question.type === "multiple" && (
          <span className="ml-auto text-ink-faint">Mehrfachauswahl</span>
        )}
      </div>

      <h1 className="mt-6 text-xl font-semibold leading-relaxed tracking-[-0.01em] text-ink sm:text-2xl">
        {renderInline(question.prompt)}
      </h1>

      <div className="mt-8 flex flex-col gap-[9px]">
        {question.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => toggle(choice.id)}
            disabled={checked || isPending}
            aria-pressed={selectedSet.has(choice.id)}
            className={choiceClass(choice.id)}
          >
            <span className={keyClass(choice.id)}>{choice.id}</span>
            <span className="pt-0.5 text-[13.5px] leading-relaxed text-ink">
              {renderInline(choice.text)}
            </span>
          </button>
        ))}
      </div>

      {!checked && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={selected.length === 0 || isPending}
            className="rounded-lg px-6 py-3 text-[13px] font-semibold transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: BRAND_ORANGE, color: "var(--cta-ink)" }}
          >
            {isPending ? "Prüfe …" : "Antwort prüfen"}
          </button>
          <Link
            href={homeHref}
            className="inline-block rounded-lg border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-ink-faint"
          >
            Quiz beenden
          </Link>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>
          Fehler: {error}
        </p>
      )}

      {verdict && (
        <>
          {/* State-colored verdict box: success/danger tint + strong stripe
              with a soft ring glow (damped in dark — the card mnemonic-ring
              pattern). Tokens only, so it tracks theme + exam. */}
          <section
            className={`mt-8 rounded-[0_9px_9px_0] border-l-[3px] p-5 ring-2 ${
              verdict.correct
                ? "border-success bg-success/10 ring-success/30 dark:ring-success/15"
                : "border-danger bg-danger/10 ring-danger/30 dark:ring-danger/15"
            }`}
          >
            <header
              className={`text-sm font-semibold uppercase tracking-wide ${
                verdict.correct ? "text-success" : "text-danger"
              }`}
            >
              {verdict.correct ? "Richtig" : "Falsch"}
            </header>
            <p className="mt-3 leading-relaxed text-ink-soft">
              {renderInline(
                verdict.explanationStructured?.verdict?.trim()
                  ? verdict.explanationStructured.verdict
                  : verdict.explanation,
              )}
            </p>
          </section>

          {verdict.explanationStructured && (
            <StructuredExplanation
              data={verdict.explanationStructured}
              choices={question.choices}
              selected={selectedSet}
              correctIds={verdict.correctIds}
            />
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Link
              href={nextHref}
              className="inline-block rounded-lg px-6 py-3 text-[13px] font-semibold transition-transform hover:-translate-y-px"
              style={{ background: BRAND_ORANGE, color: "var(--cta-ink)" }}
            >
              {isLast ? "Quiz beenden" : "Nächste Frage →"}
            </Link>
            {!isLast && (
              <Link
                href={homeHref}
                className="inline-block rounded-lg border border-line-strong px-4 py-2 text-sm text-ink transition-colors hover:border-ink-faint"
              >
                Quiz beenden
              </Link>
            )}
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-ink-faint">
        {checked
          ? "Tasten: Enter · N · → für nächste Frage"
          : `Tasten: A–${lastChoiceId} wählen · Enter prüfen`}
      </p>
    </article>
  );
}
