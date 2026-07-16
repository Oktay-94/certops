import { db } from "@/db";
import {
  countSeenFlashcards,
  getAttemptTimestamps,
  getDomainStats,
  getExamStatus,
  getFlashcards,
  getOverallAvgLast3,
} from "@/db/repository";
import { bucketByDay } from "@/lib/activity";
import { BRAND_ORANGE } from "@/lib/brand";
import { daysUntil } from "@/lib/config";
import {
  countdownProgress,
  isExpired,
  resolveExamStatus,
} from "@/lib/exam-status";
import { getActiveProfileId } from "@/lib/profile-cookie";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { ProfileDisplaySync } from "@/components/profile/ProfileDisplaySync";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { AreaTiles } from "@/components/dashboard/AreaTiles";
import { EXAM_CERT, type ExamSlug } from "@/lib/exam";
import { ExamTile, type ExamTileState } from "@/components/dashboard/ExamTile";
import { DomainMasteryTile } from "@/components/dashboard/DomainMasteryTile";
import { ReadinessRing } from "@/components/dashboard/ReadinessRing";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { StaggerReveal } from "@/components/dashboard/StaggerReveal";
import { CardsSeenTile } from "@/components/dashboard/CardsSeenTile";
import { Tile } from "@/components/dashboard/Tile";

