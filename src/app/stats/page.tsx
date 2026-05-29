import Link from "next/link";
import { cookies } from "next/headers";
import {
  Cloud,
  DollarSign,
  Server,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/db";
import {
  countAnsweredQuestions,
  getDomainPerformance,
  getLastRoundReview,
  getOverallAvgLast3,
  getQuestionsByCert,
  getRoundTrend,
  getWeakestQuestions,
  type DomainPerformance,
  type RoundTrendPoint,
} from "@/db/repository";
import { getDomainColor, type FallbackIconName } from "@/lib/domain-colors";
import {
  LEARNING_TARGET,
  scoreColorClass,
  scoreColorHex,
} from "@/lib/scoreColor";
import { LastRoundBox } from "./LastRoundBox";
import { TrendCompactBars } from "./TrendCompactBars";
import { TrendLineChart } from "./TrendLineChart";
import { WeakestBox } from "./WeakestBox";

const SESSION_COOKIE = "certops_session_id";
const CERT = "CLF-C02" as const;

const DOMAINS = [
  "Cloud Concepts",
  "Security and Compliance",
  "Cloud Technology and Services",
  "Billing, Pricing, and Support",
] as const;

const DOMAIN_ICONS: Record<FallbackIconName, LucideIcon> = {
  Cloud,
  Shield,
  Server,
  DollarSign,
};

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export default async function StatsPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? null;

  if (!sessionId) return <EmptyState />;

  const [overall, allQuestions, answered, perf, weakest, trend, lastRound] =
    await Promise.all([
      getOverallAvgLast3(db, sessionId, CERT),
      getQuestionsByCert(db, CERT),
      countAnsweredQuestions(db, sessionId, CERT),
      getDomainPerformance(db, sessionId, CERT),
      getWeakestQuestions(db, sessionId, CERT, 10),
      getRoundTrend(db, sessionId, CERT, 10),
      getLastRoundReview(db, sessionId, CERT),
    ]);
  const totalQuestions = allQuestions.length;

  if (answered === 0) return <EmptyState />;

  const perfByDomain = new Map(perf.map((p) => [p.domain, p]));

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        Statistik
      </h1>
      <p className="mt-3 text-zinc-600">
        Dein Lernstand auf einen Blick — Trend der letzten Runden, Stärken
        und Schwächen pro Bereich.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
        <StatCardAvg overall={overall} trend={trend} />
        <StatCard label="Fragen gesamt" value={String(totalQuestions)} />
        <StatCard label="Beantwortet" value={String(answered)} />
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
            Nach Bereich
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="inline-block h-3 w-4 border-l border-dashed border-zinc-600" />
            Lernziel {Math.round(LEARNING_TARGET * 100)}%
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {DOMAINS.map((domain) => (
            <DomainBar
              key={domain}
              domain={domain}
              data={perfByDomain.get(domain)}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Fragen der letzten Runde
        </h2>
        <div className="mt-4">
          <LastRoundBox review={lastRound} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Schwächste Fragen
        </h2>
        <div className="mt-4">
          <WeakestBox items={weakest} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Verlauf
        </h2>
        <div className="mt-4 space-y-4">
          <TrendLineChart trend={trend} />
          <TrendCompactBars
            lastRoundRate={
              lastRound.correctCount + lastRound.incorrectCount > 0
                ? lastRound.correctCount /
                  (lastRound.correctCount + lastRound.incorrectCount)
                : null
            }
            overallRate={overall}
          />
        </div>
      </section>

      <Link
        href="/"
        className="mt-10 inline-block rounded-xl border border-zinc-300 px-6 py-3 text-center text-zinc-900 transition hover:bg-zinc-100"
      >
        Zurück zum Dashboard
      </Link>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </h3>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
        {value}
      </p>
    </div>
  );
}

function StatCardAvg({
  overall,
  trend,
}: {
  overall: number | null;
  trend: RoundTrendPoint[];
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Ø Trefferquote
      </h3>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p
          className={`text-3xl font-semibold tabular-nums ${
            overall === null ? "text-zinc-400" : scoreColorClass(overall)
          }`}
        >
          {overall === null ? "—" : pct(overall)}
        </p>
        <Sparkline trend={trend} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">letzte 10 Runden</p>
    </div>
  );
}

function Sparkline({ trend }: { trend: RoundTrendPoint[] }) {
  if (trend.length < 2) {
    return (
      <span className="max-w-[140px] text-right text-xs text-zinc-500">
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
        stroke="#a1a1aa"
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <polyline
        points={polyline}
        fill="none"
        stroke="#10b981"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
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
}: {
  domain: string;
  data: DomainPerformance | undefined;
}) {
  const color = getDomainColor(domain);
  const Icon = DOMAIN_ICONS[color.fallbackIconName];
  const rate = data?.rate ?? null;
  const questionsCount = data?.questionsCount ?? 0;
  const fillWidth = rate === null ? 0 : Math.round(rate * 100);

  return (
    <div className={`rounded-lg ${color.bgSoft} p-4`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md ${color.iconBg}`}
        >
          <Icon className="h-4 w-4 text-white" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${color.textStrong}`}>{domain}</p>
          <p className={`text-xs ${color.textMuted}`}>
            {rate === null
              ? "noch keine Daten"
              : `${questionsCount} Fragen`}
          </p>
        </div>
        <p
          className={`text-xl font-bold tabular-nums ${
            rate === null ? "text-zinc-400" : scoreColorClass(rate)
          }`}
        >
          {rate === null ? "—" : pct(rate)}
        </p>
      </div>

      <div
        className={`relative mt-3 h-3 rounded-full ${color.barTrack} overflow-hidden`}
      >
        {rate !== null && (
          <span
            className={`absolute inset-y-0 left-0 ${color.barFill} rounded-full`}
            style={{ width: `${fillWidth}%` }}
          />
        )}
        <span
          className="absolute top-0 bottom-0 border-l border-dashed border-zinc-600"
          style={{ left: `${LEARNING_TARGET * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        Statistik
      </h1>
      <p className="mt-3 text-zinc-600">
        Du hast noch keine Fragen beantwortet.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/quiz"
          className="inline-block rounded-xl bg-zinc-900 px-6 py-3 text-center text-white transition hover:bg-zinc-800"
        >
          Quiz starten
        </Link>
        <Link
          href="/"
          className="inline-block rounded-xl border border-zinc-300 px-6 py-3 text-center text-zinc-900 transition hover:bg-zinc-100"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </main>
  );
}
