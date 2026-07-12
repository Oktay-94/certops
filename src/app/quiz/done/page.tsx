import Link from "next/link";
import { db } from "@/db";
import { getAttemptStats, getLastRoundReview } from "@/db/repository";
import { scoreColorClass } from "@/lib/scoreColor";
import { getActiveProfileId } from "@/lib/profile-cookie";
import { BRAND_ORANGE } from "@/lib/brand";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";

const CERT = "CLF-C02" as const;

function pct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

function domainToneClass(correct: number, total: number): string {
  if (total === 0) return "text-ink-faint";
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
    <main className="relative mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <ScrollBackground />
      <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        <span className="h-px w-8 bg-line-strong" aria-hidden />
        🏁 Runde beendet
      </div>
      <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
        Übungsrunde abgeschlossen
      </h1>

      {roundTotal === 0 ? (
        <p className="mt-6 text-ink-soft">
          Für diese Session liegen noch keine beantworteten Fragen vor.
        </p>
      ) : (
        <section className="mt-8 rounded-xl border border-line bg-surface p-6">
          <h2
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--success)" }}
          >
            Diese Runde
          </h2>
          <p className="mt-2 text-lg text-ink">
            {roundCorrect} von {roundTotal} richtig ({pct(roundCorrect, roundTotal)}%)
          </p>
        </section>
      )}

      {stats.total > 0 && (
        <section className="mt-6 rounded-xl border border-line bg-surface p-6">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Gesamt-Stand
          </h2>
          <p className="mt-2 text-lg text-ink">
            {stats.correct} von {stats.total} richtig ({pct(stats.correct, stats.total)}%)
          </p>

          <h3 className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
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
          className="inline-block rounded-lg px-6 py-3 text-center text-[13px] font-semibold transition-transform hover:-translate-y-px"
          style={{ background: BRAND_ORANGE, color: "var(--cta-ink)" }}
        >
          Übungsrunde neu starten
        </Link>
        <Link
          href="/"
          className="inline-block rounded-lg border border-line-strong px-6 py-3 text-center text-[13px] font-semibold text-ink transition-colors hover:border-ink-faint"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </main>
  );
}