export default async function Home({
  params,
}: {
  params: Promise<{ exam: ExamSlug }>;
}) {
  const { exam } = await params;
  const cert = EXAM_CERT[exam];
  const userId = await getActiveProfileId();
  const now = new Date();

  const cardsTotal = (await getFlashcards(db, cert)).length;
  const [avgLast3, domainStats, timestamps, cardsSeen, examRow] = userId
    ? await Promise.all([
        getOverallAvgLast3(db, userId, cert),
        getDomainStats(db, userId, cert),
        getAttemptTimestamps(db, userId, cert),
        countSeenFlashcards(db, cert, userId),
        getExamStatus(db, userId, cert),
      ])
    : [null, [], [], 0, null];

  const buckets = bucketByDay(timestamps);
  const readiness = avgLast3 === null ? null : Math.round(avgLast3 * 100);

  // Per-profile exam state machine (replaces the global CLF_RESULT const).
  // The app-side fallback in resolveExamStatus encodes CLF history — SAA has
  // no default: without a row the tile shows the "Datum eintragen" empty
  // state, and the first save creates the row (setExamDate upsert).
  const unscheduled = cert === "SAA-C03" && examRow === null;
  const status = resolveExamStatus(examRow, userId ?? "");
  const passed = !unscheduled && status.result === "passed";
  const daysLeft = daysUntil(status.examDate, now);
  const examTileState: ExamTileState = unscheduled
    ? { kind: "unscheduled" }
    : passed
      ? { kind: "passed" }
      : status.result === "failed"
        ? { kind: "reschedule" }
        : isExpired(status.examDate, now)
          ? { kind: "decision" }
          : {
              kind: "countdown",
              daysLeft,
              progress: countdownProgress(status.setAt, status.examDate, now),
              examDate: status.examDate.toISOString().slice(0, 10),
            };

  return (
    <main className="relative mx-auto w-full max-w-[1120px] px-6 pb-20 pt-10">
      <ScrollBackground />

      {/* Logo/profile row removed (approved 2026-07-16): the sticky
          ExamHeader owns wordmark + profile pill now — no more wordmark
          doubling, the light-mode profile logo PNG is retired with it.
          Only the first-visit chooser stays page-level. */}
      {userId ? (
        <ProfileDisplaySync profileId={userId} />
      ) : (
        <div className="mt-2">
          <ProfileSwitcher activeProfileId={null} />
        </div>
      )}

      {/* Hero */}
      <div className="mt-9">
        <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          <span className="h-px w-8 bg-line-strong" aria-hidden />
          AWS-Zertifikats-Vorbereitung
          <span
            className="rounded-full border px-[9px] py-[2px] tracking-[0.12em]"
            style={
              passed
                ? {
                    color: "var(--success)",
                    borderColor:
                      "color-mix(in srgb, var(--success) 40%, transparent)",
                  }
                : {
                    color: BRAND_ORANGE,
                    borderColor: `color-mix(in srgb, ${BRAND_ORANGE} 35%, transparent)`,
                  }
            }
          >
            {passed ? "BESTANDEN" : cert}
          </span>
        </div>
        <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
          {passed
            ? "Geschafft. Und weiter geht's."
            : "Ein Fundament, das trägt."}
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-[14.5px] leading-relaxed text-ink-soft">
          {passed
            ? `${cert} ist im Archiv-Modus — alles bleibt übbar, nichts geht verloren.`
            : unscheduled
              ? "Noch kein Prüfungstermin — trag ein Datum ein, dann startet der Countdown."
              : `Noch ${daysLeft} Tage bis zur Prüfung. Readiness, Schwächen und Streak auf einen Blick.`}
        </p>
      </div>

      {/* Bento (spans: 5/3/4 · 7/5; below md everything stacks) */}
      <div className="mt-8 grid grid-cols-1 gap-3.5 md:grid-cols-12">
        <StaggerReveal index={0} className="md:col-span-5">
          <Tile
            label={passed ? "Ø Trefferquote" : "Readiness"}
            glyph="🏅"
            value="ZIEL ≥ 70"
            className="h-full"
          >
            <div className="flex items-center gap-5">
              <ReadinessRing
                value={readiness ?? 0}
                accent={passed ? "var(--success)" : "var(--accent)"}
              />
              <div>
                <div className="text-[38px] font-bold leading-none tracking-[-0.03em] text-ink">
                  {readiness ?? "—"}
                  <small className="text-[15px] font-medium text-ink-faint">
                    {" "}
                    / 100
                  </small>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-snug text-ink-soft">
                  {readiness === null
                    ? "Beantworte Fragen mehrfach, um Readiness zu messen."
                    : "Ø der letzten 3 Antworten pro Frage, alle Domains."}
                </p>
              </div>
            </div>
          </Tile>
        </StaggerReveal>
        <StaggerReveal index={1} className="md:col-span-3">
          <Tile label="Karten gesehen" glyph="🃏" className="h-full">
            <CardsSeenTile seen={cardsSeen} total={cardsTotal} />
          </Tile>
        </StaggerReveal>
        <StaggerReveal index={2} className="md:col-span-4">
          <Tile
            label={
              examTileState.kind === "passed"
                ? "Zertifikat"
                : examTileState.kind === "countdown"
                  ? "Countdown"
                  : "Prüfung"
            }
            glyph={examTileState.kind === "passed" ? "🎓" : "⏳"}
            className="h-full"
          >
            <ExamTile state={examTileState} cert={cert} />
          </Tile>
        </StaggerReveal>
        <StaggerReveal index={3} className="md:col-span-7">
          <Tile
            label="Domain-Mastery"
            glyph="🧭"
            value="Gewichtung lt. Exam Guide"
            className="h-full"
          >
            <DomainMasteryTile cert={cert} stats={domainStats} />
          </Tile>
        </StaggerReveal>
        <StaggerReveal index={4} className="md:col-span-5">
          <Tile label="Lern-Aktivität" glyph="🔥" value="Letzte 26 Wochen" className="h-full">
            <ActivityHeatmap buckets={buckets} today={now} />
          </Tile>
        </StaggerReveal>
      </div>

      {/* Bereiche */}
      <div className="mb-4 mt-11 flex items-baseline gap-3">
        <h2 className="text-[17px] font-bold text-ink">Bereiche</h2>
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-faint">
          {exam === "saa"
            ? "QUIZ · KARTEN · SKRIPT · STATISTIK · SZENARIEN"
            : "QUIZ · KARTEN · DIENSTE · STATISTIK · SKRIPT · ÜBERSICHT"}
        </span>
      </div>
      <AreaTiles exam={exam} />
    </main>
  );
}
