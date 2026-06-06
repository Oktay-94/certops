import Link from "next/link";
import { db } from "@/db";
import { getAttemptStats, getLastRoundReview } from "@/db/repository";
import { scoreColorClass } from "@/lib/scoreColor";
import { getActiveProfileId } from "@/lib/profile-cookie";

const CERT = "CLF-C02" as const;

function pct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

function domainToneClass(correct: number, total: number): string {
  if (total === 0) return "text-zinc-500";
  return scoreColorClass(correct / total);
}

export default async function QuizDonePage() {
  const userId = await getActiveProfileId();

  // "Diese Runde" filtert über die round_id der zuletzt gespielten Runde,
  // nicht über die letzten N Attempts — sonst zeigt sie bei wenigen
  // Gesamt-Attempts denselben Wert wie der Gesamt-Stand.
  const round = userId ? await getLastRoundReview(db, userId, CERT) : null;
  const stats = userId
    ? await getAttemptStats(db, userId)
    : { total: 0, correct: 0, byDomain: [] };

  const roundCorrect = round?.correctCount ?? 0;
  const roundTotal = (round?.correctCount ?? 0) + (round?.incorrectCount ?? 0);

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
