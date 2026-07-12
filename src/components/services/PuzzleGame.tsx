"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Puzzle, RotateCcw, Shuffle, Trophy, X } from "lucide-react";
import { SERVICES } from "@/lib/services-data";
import { categoryStyle, tint } from "@/lib/category-style";
import { BRAND_ORANGE } from "@/lib/brand";
import { modeButtonVars } from "@/lib/mode-style";
import {
  buildRounds,
  CATEGORY_GROUPS,
  summarizePuzzle,
  type PuzzleRound,
  type PuzzleVariant,
  type RoundResult,
} from "./puzzle-logic";

type Phase = "config" | "playing" | "result";
const ADVANCE_MS = 650;
const DRAG_THRESHOLD = 6;

function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function variantLabel(variant: PuzzleVariant): string {
  if (variant.kind === "mixed") return "Alle gemischt";
  return CATEGORY_GROUPS.find((g) => g.id === variant.groupId)?.label ?? "";
}

export function PuzzleGame() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("config");
  const [variant, setVariant] = useState<PuzzleVariant>({ kind: "mixed" });

  const [rounds, setRounds] = useState<PuzzleRound[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);

  function openGame() {
    setPhase("config");
    setOpen(true);
  }
  function close() {
    setOpen(false);
  }
  function start(v: PuzzleVariant) {
    setVariant(v);
    setRounds(buildRounds(SERVICES, v));
    setRoundIdx(0);
    setResults([]);
    setPhase("playing");
  }
  function onRoundDone(result: RoundResult) {
    setResults((prev) => [...prev, result]);
    if (roundIdx + 1 >= rounds.length) {
      setPhase("result");
    } else {
      setRoundIdx((i) => i + 1);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openGame}
        style={modeButtonVars("puzzle")}
        className="mode-start-btn mt-4 rounded-xl px-5 py-3 text-sm"
      >
        <span className="mode-start-btn__content inline-flex items-center gap-2">
          <Puzzle className="h-4 w-4" aria-hidden />
          Puzzle starten
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/40 p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]"
              style={{ backgroundColor: BRAND_ORANGE }}
              aria-hidden
            >
              <Puzzle size={19} className="text-white" />
            </span>
            <h2 className="text-xl font-medium text-ink">Puzzle</h2>
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

        {phase === "config" && <ConfigView onStart={start} />}

        {phase === "playing" && rounds.length > 0 && (
          <PlayingView
            key={roundIdx}
            round={rounds[roundIdx]}
            roundIdx={roundIdx}
            totalRounds={rounds.length}
            variantName={variantLabel(variant)}
            onRoundDone={onRoundDone}
          />
        )}

        {phase === "result" && (
          <ResultView
            results={results}
            variantName={variantLabel(variant)}
            onAgain={() => setPhase("config")}
            onClose={close}
          />
        )}
      </div>
    </div>
  );
}

