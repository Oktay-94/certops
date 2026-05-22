import Link from "next/link";
import { db } from "@/db";
import { getFlashcards } from "@/db/repository";
import { FlashcardDeck } from "./FlashcardDeck";

export default function CardsPage() {
  const cards = getFlashcards(db, "CLF-C02");

  if (cards.length === 0) return <EmptyState />;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        Karteikarten
      </h1>
      <p className="mt-3 text-zinc-600">
        CLF-C02 · {cards.length} Karten
      </p>
      <FlashcardDeck
        cards={cards.map((c) => ({
          id: c.id,
          cert: c.cert,
          domain: c.domain,
          front: c.front,
          back: c.back,
        }))}
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
