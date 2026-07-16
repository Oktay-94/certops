import Link from "next/link";
import {
  ArrowLeft,
  Cloud,
  DollarSign,
  Server,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/db";
import {
  countAnsweredQuestions,
  getAttemptTimestamps,
  getDomainPerformance,
  getLastRoundReview,
  getOverallAvgLast3,
  getPersistentWeakest,
  getQuestionsByCert,
  getRoundTrend,
  getWeakestQuestions,
  type DomainPerformance,
  type RoundTrendPoint,
} from "@/db/repository";
import { bucketByDay } from "@/lib/activity";
import { getDomainColor, type FallbackIconName } from "@/lib/domain-colors";
import {
  LEARNING_TARGET,
  scoreColorClass,
  scoreColorHex,
} from "@/lib/scoreColor";
import { getActiveProfileId } from "@/lib/profile-cookie";
import { EXAM_CERT, type ExamSlug } from "@/lib/exam";
import { DOMAINS_BY_CERT } from "@/lib/domains";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { AreaTiles } from "@/components/dashboard/AreaTiles";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { Tile } from "@/components/dashboard/Tile";
import { LastRoundBox } from "./LastRoundBox";
import { PersistentWeaknesses } from "./PersistentWeaknesses";
import { TrendCompactBars } from "./TrendCompactBars";
import { TrendLineChart } from "./TrendLineChart";
import { WeakestBox } from "./WeakestBox";

const DOMAIN_ICONS: Record<FallbackIconName, LucideIcon> = {
  Cloud,
  Shield,
  Server,
  DollarSign,
};

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ exam: ExamSlug }>;
}) {
  const { exam } = await params;
  const cert = EXAM_CERT[exam];
  const domains = DOMAINS_BY_CERT[cert];
  const userId = await getActiveProfileId();

  if (!userId) return <EmptyState exam={exam} />;

  const now = new Date();
  const [
    overall,
    allQuestions,
    answered,
    perf,
    weakest,
    trend,
    lastRound,
    persistent,
    timestamps,
  ] = await Promise.all([
    getOverallAvgLast3(db, userId, cert),
    getQuestionsByCert(db, cert),
    countAnsweredQuestions(db, userId, cert),
    getDomainPerformance(db, userId, cert),
    getWeakestQuestions(db, userId, cert, 10),
    getRoundTrend(db, userId, cert, 10),
    getLastRoundReview(db, userId, cert),
    getPersistentWeakest(db, userId, cert, 4),
    getAttemptTimestamps(db, userId, cert),
  ]);
  const totalQuestions = allQuestions.length;

  if (answered === 0) return <EmptyState exam={exam} />;

  const perfByDomain = new Map(perf.map((p) => [p.domain, p]));
  const buckets = bucketByDay(timestamps);
  const lastRoundRate =
    lastRound.correctCount + lastRound.incorrectCount > 0
      ? lastRound.correctCount /
        (lastRound.correctCount + lastRound.incorrectCount)
      : null;
  const answeredPct = Math.round((answered / totalQuestions) * 100);

  return (
    <main className="relative mx-auto w-full max-w-[1120px] px-6 pb-20 pt-10">
      <ScrollBackground />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            <span className="h-px w-8 bg-line-strong" aria-hidden />
            Statistik
          </div>
          <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
            Dein Lernstand.
          </h1>
          <p className="mt-2.5 max-w-[56ch] text-[14.5px] leading-relaxed text-ink-soft">
            Trend der letzten Runden, Stärken und Schwächen pro Bereich.
          </p>
        </div>
        <Link
          href={`/${exam}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </div>

      {/* Bento */}
      <div className="mt-8 grid grid-cols-1 gap-3.5 md:grid-cols-12">
        <Tile
          label="Ø Trefferquote"
          glyph="🎯"
          value="Letzte 10 Runden"
          className="md:col-span-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div
              className={`text-[34px] font-bold leading-none tracking-[-0.03em] tabular-nums ${
                overall === null ? "text-ink-faint" : scoreColorClass(overall)
              }`}
            >
              {overall === null ? "—" : pct(overall)}
            </div>
            <Sparkline trend={trend} />
          </div>
        </Tile>

        <Tile label="Fragen gesamt" glyph="📚" className="md:col-span-4">
          <div className="text-[34px] font-bold leading-none tracking-[-0.03em] tabular-nums text-ink">
            {totalQuestions}
          </div>
          <p className="mt-2 text-[12.5px] text-ink-soft">
            Im {cert}-Pool · 4 Domains.
          </p>
        </Tile>

        <Tile label="Beantwortet" glyph="✅" className="md:col-span-4">
          <div className="text-[34px] font-bold leading-none tracking-[-0.03em] tabular-nums text-ink">
            {answered}
            <small className="text-[15px] font-medium text-ink-faint">
              {" "}
              / {totalQuestions}
            </small>
          </div>
          <p className="mt-2 text-[12.5px] text-ink-soft">
            {answeredPct} % des Pools mindestens einmal gesehen.
          </p>
        </Tile>

        <Tile
          label="Nach Bereich"
          glyph="🧭"
          value={`┊ Lernziel ${Math.round(LEARNING_TARGET * 100)}%`}
          className="md:col-span-5"
        >
          <div>
            {domains.map((domain, i) => (
              <DomainBar
                key={domain}
                domain={domain}
                data={perfByDomain.get(domain)}
                first={i === 0}
              />
            ))}
          </div>
        </Tile>

        <Tile
          label="Schwächste Fragen"
          glyph="⚠️"
          value="Klick = Details"
          className="md:col-span-7"
        >
          <WeakestBox items={weakest} />
        </Tile>

        <Tile
          label="Verlauf"
          glyph="📈"
          value="R1–Rn · Rn = aktuellste"
          className="md:col-span-7"
        >
          <TrendLineChart trend={trend} />
        </Tile>

        <Tile
          label="Runden-Bilanz"
          glyph="🎲"
          value={`┊ Lernziel ${Math.round(LEARNING_TARGET * 100)}%`}
          className="md:col-span-5"
        >
          <TrendCompactBars lastRoundRate={lastRoundRate} overallRate={overall} />
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Fragen der letzten Runde
          </div>
          <div className="mt-2">
            <LastRoundBox review={lastRound} />
          </div>
        </Tile>

        <Tile
          label="Hartnäckigste Schwachstellen"
          glyph="🔁"
          value="Falsch-Quote"
          className="md:col-span-5"
        >
          <PersistentWeaknesses items={persistent} />
        </Tile>

        <Tile
          label="Lern-Aktivität"
          glyph="🔥"
          value="Letzte 26 Wochen"
          className="md:col-span-7"
        >
          <div className="flex items-start gap-5">
            <div className="min-w-0 flex-1">
              <ActivityHeatmap buckets={buckets} today={now} />
            </div>
            {/* Fills the empty right side; today marked, no exam highlight. */}
            <MiniCalendar className="hidden shrink-0 sm:block" />
          </div>
        </Tile>
      </div>

      {/* Bereiche — identical to the dashboard */}
      <div className="mb-4 mt-11 flex items-baseline gap-3">
        <h2 className="text-[17px] font-bold text-ink">Bereiche</h2>
        <span className="font-mono text-[10px] tracking-[0.1em] text-ink-faint">
          {exam === "saa"
            ? "QUIZ · KARTEN · STATISTIK · SZENARIEN"
            : "QUIZ · KARTEN · DIENSTE · STATISTIK · SKRIPT · ÜBERSICHT"}
        </span>
      </div>
      <AreaTiles exam={exam} />
    </main>
  );
}

function Sparkline({ trend }: { trend: RoundTrendPoint[] }) {
  if (trend.length < 2) {
    return (
      <span className="max-w-[140px] text-right text-xs text-ink-faint">
        noch nicht genug Runden — ein paar Quiz-Runden spielen
      </span>
    );
  }

  const W = 120;
  const H = 40;
  const targetY = H - LEARNING_TARGET * H;
  const points = trend.map((p, i) => {
    const x = (i / (trend.length - 1)) * W;
    const y = H - p.rate * H;
    return { x, y, rate: p.rate };
  });
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="shrink-0"
      aria-label="Trend letzte 10 Runden"
    >
      <line
        x1={0}
        x2={W}
        y1={targetY}
        y2={targetY}
        strokeWidth={1}
        strokeDasharray="2 2"
        style={{ stroke: "var(--border-strong)" }}
      />
      <polyline
        points={polyline}
        fill="none"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ stroke: "var(--success)" }}
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 2.5 : 1.5}
          fill={scoreColorHex(p.rate)}
        />
      ))}
    </svg>
  );
}

function DomainBar({
  domain,
  data,
  first,
}: {
  domain: string;
  data: DomainPerformance | undefined;
  first: boolean;
}) {
  const color = getDomainColor(domain);
  const Icon = DOMAIN_ICONS[color.fallbackIconName];
  const rate = data?.rate ?? null;
  const questionsCount = data?.questionsCount ?? 0;
  const fillWidth = rate === null ? 0 : Math.round(rate * 100);

  return (
    <div
      className={`grid grid-cols-[32px_1fr_46px] items-center gap-3 py-2.5 ${
        first ? "" : "border-t border-line"
      }`}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-[9px]"
        style={{ background: color.solid }}
      >
        <Icon className="h-4 w-4 text-white" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold leading-tight text-ink">
          {domain}
        </p>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.05em] text-ink-faint">
          {rate === null ? "noch keine Daten" : `${questionsCount} Fragen`}
        </p>
        <div className="relative mt-[7px] h-[5px] rounded-[3px] bg-surface-2">
          {rate !== null && (
            <span
              className="absolute inset-y-0 left-0 rounded-[3px]"
              style={{ width: `${fillWidth}%`, background: color.solid }}
            />
          )}
          <span
            className="absolute -top-[3px] -bottom-[3px] w-[1.5px] opacity-70"
            style={{
              left: `${LEARNING_TARGET * 100}%`,
              background: "var(--ink-faint)",
            }}
            aria-hidden
          />
        </div>
      </div>
      <div
        className={`text-right font-mono text-[13px] font-semibold tabular-nums ${
          rate === null ? "text-ink-faint" : scoreColorClass(rate)
        }`}
      >
        {rate === null ? "—" : pct(rate)}
      </div>
    </div>
  );
}

function EmptyState({ exam }: { exam: ExamSlug }) {
  return (
    <main className="relative mx-auto w-full max-w-[1120px] px-6 pb-20 pt-10">
      <ScrollBackground />
      <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        <span className="h-px w-8 bg-line-strong" aria-hidden />
        Statistik
      </div>
      <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
        Noch keine Daten.
      </h1>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
        Du hast noch keine Fragen beantwortet.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/${exam}/quiz`}
          className="inline-block rounded-lg px-5 py-2.5 text-center text-[13px] font-semibold text-white transition-transform hover:-translate-y-px"
          style={{ background: "var(--ink)", color: "var(--canvas)" }}
        >
          Quiz starten
        </Link>
        <Link
          href={`/${exam}`}
          className="inline-block rounded-lg border border-line-strong px-5 py-2.5 text-center text-[13px] font-semibold text-ink transition-transform hover:-translate-y-px"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </main>
  );
}
