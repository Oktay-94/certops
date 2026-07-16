"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { BRAND_ORANGE } from "@/lib/brand";
import { setExamDate, setExamResult } from "@/app/exam-actions";
import type { Cert } from "@/lib/exam";
import { CertTile } from "./CertTile";
import { MiniCalendar } from "./MiniCalendar";
import { ReadinessRing } from "./ReadinessRing";

// Per-profile exam state machine (server decides the state, props carry it):
//   passed            → certificate + confetti (CertTile)
//   pending, running  → animated countdown (ring = elapsed window share)
//   pending, expired  → decision: Bestanden / Nicht bestanden
//   failed            → date picker → new countdown
export type ExamTileState =
  | { kind: "passed" }
  | { kind: "countdown"; daysLeft: number; progress: number; examDate: string }
  | { kind: "decision" }
  | { kind: "reschedule" }
  // no exam_status row for this cert yet (e.g. SAA before the first edit) —
  // the first save creates the row via the setExamDate upsert.
  | { kind: "unscheduled" };

function tomorrowIso(): string {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

export function ExamTile({ state, cert }: { state: ExamTileState; cert: Cert }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function decide(result: "passed" | "failed") {
    setError(null);
    startTransition(async () => {
      try {
        await setExamResult(result, cert);
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
        await setExamDate(date, cert);
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
            highlight={state.examDate}
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

  // reschedule (failed) and unscheduled (no row yet) share the date picker;
  // only the copy differs. Saving upserts the row and starts the countdown.
  return (
    <div>
      <p className="text-[13px] leading-relaxed text-ink-soft">
        {state.kind === "unscheduled"
          ? "Noch kein Prüfungstermin — Datum eintragen, dann startet der Countdown."
          : "Kopf hoch — neuer Anlauf. Wann ist der nächste Termin?"}
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
