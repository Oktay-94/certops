import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/db";
import {
  getAttemptStats,
  getLastNAttempts,
  getQuestionsByCert,
} from "@/db/repository";
import { scoreColorClass } from "@/lib/scoreColor";

const SESSION_COOKIE = "certops_session_id";

function pct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

function domainToneClass(correct: number, total: number): string {
  if (total === 0) return "text-zinc-500";
  return scoreColorClass(correct / total);
}

export default async function QuizDonePage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? null;

  const pool = await getQuestionsByCert(db, "CLF-C02");
  const poolSize = pool.length;

  // Aktuelle Heuristik für "diese Runde" = letzte N Attempts.
  // Falls sich das als problematisch erweist (Pause mittendrin, etc.),
  // aufrüsten auf round_number-Spalte in question_attempts.
  const roundAttempts = sessionId
    ? await getLastNAttempts(db, sessionId, poolSize)
    : [];
  const stats = sessionId
    ? await getAttemptStats(db, sessionId)
    : { total: 0, correct: 0, byDomain: [] };

  const roundCorrect = roundAttempts.filter((a) => a.correct).length;
  const roundTotal = roundAttempts.length;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        Übungsrunde abgeschlossen
      </h1>

      {roundTotal === 0 ? (
        <p className="mt-6 text-zinc-600">
          Für diese Session liegen noch keine beantworteten Fragen vor.
        </p>
      ) : (
        <section className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Diese Runde
          </h2>
          <p className="mt-2 text-lg text-zinc-900">
            {roundCorrect} von {roundTotal} richtig ({pct(roundCorrect, roundTotal)}%)
          </p>
        </section>
      )}

      {stats.total > 0 && (
        <section className="mt-6 rounded-xl border border-zinc-200 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
            Gesamt-Stand
          </h2>
          <p className="mt-2 text-lg text-zinc-900">
            {stats.correct} von {stats.total} richtig ({pct(stats.correct, stats.total)}%)
          </p>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Pro Domain
          </h3>
          <ul className="mt-3 flex flex-col gap-2 font-mono text-sm">
            {stats.byDomain.map((d) => (
              <li
                key={d.domain}
                className={`flex justify-between gap-4 ${domainToneClass(d.correct, d.total)}`}
              >
                <span className="truncate">{d.domain}</span>
                <span className="tabular-nums">
                  {d.correct}/{d.total} ({pct(d.correct, d.total)}%)
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/quiz"
          className="inline-block rounded-xl bg-zinc-900 px-6 py-3 text-center text-white transition hover:bg-zinc-800"
        >
          Übungsrunde neu starten
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
