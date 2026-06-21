"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Clock,
  RotateCcw,
  Swords,
  Trophy,
  X,
} from "lucide-react";
import { SERVICES } from "@/lib/services-data";
import { getServiceColor } from "@/lib/service-domain-colors";
import { BRAND_ORANGE } from "@/lib/brand";
import {
  buildBattle,
  QUESTIONS_PER_ROUND,
  summarize,
  type BattleQuestion,
  type BattleResult,
  type Difficulty,
} from "./battle-logic";

type Phase = "config" | "running" | "result";
const QUESTION_SECONDS = 60;
const TIMEOUT_REVEAL_MS = 1500;

const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 1, label: "Leicht", hint: "Distraktoren aus anderen Bereichen — grobes Domänen-Wissen reicht." },
  { value: 2, label: "Mittel", hint: "Kuratierte Falle + Beschreibungen aus demselben Bereich." },
  { value: 3, label: "Schwer", hint: "Die engsten Geschwister-Dienste — Feinheiten entscheiden." },
];

function trophyLabel(pct: number): string {
  if (pct >= 90) return "Exzellent";
  if (pct >= 75) return "Stark";
  if (pct >= 50) return "Solide";
  return "Weiter üben";
}

export function BattleQuiz() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("config");
  const [difficulty, setDifficulty] = useState<Difficulty>(1);

  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // -1 = timed out
  const [results, setResults] = useState<BattleResult[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopTimers() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hardRef.current) clearTimeout(hardRef.current);
    timerRef.current = null;
    hardRef.current = null;
  }
  function clearReveal() {
    if (revealRef.current) clearTimeout(revealRef.current);
    revealRef.current = null;
  }

  function advance() {
    clearReveal();
    if (index + 1 >= questions.length) {
      setPhase("result");
      return;
    }
    setPicked(null);
    setSecondsLeft(QUESTION_SECONDS);
    setIndex((i) => i + 1);
  }

  // Hard timeout for the current question. Fires from a setTimeout callback
  // (never synchronously in an effect). Idempotent: a manual answer stops the
  // timers first, so this can't flip an answered question to "timed out".
  function onTimeout() {
    if (picked !== null) return;
    stopTimers();
    const q = questions[index];
    setResults((prev) => [
      ...prev,
      { card: q.card, correct: false, timedOut: true, timeSec: QUESTION_SECONDS },
    ]);
    setPicked(-1);
    clearReveal();
    revealRef.current = setTimeout(advance, TIMEOUT_REVEAL_MS);
  }
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });

  // One countdown interval + one hard 60s timeout per question. The effect only
  // SETS UP timers; all state changes happen in their callbacks. Manual answers
  // call stopTimers(), so the hard timeout never fires during feedback.
  useEffect(() => {
    if (!open || phase !== "running") return undefined;
    const tick = setInterval(
      () => setSecondsLeft((p) => (p > 0 ? p - 1 : 0)),
      1000,
    );
    const hard = setTimeout(() => onTimeoutRef.current(), QUESTION_SECONDS * 1000);
    timerRef.current = tick;
    hardRef.current = hard;
    return () => {
      clearInterval(tick);
      clearTimeout(hard);
    };
  }, [index, phase, open]);

  useEffect(
    () => () => {
      stopTimers();
      clearReveal();
    },
    [],
  );

  function startRound() {
    setQuestions(buildBattle(SERVICES, difficulty, QUESTIONS_PER_ROUND));
    setIndex(0);
    setPicked(null);
    setResults([]);
    setSecondsLeft(QUESTION_SECONDS);
    setPhase("running");
  }

  function answer(optionIdx: number) {
    if (picked !== null) return;
    stopTimers();
    const q = questions[index];
    setResults((prev) => [
      ...prev,
      {
        card: q.card,
        correct: q.options[optionIdx].isCorrect,
        timedOut: false,
        timeSec: QUESTION_SECONDS - secondsLeft,
      },
    ]);
    setPicked(optionIdx);
  }

  function openQuiz() {
    setPhase("config");
    setOpen(true);
  }
  function close() {
    stopTimers();
    clearReveal();
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openQuiz}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm text-white transition hover:bg-zinc-800"
      >
        <Swords className="h-4 w-4" aria-hidden />
        Battle starten
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/40 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]"
              style={{ backgroundColor: BRAND_ORANGE }}
              aria-hidden
            >
              <Swords size={19} className="text-white" />
            </span>
            <h2 className="text-xl font-medium text-zinc-900">Battle Cards</h2>
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
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onStart={startRound}
          />
        )}

        {phase === "running" && questions.length > 0 && (
          <RunningView
            question={questions[index]}
            index={index}
            total={questions.length}
            picked={picked}
            secondsLeft={secondsLeft}
            correctSoFar={results.filter((r) => r.correct).length}
            onAnswer={answer}
            onNext={advance}
          />
        )}

        {phase === "result" && (
          <ResultView
            results={results}
            difficulty={difficulty}
            onAgain={() => setPhase("config")}
            onClose={close}
          />
        )}
      </div>
    </div>
  );
}

