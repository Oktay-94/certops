import Link from "next/link";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";

export default function QuizDonePage() {
  const total = getQuestionsByCert(db, "CLF-C02").length;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        Übungsrunde abgeschlossen
      </h1>

      <p className="mt-4 text-lg leading-relaxed text-zinc-700">
        Du hast alle {total} Fragen dieser Runde gesehen.
      </p>

      <aside className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-relaxed text-zinc-600">
        Eine detaillierte Auswertung — welche Fragen du richtig oder falsch
        beantwortet hast und wo deine Schwachstellen liegen — kommt mit dem
        Schwachstellen-Tracking.
      </aside>

      <Link
        href="/quiz"
        className="mt-10 inline-block rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800"
      >
        Übungsrunde neu starten
      </Link>
    </main>
  );
}
