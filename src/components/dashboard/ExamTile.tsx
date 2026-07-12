"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { BRAND_ORANGE } from "@/lib/brand";
import { dayKey } from "@/lib/activity";
import { monthGrid } from "@/lib/month-grid";
import { setExamDate, setExamResult } from "@/app/exam-actions";
import { CertTile } from "./CertTile";
import { ReadinessRing } from "./ReadinessRing";

// Compact current-month calendar: today outlined, exam day filled orange.
// Deliberately tiny (7×~14px cells) so the tile keeps its size.
function MiniCalendar({
  examDate,
  className = "",
}: {
  examDate: string;
  className?: string;
}) {
  const today = dayKey(new Date());
  const grid = monthGrid(today);

  return (
    <div className={className} aria-hidden>
      <div className="mb-1 text-center font-mono text-[8px] uppercase tracking-[0.1em] text-ink-faint">
        {grid.label}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {["M", "D", "M", "D", "F", "S", "S"].map((d, i) => (
          <span
            key={`h${i}`}
            className="text-center font-mono text-[7px] text-ink-faint"
          >
            {d}
          </span>
        ))}
        {grid.weeks.flat().map((day, i) => {
          if (!day) return <span key={`e${i}`} className="h-3.5 w-3.5" />;
          const isToday = day === today;
          const isExam = day === examDate;
          return (
            <span
              key={day}
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] font-mono text-[7.5px] ${
                isExam
                  ? "font-bold"
                  : isToday
                    ? "text-ink"
                    : "text-ink-faint"
              }`}
              style={
                isExam
                  ? { background: BRAND_ORANGE, color: "var(--cta-ink)" }
                  : isToday
                    ? { boxShadow: "inset 0 0 0 1px var(--border-strong)" }
                    : undefined
              }
            >
              {Number(day.slice(8))}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Per-profile exam state machine (server decides the state, props carry it):
//   passed            → certificate + confetti (CertTile)
//   pending, running  → animated countdown (ring = elapsed window share)
//   pending, expired  → decision: Bestanden / Nicht bestanden
//   failed            → date picker → new countdown
export type ExamTileState =
  | { kind: "passed" }
  | { kind: "countdown"; daysLeft: number; progress: number; examDate: string }
  | { kind: "decision" }
  | { kind: "reschedule" };

function tomorrowIso(): string {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

export function ExamTile({ state }: { state: ExamTileState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function decide(result: "passed" | "failed") {
    setError(null);
    startTransition(async () => {
      try {
        await setExamResult(result);
        router.refresh();
      } catch {
        setError("Speichern fehlgeschlagen — nochmal versuchen.");
      }
    });
  }

  function reschedule() {
    setError(null);
    startTransition(async () => {
      try {
        await setExamDate(date);
        setEditing(false);
        setDate("");
        router.refresh();
      } catch {
        setError("Datum ungültig — muss in der Zukunft liegen.");
      }
    });
  }

  // Edit pencil (tile top-right — tile root is relative) + inline date editor,
  // shared by the countdown and the passed/certificate state. On the cert tile
  // this doubles as "reset & set a new date" (setExamDate → result pending),
  // which is how Oktay will start his SAA countdown later.
  const pencil = (label: string) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        setError(null);
        setEditing((e) => !e);
      }}
      className="absolute right-3.5 top-3.5 rounded-md p-1 text-ink-faint transition-colors hover:text-ink"
    >
      <Pencil size={14} aria-hidden />
    </button>
  );

  const editorPanel = editing && (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <input
        type="date"
        value={date}
        min={tomorrowIso()}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Neues Prüfungsdatum"
        className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-ink outline-none focus:border-line-strong"
      />
      <button
        type="button"
        disabled={pending || !date}
        onClick={reschedule}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-transform hover:-translate-y-px disabled:opacity-50"
        style={{ background: BRAND_ORANGE, color: "var(--cta-ink)" }}
      >
        Speichern
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );

  if (state.kind === "passed") {
    return (
      <div>
        {pencil("Neue Prüfung planen")}
        <CertTile />
        {editorPanel}
      </div>
    );
  }

  if (state.kind === "countdown") {
    return (
      <div>
        {pencil("Prüfungsdatum bearbeiten")}

        {/* Countdown number + ring: UNCHANGED */}
        <div className="flex items-center gap-4">
          <ReadinessRing value={state.progress} size={96} accent={BRAND_ORANGE} />
          <div className="min-w-0">
            <div className="text-[32px] font-bold leading-none tracking-[-0.03em] text-ink">
              {state.daysLeft}
              <small className="text-sm font-medium text-ink-faint"> Tage</small>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-ink-soft">
              bis zur Prüfung
            </p>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
              {state.examDate}
            </div>
          </div>
          <MiniCalendar
            examDate={state.examDate}
            className="ml-auto hidden shrink-0 sm:block"
          />
        </div>

        {editorPanel}
      </div>
    );
  }

  if (state.kind === "decision") {
    return (
      <div>
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Der Prüfungstermin ist vorbei — wie ist es gelaufen?
        </p>
        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => decide("passed")}
            className="rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-px disabled:opacity-50"
            style={{ background: "var(--success)" }}
          >
            Bestanden 🎉
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => decide("failed")}
            className="rounded-lg border border-line-strong px-4 py-2.5 text-[13px] font-semibold text-ink transition-transform hover:-translate-y-px disabled:opacity-50"
          >
            Nicht bestanden
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // reschedule (failed): pick a new date, countdown restarts
  return (
    <div>
      <p className="text-[13px] leading-relaxed text-ink-soft">
        Kopf hoch — neuer Anlauf. Wann ist der nächste Termin?
      </p>
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          min={tomorrowIso()}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Neues Prüfungsdatum"
          className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none focus:border-line-strong"
        />
        <button
          type="button"
          disabled={pending || !date}
          onClick={reschedule}
          className="rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-px disabled:opacity-50"
          style={{ background: BRAND_ORANGE, color: "var(--cta-ink)" }}
        >
          Countdown starten
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