function ConfigView({
  difficulty,
  setDifficulty,
  onStart,
}: {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onStart: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-5">
      <section>
        <h3 className="text-sm font-medium text-zinc-900">Schwierigkeit</h3>
        <p className="mt-1 text-xs text-zinc-500">
          {QUESTIONS_PER_ROUND} Fragen · 4 Optionen · {QUESTION_SECONDS}s pro Frage · kein Fortschritt
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {LEVELS.map((lvl) => {
            const active = difficulty === lvl.value;
            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() => setDifficulty(lvl.value)}
                aria-pressed={active}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-zinc-200 bg-zinc-100 ring-2 ring-emerald-500"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[11px] text-white">
                    {lvl.value}
                  </span>
                  {lvl.label}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">{lvl.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={onStart}
        className="rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800"
      >
        Battle starten
      </button>
    </div>
  );
}

function RunningView({
  question,
  index,
  total,
  picked,
  secondsLeft,
  correctSoFar,
  onAnswer,
  onNext,
}: {
  question: BattleQuestion;
  index: number;
  total: number;
  picked: number | null;
  secondsLeft: number;
  correctSoFar: number;
  onAnswer: (i: number) => void;
  onNext: () => void;
}) {
  const color = getServiceColor(question.card.domain);
  const answered = picked !== null;
  const timedOut = picked === -1;
  const lowTime = !answered && secondsLeft <= 10;

  function optionClass(i: number): string {
    const base =
      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition";
    if (!answered) return `${base} border-zinc-200 text-zinc-900 hover:border-zinc-400`;
    const opt = question.options[i];
    if (opt.isCorrect) return `${base} border-emerald-300 bg-emerald-50 text-emerald-900`;
    if (i === picked) return `${base} border-rose-300 bg-rose-50 text-rose-900`;
    return `${base} border-zinc-200 text-zinc-400`;
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      {/* Progress + timer */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Frage {index + 1} / {total}
          </span>
          <span className="flex items-center gap-3">
            <span>Richtig: {correctSoFar}</span>
            <span
              className={`flex items-center gap-1 tabular-nums ${
                lowTime ? "font-semibold text-rose-600" : ""
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {secondsLeft}s
            </span>
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-all ${
              lowTime ? "bg-rose-500" : "bg-emerald-500"
            }`}
            style={{ width: `${(secondsLeft / QUESTION_SECONDS) * 100}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <span
          className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${color.tag}`}
        >
          {question.card.domain}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-zinc-900">
          {question.card.front}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">Welche Beschreibung ist korrekt?</p>
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

      {/* Feedback + note */}
      {answered && (
        <div className="rounded-xl border-l-2 border-amber-500 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-900">
            {timedOut
              ? "Zeit abgelaufen."
              : question.options[picked].isCorrect
                ? "Richtig!"
                : "Leider falsch."}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-snug text-amber-900">
            {question.card.hint}
          </p>
        </div>
      )}

      {/* Manual answer → "Weiter"; a real timeout advances on its own. */}
      {answered && !timedOut && (
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800"
        >
          {index + 1 >= total ? "Auswertung" : "Weiter →"}
        </button>
      )}
      {timedOut && (
        <p className="text-center text-xs text-zinc-400">Weiter in Kürze …</p>
      )}
    </div>
  );
}

function ResultView({
  results,
  difficulty,
  onAgain,
  onClose,
}: {
  results: BattleResult[];
  difficulty: Difficulty;
  onAgain: () => void;
  onClose: () => void;
}) {
  const s = summarize(results);
  const timedOut = results.filter((r) => r.timedOut).length;
  const levelLabel = LEVELS.find((l) => l.value === difficulty)?.label ?? "";

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <Trophy className="h-7 w-7 text-amber-600" aria-hidden />
        </span>
        <div>
          <p className="text-3xl font-bold text-zinc-900">
            {s.correct} / {s.total}
          </p>
          <p className="mt-1 text-lg font-medium text-emerald-700">
            {s.accuracyPct}%
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {trophyLabel(s.accuracyPct)} · Stufe {difficulty} ({levelLabel})
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { k: "Richtig", v: s.correct, c: "text-emerald-700" },
          { k: "Falsch", v: s.wrong - timedOut, c: "text-rose-600" },
          { k: "Zeit", v: timedOut, c: "text-rose-600" },
          { k: "Ø Zeit", v: `${s.avgTimeSec}s`, c: "text-zinc-900" },
        ].map((cell) => (
          <div
            key={cell.k}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center"
          >
            <p className={`text-lg font-bold ${cell.c}`}>{cell.v}</p>
            <p className="text-[11px] text-zinc-500">{cell.k}</p>
          </div>
        ))}
      </div>

      {/* Quizzed services */}
      <div>
        <h3 className="text-sm font-medium text-zinc-900">Abgefragte Dienste</h3>
        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-zinc-200">
          <ul className="divide-y divide-zinc-100">
            {results.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
              >
                <span className="min-w-0 truncate text-zinc-800">{r.card.title}</span>
                {r.correct ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm text-white transition hover:bg-zinc-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Neu starten (50 neue)
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
