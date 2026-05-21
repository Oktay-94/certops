import Link from "next/link";

export default function Home() {
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
            Übungsmodus mit 64 Fragen
          </p>
        </Link>

        <ComingSoonCard
          title="Statistik"
          description="Trefferquoten und Schwachstellen"
        />

        <ComingSoonCard
          title="Karteikarten"
          description="Karten zum Lernen (geplant)"
        />
      </div>
    </main>
  );
}

function ComingSoonCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      aria-disabled="true"
      className="rounded-xl border border-zinc-200 bg-white p-6 opacity-50 cursor-not-allowed"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <span className="rounded border border-zinc-300 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-500">
          Bald
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
    </div>
  );
}
