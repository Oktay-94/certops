import Link from "next/link";
import { db } from "@/db";
import { getFlashcards } from "@/db/repository";
import { FlashcardGrid } from "./FlashcardGrid";

export default async function CardsPage() {
  const cards = await getFlashcards(db, "CLF-C02");

  if (cards.length === 0) return <EmptyState />;

  const domains = Array.from(new Set(cards.map((c) => c.domain))).sort();

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        AWS Karteikarten
      </h1>
      <p className="mt-3 text-zinc-600">
        Vorderseite = Frage · Rückseite = Antwort · Klick zum Umdrehen
      </p>

      <FlashcardGrid
        cards={cards.map((c) => ({
          id: c.id,
          cert: c.cert,
          domain: c.domain,
          front: c.front,
          back: c.back,
          iconSlugs: c.iconSlugs ?? null,
        }))}
        domains={domains}
      />
    </main>
  );
}

function EmptyState() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        Karteikarten in Vorbereitung
      </h1>
      <p className="mt-3 text-zinc-600">
        Noch keine Karten in der Datenbank.
      </p>

      <Link
        href="/"
        className="mt-10 inline-block rounded-xl border border-zinc-300 px-6 py-3 text-center text-zinc-900 transition hover:bg-zinc-100"
      >
        Zurück zum Dashboard
      </Link>
    </main>
  );
}
