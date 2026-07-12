"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BRAND_ORANGE } from "@/lib/brand";
import { setExamDate, setExamResult } from "@/app/exam-actions";
import { CertTile } from "./CertTile";
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
  | { kind: "reschedule" };

function tomorrowIso(): string {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

export function ExamTile({ state }: { state: ExamTileState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState("");
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
        router.refresh();
      } catch {
        setError("Datum ungültig — muss in der Zukunft liegen.");
      }
    });
  }

  if (state.kind === "passed") return <CertTile />;

  if (state.kind === "countdown") {
    return (
      <div className="flex items-center gap-4">
        <ReadinessRing value={state.progress} size={96} accent={BRAND_ORANGE} />
        <div>
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
