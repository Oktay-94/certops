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
import { getServiceColor } from "@/lib/service-domain-colors";
import { BRAND_ORANGE } from "@/lib/brand";
import {
  buildQuiz,
  hintExcerpt,
  type QuizQuestion,
} from "./quiz-logic";

type Phase = "config" | "running" | "result";
type CountChoice = 10 | 20 | 30 | 50 | "all";

const COUNT_OPTIONS: CountChoice[] = [10, 20, 30, 50, "all"];

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
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm text-white transition hover:bg-zinc-800"
      >
        <GraduationCap className="h-4 w-4" aria-hidden />
        Quiz starten
      </button>
    );
  }

  const total = questions.length;
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
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
            <h2 className="text-xl font-medium text-zinc-900">Dienste-Quiz</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-900"
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
      ? `${base} border-zinc-200 bg-zinc-100 text-zinc-900 ring-2 ring-emerald-500`
      : `${base} border-zinc-200 text-zinc-900 hover:border-zinc-400`;
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      <section>
        <h3 className="text-sm font-medium text-zinc-900">Anzahl Fragen</h3>
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
        <h3 className="text-sm font-medium text-zinc-900">Bereich</h3>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Alle Bereiche</option>
          {SERVICE_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-zinc-500">
          {poolSize} Dienste im gewählten Bereich · Modus: Zufällig
        </p>
      </section>

      <button
        type="button"
        onClick={onStart}
        disabled={poolSize === 0}
        className="rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
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
  const color = getServiceColor(question.card.domain);
  const answered = picked !== null;
  const progress = Math.round(((index + (answered ? 1 : 0)) / total) * 100);

  function optionClass(i: number): string {
    const base =
      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition";
    if (!answered) {
      return `${base} border-zinc-200 text-zinc-900 hover:border-zinc-400`;
    }
    const opt = question.options[i];
    if (opt.isCorrect) {
      return `${base} border-emerald-300 bg-emerald-50 text-emerald-900`;
    }
    if (i === picked) {
      return `${base} border-rose-300 bg-rose-50 text-rose-900`;
    }
    return `${base} border-zinc-200 text-zinc-400`;
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      {/* Progress + score */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Frage {index + 1} / {total}
          </span>
          <span className="flex items-center gap-3">
            <span>Streak: {streak}</span>
            <span>Score: {score}</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Prompt: service name + domain hint */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <span
          className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${color.tag}`}
        >
          {question.card.domain}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-zinc-900">
          {question.card.title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
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
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            )}
            {answered && !opt.isCorrect && i === picked && (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
            )}
            <span>{opt.text}</span>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {answered && (
        <div className="rounded-xl border-l-2 border-amber-500 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-900">
            {question.options[picked].isCorrect ? "Richtig!" : "Leider falsch."}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-amber-900">
            {hintExcerpt(question.card)}
          </p>
        </div>
      )}

      {answered && (
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800"
        >
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
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <Trophy className="h-7 w-7 text-amber-600" aria-hidden />
      </span>
      <div>
        <p className="text-3xl font-bold text-zinc-900">
          {score} / {total}
        </p>
        <p className="mt-1 text-lg font-medium text-emerald-700">{pct}%</p>
        <p className="mt-1 text-sm text-zinc-500">{trophyLabel(pct)}</p>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm text-white transition hover:bg-zinc-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Nochmal
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-zinc-200 px-5 py-3 text-sm text-zinc-900 transition hover:border-zinc-400"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
