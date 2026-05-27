import Link from "next/link";
import { db } from "@/db";
import { getFlashcards } from "@/db/repository";

export default function Home() {
  const cardCount = getFlashcards(db, "CLF-C02").length;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        CertOps
      </h1>
      <p className="mt-3 text-zinc-600">AWS-Zertifikats-Vorbereitung</p>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/quiz"
          className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Quiz</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Übungsmodus — Umfang & Fokus wählbar
          </p>
        </Link>

        <Link
          href="/stats"
          className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Statistik</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Trefferquoten und Schwachstellen
          </p>
        </Link>

        <Link
          href="/cards"
          className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Karteikarten</h2>
          <p className="mt-2 text-sm text-zinc-600">
            {cardCount} Karten — Begriffe trainieren
          </p>
        </Link>
      </div>
    </main>
  );
}