function ConfigView({ onStart }: { onStart: (v: PuzzleVariant) => void }) {
  return (
    <div className="mt-5 flex flex-col gap-5">
      <section>
        <h3 className="text-sm font-medium text-ink">Variante</h3>
        <p className="mt-1 text-xs text-ink-soft">
          Begriff auf die passende Beschreibung ziehen oder antippen. Freies Üben,
          kein Fortschritt.
        </p>
        <button
          type="button"
          onClick={() => onStart({ kind: "mixed" })}
          className="mt-3 w-full rounded-xl border border-line px-4 py-3 text-left transition hover:border-line-strong"
        >
          <span className="text-sm font-medium text-ink">Alle gemischt</span>
          <span className="mt-0.5 block text-xs text-ink-soft">
            10 Runden à 7 zufällige Dienste aus allen 172.
          </span>
        </button>
      </section>

      <section>
        <h3 className="text-sm font-medium text-ink">Kategorie-Puzzles</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATEGORY_GROUPS.map((g) => {
            const { color, Icon } = categoryStyle(g.categories[0]);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onStart({ kind: "category", groupId: g.id })}
                className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-left text-sm text-ink transition hover:border-line-strong"
              >
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: tint(color, "1f"), color }}
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {g.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

type DragState = { num: number; x: number; y: number; moved: boolean };

function PlayingView({
  round,
  roundIdx,
  totalRounds,
  variantName,
  onRoundDone,
}: {
  round: PuzzleRound;
  roundIdx: number;
  totalRounds: number;
  variantName: string;
  onRoundDone: (r: RoundResult) => void;
}) {
  const terms = useMemo(() => shuffle(round.pairs), [round]);
  const descriptions = useMemo(() => shuffle(round.pairs), [round]);

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [misactions, setMisactions] = useState(0);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const doneRef = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = round.pairs.length;

  function finishIfSolved(nextMatched: Set<number>, nextMisactions: number) {
    if (nextMatched.size === total && !doneRef.current) {
      doneRef.current = true;
      setTimeout(() => onRoundDone({ size: total, misactions: nextMisactions }), ADVANCE_MS);
    }
  }

  // Single match resolver — used by both drag-drop and tap-to-select.
  function attemptMatch(termNum: number, descNum: number) {
    if (matched.has(descNum) || matched.has(termNum)) return;
    if (termNum === descNum) {
      const next = new Set(matched).add(termNum);
      setMatched(next);
      setSelected(null);
      finishIfSolved(next, misactions);
    } else {
      const m = misactions + 1;
      setMisactions(m);
      setSelected(null);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setWrongFlash(descNum);
      flashTimer.current = setTimeout(() => setWrongFlash(null), 400);
    }
  }

  // ── Pointer drag (mouse + touch unified via pointer capture). ──
  function onTermPointerDown(e: React.PointerEvent, num: number) {
    if (matched.has(num)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelected(num);
    setDrag({ num, x: e.clientX, y: e.clientY, moved: false });
  }
  function onTermPointerMove(e: React.PointerEvent) {
    setDrag((d) => {
      if (!d) return d;
      const moved =
        d.moved ||
        Math.hypot(e.clientX - d.x, e.clientY - d.y) > DRAG_THRESHOLD;
      return { ...d, x: e.clientX, y: e.clientY, moved };
    });
  }
  function onTermPointerUp(e: React.PointerEvent, num: number) {
    const wasDrag = drag?.moved ?? false;
    setDrag(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!wasDrag) return; // pure tap → keep `selected` for tap-to-match
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const target = el?.closest<HTMLElement>("[data-desc-num]");
    if (target) attemptMatch(num, Number(target.dataset.descNum));
  }

  // ── Tap-to-select fallback: tap a term, then tap a description. ──
  function onDescriptionClick(descNum: number) {
    if (selected === null || matched.has(descNum)) return;
    attemptMatch(selected, descNum);
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span>
            {variantName} · Runde {roundIdx + 1} / {totalRounds}
          </span>
          <span>
            {matched.size}/{total} · Fehlaktionen: {misactions}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(matched.size / total) * 100}%`,
              backgroundColor: "var(--success)",
            }}
          />
        </div>
      </div>

      {/* Term pool */}
      <div className="flex flex-wrap gap-2">
        {terms.map((p) => {
          const isMatched = matched.has(p.num);
          const isSelected = selected === p.num;
          if (isMatched) return null;
          const { color } = categoryStyle(p.domain);
          return (
            <button
              key={p.num}
              type="button"
              onPointerDown={(e) => onTermPointerDown(e, p.num)}
              onPointerMove={onTermPointerMove}
              onPointerUp={(e) => onTermPointerUp(e, p.num)}
              style={{
                touchAction: "none",
                ...(isSelected
                  ? {}
                  : {
                      backgroundColor: tint(color, "14"),
                      color,
                      borderColor: tint(color, "33"),
                    }),
              }}
              className={`select-none rounded-xl border px-3 py-2 text-sm font-medium transition ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 ring-2 ring-emerald-500 dark:text-emerald-200"
                  : "hover:brightness-95"
              }`}
            >
              {p.term}
            </button>
          );
        })}
        {matched.size === total && (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Runde gelöst!
          </span>
        )}
      </div>

      {/* Description drop targets */}
      <div className="flex flex-col gap-2">
        {descriptions.map((p) => {
          const isMatched = matched.has(p.num);
          const isWrong = wrongFlash === p.num;
          return (
            <div
              key={p.num}
              data-desc-num={p.num}
              onClick={() => onDescriptionClick(p.num)}
              role="button"
              tabIndex={isMatched ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDescriptionClick(p.num);
                }
              }}
              className={`rounded-xl border px-4 py-3 text-sm transition ${
                isMatched
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : isWrong
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-200"
                    : selected !== null
                      ? "cursor-pointer border-line-strong bg-surface text-ink-soft hover:border-emerald-500"
                      : "border-line bg-surface text-ink-soft"
              }`}
            >
              <div className="flex items-start gap-2">
                {isMatched && (
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                )}
                <div>
                  {isMatched && (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {p.term}
                    </p>
                  )}
                  <p className="leading-snug">{p.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-ink-faint">
        Begriff ziehen — oder antippen, dann Beschreibung antippen.
      </p>

      {/* Drag ghost */}
      {drag?.moved && (
        <div
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-emerald-500 bg-surface px-3 py-2 text-sm font-medium text-emerald-700 shadow-lg dark:text-emerald-200"
          style={{ left: drag.x, top: drag.y }}
        >
          {terms.find((t) => t.num === drag.num)?.term}
        </div>
      )}
    </div>
  );
}

function ResultView({
  results,
  variantName,
  onAgain,
  onClose,
}: {
  results: RoundResult[];
  variantName: string;
  onAgain: () => void;
  onClose: () => void;
}) {
  const s = summarizePuzzle(results);
  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <Trophy className="h-7 w-7 text-amber-600 dark:text-amber-400" aria-hidden />
        </span>
        <div>
          <p className="text-3xl font-bold text-ink">
            {s.roundsPlayed} Runden gelöst
          </p>
          <p className="mt-1 text-sm text-ink-soft">{variantName}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { k: "Sofort richtig", v: s.immediate, c: "text-emerald-600 dark:text-emerald-400" },
          { k: "Mit Fehlern", v: s.withErrors, c: "text-amber-600 dark:text-amber-400" },
          { k: "Fehlaktionen", v: s.misactions, c: "text-rose-600 dark:text-rose-400" },
        ].map((cell) => (
          <div
            key={cell.k}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-center"
          >
            <p className={`text-lg font-bold ${cell.c}`}>{cell.v}</p>
            <p className="text-[11px] text-ink-soft">{cell.k}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm text-canvas transition hover:opacity-90"
        >
          <Shuffle className="h-4 w-4" aria-hidden />
          Neu mischen
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-line px-5 py-3 text-sm text-ink transition hover:border-line-strong"
        >
          <RotateCcw className="mr-2 inline h-4 w-4" aria-hidden />
          Schließen
        </button>
      </div>
    </div>
  );
}
