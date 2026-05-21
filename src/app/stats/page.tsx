import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  getDomainStats,
  getNeverSeenQuestions,
  getQuestionStats,
  type QuestionStat,
} from "@/db/repository";
import { scoreColorClass } from "@/lib/scoreColor";

const SESSION_COOKIE = "certops_session_id";

const DOMAINS = [
  "Cloud Concepts",
  "Security and Compliance",
  "Cloud Technology and Services",
  "Billing, Pricing, and Support",
] as const;
type DomainName = (typeof DOMAINS)[number];

function isDomain(value: string | undefined): value is DomainName {
  return value !== undefined && (DOMAINS as readonly string[]).includes(value);
}

function truncate(s: string, max = 80): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain: rawDomain } = await searchParams;
  const activeDomain: DomainName | null = isDomain(rawDomain) ? rawDomain : null;

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? null;

  if (!sessionId) return <EmptyState />;

  const domainStats = getDomainStats(db, sessionId, "CLF-C02");
  const allStats = getQuestionStats(db, sessionId);
  if (allStats.length === 0) return <EmptyState />;

  const filtered = activeDomain
    ? allStats.filter((s) => s.domain === activeDomain)
    : allStats;
  const weakest = filtered.filter((s) => s.totalAttempts >= 2).slice(0, 10);
  const all = [...filtered].sort(
    (a, b) => b.lastAnsweredAt.getTime() - a.lastAnsweredAt.getTime(),
  );
  const neverSeen = getNeverSeenQuestions(db, sessionId, "CLF-C02", 20);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        Statistik
      </h1>
      <p className="mt-3 text-zinc-600">
        Trefferquote = Durchschnitt der letzten drei Versuche pro Frage.
      </p>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {domainStats.map((d) => (
          <div
            key={d.domain}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {d.domain}
            </h2>
            <p
              className={`mt-2 text-2xl font-semibold ${
                d.avgCorrectRate === null
                  ? "text-zinc-400"
                  : scoreColorClass(d.avgCorrectRate)
              }`}
            >
              {d.avgCorrectRate === null ? "—" : pct(d.avgCorrectRate)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {d.questionsPracticed} von{" "}
              {d.questionsPracticed + d.questionsUnseen} Fragen geübt
            </p>
          </div>
        ))}
      </section>

      <nav className="mt-8 flex flex-wrap gap-2">
        <TabLink active={activeDomain === null} href="/stats">
          Alle
        </TabLink>
        {DOMAINS.map((d) => (
          <TabLink
            key={d}
            active={activeDomain === d}
            href={`/stats?domain=${encodeURIComponent(d)}`}
          >
            {d}
          </TabLink>
        ))}
      </nav>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Schwächste 10 (mit ≥2 Versuchen)
        </h2>
        {weakest.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Noch keine Frage mit zwei oder mehr Versuchen
            {activeDomain ? " in dieser Domain." : "."}
          </p>
        ) : (
          <StatsTable rows={weakest} showDomain={activeDomain === null} />
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Alle geübten Fragen ({all.length})
        </h2>
        <StatsTable rows={all} showDomain={activeDomain === null} />
      </section>

      {neverSeen.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
            Noch nie gesehen (max 20)
          </h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2 pr-3 font-medium">Frage</th>
                <th className="py-2 pr-3 font-medium">Domain</th>
              </tr>
            </thead>
            <tbody>
              {neverSeen.map((q) => (
                <tr key={q.id} className="border-t border-zinc-100">
                  <td className="py-2 pr-3 text-zinc-900" title={q.prompt}>
                    {truncate(q.prompt)}
                  </td>
                  <td className="py-2 pr-3 text-zinc-600">{q.domain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Link
        href="/"
        className="mt-10 inline-block rounded-xl border border-zinc-300 px-6 py-3 text-center text-zinc-900 transition hover:bg-zinc-100"
      >
        Zurück zum Dashboard
      </Link>
    </main>
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

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  const base = "rounded-lg px-3 py-1.5 text-sm transition";
  const cls = active
    ? `${base} bg-zinc-900 text-white`
    : `${base} border border-zinc-200 text-zinc-700 hover:bg-zinc-50`;
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

function StatsTable({
  rows,
  showDomain,
}: {
  rows: QuestionStat[];
  showDomain: boolean;
}) {
  return (
    <table className="mt-3 w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
          <th className="py-2 pr-3 font-medium">Frage</th>
          {showDomain && <th className="py-2 pr-3 font-medium">Domain</th>}
          <th className="py-2 pr-3 font-medium tabular-nums">Quote</th>
          <th className="py-2 pr-3 font-medium tabular-nums">Versuche</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-zinc-100">
            <td className="py-2 pr-3 text-zinc-900" title={r.prompt}>
              {truncate(r.prompt)}
            </td>
            {showDomain && (
              <td className="py-2 pr-3 text-zinc-600">{r.domain}</td>
            )}
            <td
              className={`py-2 pr-3 tabular-nums font-medium ${scoreColorClass(r.avgCorrectLast3)}`}
            >
              {pct(r.avgCorrectLast3)}
            </td>
            <td className="py-2 pr-3 tabular-nums text-zinc-600">
              {r.totalAttempts}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
