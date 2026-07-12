"use client";

import { useMemo, useState } from "react";
import {
  Check,
  GraduationCap,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { SERVICES, SERVICE_DOMAINS, type ServiceCard } from "@/lib/services-data";
import { categoryStyle, tint } from "@/lib/category-style";
import { BRAND_ORANGE } from "@/lib/brand";
import { modeButtonVars } from "@/lib/mode-style";
import {
  buildQuiz,
  hintExcerpt,
  type QuizQuestion,
} from "./quiz-logic";

type Phase = "config" | "running" | "result";
type CountChoice = 10 | 20 | 30 | 50 | "all";

const COUNT_OPTIONS: CountChoice[] = [10, 20, 30, 50, "all"];

// Solid CTA — inverts cleanly in both themes (ink is near-black in light,
// near-white in dark; canvas text contrasts either way).
const SOLID_BTN =
  "rounded-xl bg-ink px-6 py-3 text-canvas transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

function trophyLabel(pct: number): string {
  if (pct >= 90) return "Exzellent";
  if (pct >= 75) return "Stark";
  if (pct >= 50) return "Solide";
  return "Weiter üben";
}

export function ServiceQuiz() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("config");

  const [count, setCount] = useState<CountChoice>(20);
  const [domain, setDomain] = useState<string>("all");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const pool = useMemo<ServiceCard[]>(
    () =>
      domain === "all"
        ? [...SERVICES]
        : SERVICES.filter((s) => s.domain === domain),
    [domain],
  );

  function openQuiz() {
    setPhase("config");
    setOpen(true);
  }

  function start() {
    const n = count === "all" ? pool.length : Math.min(count, pool.length);
    setQuestions(buildQuiz(pool, n));
    setIndex(0);
    setScore(0);
    setStreak(0);
    setPicked(null);
    setPhase("running");
  }

  function answer(optionIdx: number) {
    if (picked !== null) return;
    setPicked(optionIdx);
    const correct = questions[index].options[optionIdx].isCorrect;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setPhase("result");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  function close() {
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openQuiz}
        style={modeButtonVars("quiz")}
        className="mode-start-btn mt-4 rounded-xl px-5 py-3 text-sm"
      >
        <span className="mode-start-btn__content inline-flex items-center gap-2">
          <GraduationCap className="h-4 w-4" aria-hidden />
          Quiz starten
        </span>
      </button>
    );
  }

  const total = questions.length;
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]"
              style={{ backgroundColor: BRAND_ORANGE }}
              aria-hidden
            >
              <GraduationCap size={19} className="text-white" />
            </span>
            <h2 className="text-xl font-medium text-ink">Dienste-Quiz</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-soft transition hover:border-line-strong hover:text-ink"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {phase === "config" && (
          <ConfigView
            count={count}
            setCount={setCount}
            domain={domain}
            setDomain={setDomain}
            poolSize={pool.length}
            onStart={start}
          />
        )}

        {phase === "running" && total > 0 && (
          <RunningView
            question={questions[index]}
            index={index}
            total={total}
            score={score}
            streak={streak}
            picked={picked}
            onAnswer={answer}
            onNext={next}
          />
        )}

        {phase === "result" && (
          <ResultView
            score={score}
            total={total}
            pct={pct}
            onAgain={() => setPhase("config")}
            onClose={close}
          />
        )}
      </div>
    </div>
  );
}

function ConfigView({
  count,
  setCount,
  domain,
  setDomain,
  poolSize,
  onStart,
}: {
  count: CountChoice;
  setCount: (c: CountChoice) => void;
  domain: string;
  setDomain: (d: string) => void;
  poolSize: number;
  onStart: () => void;
}) {
  function chipClass(active: boolean): string {
    const base =
      "rounded-xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50";
    return active
      ? `${base} border-line bg-surface-2 text-ink ring-2 ring-[var(--success)]`
      : `${base} border-line text-ink hover:border-line-strong`;
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      <section>
        <h3 className="text-sm font-medium text-ink">Anzahl Fragen</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {COUNT_OPTIONS.map((c) => (
            <button
              key={String(c)}
              type="button"
              onClick={() => setCount(c)}
              aria-pressed={count === c}
              className={chipClass(count === c)}
            >
              {c === "all" ? "Alle" : c}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-ink">Bereich</h3>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink transition hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">Alle Bereiche</option>
          {SERVICE_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-ink-soft">
          {poolSize} Dienste im gewählten Bereich · Modus: Zufällig
        </p>
      </section>

      <button
        type="button"
        onClick={onStart}
        disabled={poolSize === 0}
        className={SOLID_BTN}
      >
        Quiz starten
      </button>
    </div>
  );
}

function RunningView({
  question,
  index,
  total,
  score,
  streak,
  picked,
  onAnswer,
  onNext,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  score: number;
  streak: number;
  picked: number | null;
  onAnswer: (i: number) => void;
  onNext: () => void;
}) {
  const { color, Icon } = categoryStyle(question.card.domain);
  const answered = picked !== null;
  const progress = Math.round(((index + (answered ? 1 : 0)) / total) * 100);

  function optionClass(i: number): string {
    const base =
      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition";
    if (!answered) {
      return `${base} border-line text-ink hover:border-line-strong`;
    }
    const opt = question.options[i];
    if (opt.isCorrect) {
      return `${base} border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200`;
    }
    if (i === picked) {
      return `${base} border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-200`;
    }
    return `${base} border-line text-ink-faint`;
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      {/* Progress + score */}
      <div>
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span>
            Frage {index + 1} / {total}
          </span>
          <span className="flex items-center gap-3">
            <span>Streak: {streak}</span>
            <span>Score: {score}</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: "var(--success)" }}
          />
        </div>
      </div>

      {/* Prompt: service name + domain hint */}
      <div className="rounded-xl border border-line bg-surface-2 p-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: tint(color, "14"),
            color,
            borderColor: tint(color, "33"),
          }}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {question.card.domain}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-ink">
          {question.card.title}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          Welche Beschreibung passt zu diesem Dienst?
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAnswer(i)}
            disabled={answered}
            className={optionClass(i)}
          >
            {answered && opt.isCorrect && (
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            )}
            {answered && !opt.isCorrect && i === picked && (
              <X
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"
                aria-hidden
              />
            )}
            <span>{opt.text}</span>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {answered && (
        <div className="rounded-xl border-l-2 border-amber-500 bg-amber-500/10 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {question.options[picked].isCorrect ? "Richtig!" : "Leider falsch."}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-amber-700 dark:text-amber-300">
            {hintExcerpt(question.card)}
          </p>
        </div>
      )}

      {answered && (
        <button type="button" onClick={onNext} className={SOLID_BTN}>
          {index + 1 >= total ? "Auswertung" : "Weiter"}
        </button>
      )}
    </div>
  );
}

function ResultView({
  score,
  total,
  pct,
  onAgain,
  onClose,
}: {
  score: number;
  total: number;
  pct: number;
  onAgain: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col items-center gap-4 py-6 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
        <Trophy className="h-7 w-7 text-amber-600 dark:text-amber-400" aria-hidden />
      </span>
      <div>
        <p className="text-3xl font-bold text-ink">
          {score} / {total}
        </p>
        <p className="mt-1 text-lg font-medium text-emerald-600 dark:text-emerald-400">
          {pct}%
        </p>
        <p className="mt-1 text-sm text-ink-soft">{trophyLabel(pct)}</p>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm text-canvas transition hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Nochmal
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-line px-5 py-3 text-sm text-ink transition hover:border-line-strong"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
