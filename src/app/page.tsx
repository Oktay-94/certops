import Image from "next/image";
import { db } from "@/db";
import {
  getAttemptTimestamps,
  getDomainStats,
  getOverallAvgLast3,
} from "@/db/repository";
import { bucketByDay, computeStreak } from "@/lib/activity";
import { BRAND_ORANGE } from "@/lib/brand";
import { CLF_RESULT, EXAM_DATE, daysUntil } from "@/lib/config";
import { getActiveProfileId } from "@/lib/profile-cookie";
import { getProfileBranding } from "@/lib/profile-branding";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { AreaTiles } from "@/components/dashboard/AreaTiles";
import { CertTile } from "@/components/dashboard/CertTile";
import { DomainMasteryTile } from "@/components/dashboard/DomainMasteryTile";
import { NextUpTile } from "@/components/dashboard/NextUpTile";
import { ReadinessRing } from "@/components/dashboard/ReadinessRing";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { StaggerReveal } from "@/components/dashboard/StaggerReveal";
import { StreakTile } from "@/components/dashboard/StreakTile";
import { Tile } from "@/components/dashboard/Tile";

export default async function Home() {
  const userId = await getActiveProfileId();
  const branding = getProfileBranding(userId);
  const now = new Date();

  const [avgLast3, domainStats, timestamps] = userId
    ? await Promise.all([
        getOverallAvgLast3(db, userId, "CLF-C02"),
        getDomainStats(db, userId, "CLF-C02"),
        getAttemptTimestamps(db, userId, "CLF-C02"),
      ])
    : [null, [], []];

  const buckets = bucketByDay(timestamps);
  const activeDays = new Set(buckets.keys());
  const streak = computeStreak(activeDays, now);
  const readiness = avgLast3 === null ? null : Math.round(avgLast3 * 100);
  const passed = CLF_RESULT === "passed";
  const daysLeft = daysUntil(EXAM_DATE, now);

  return (
    <main className="relative mx-auto w-full max-w-[1120px] px-6 pb-20 pt-10">
      <ScrollBackground />

      {/* Header: logo/profile row (unchanged behaviour) */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {branding ? (
            <>
              {/* Light: profile logo PNG. Dark: mockup wordmark (the PNGs are
                  light-baked; the mockups use a text wordmark anyway). */}
              <Image
                src={branding.logoSrc}
                alt="CertOps"
                width={1200}
                height={428}
                priority
                className="h-auto w-full max-w-[200px] dark:hidden sm:max-w-[260px]"
              />
              <div className="hidden items-center gap-2 text-base font-bold tracking-[-0.02em] text-ink dark:flex">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "var(--orange-bright)" }}
                  aria-hidden
                />
                CertOps
                <span className="ml-1 font-mono text-[9.5px] font-normal uppercase tracking-[0.14em] text-ink-faint">
                  {branding.profileName}
                </span>
              </div>
            </>
          ) : (
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              CertOps
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {userId && <ProfileSwitcher activeProfileId={userId} />}
        </div>
      </div>

      {!userId && (
        <div className="mt-8">
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
            {passed ? "BESTANDEN" : "CLF-C02"}
          </span>
        </div>
        <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
          {passed
            ? "Geschafft. Und weiter geht's."
            : "Ein Fundament, das trägt."}
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-[14.5px] leading-relaxed text-ink-soft">
          {passed
            ? "CLF-C02 ist im Archiv-Modus — alles bleibt übbar, nichts geht verloren."
            : `Noch ${daysLeft} Tage bis zur Prüfung. Readiness, Schwächen und Streak auf einen Blick.`}
        </p>
      </div>

      {/* Bento (mockup spans: 5/3/4 · 5/7 · 12; below md everything stacks) */}
      <div className="mt-8 grid grid-cols-1 gap-3.5 md:grid-cols-12">
        <StaggerReveal index={0} className="md:col-span-5">
          <Tile
            label={passed ? "Ø Trefferquote" : "Readiness"}
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
          <Tile label="Streak" className="h-full">
            <StreakTile streak={streak} activeDays={activeDays} today={now} />
          </Tile>
        </StaggerReveal>
        <StaggerReveal index={2} className="md:col-span-4">
          {passed ? (
            <Tile label="Zertifikat" className="h-full">
              <CertTile />
            </Tile>
          ) : (
            <Tile label="Next up" value="Schwächste Domain" className="h-full">
              <NextUpTile stats={domainStats} />
            </Tile>
          )}
        </StaggerReveal>
        <StaggerReveal index={3} className="md:col-span-5">
          <Tile
            label="Domain-Mastery"
            value="Gewichtung lt. Exam Guide"
            className="h-full"
          >
            <DomainMasteryTile stats={domainStats} />
          </Tile>
        </StaggerReveal>
        <StaggerReveal index={4} className="md:col-span-7">
          <Tile label="Lern-Aktivität" value="Letzte 26 Wochen" className="h-full">
            <ActivityHeatmap buckets={buckets} today={now} />
          </Tile>
        </StaggerReveal>
      </div>

      {/* Bereiche */}
      <div className="mb-4 mt-11 flex items-baseline gap-3">
        <h2 className="text-[17px] font-bold text-ink">Bereiche</h2>
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-faint">
          QUIZ · KARTEN · DIENSTE · STATISTIK · SKRIPT · ÜBERSICHT
        </span>
      </div>
      <AreaTiles />
    </main>
  );
}
