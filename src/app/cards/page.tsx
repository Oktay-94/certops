import Link from "next/link";

export default function CardsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
        Karteikarten in Vorbereitung
      </h1>
      <p className="mt-3 text-zinc-600">
        Die Schema-Struktur ist angelegt. Inhalt folgt in einer späteren Session.
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
