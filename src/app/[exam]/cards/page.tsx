import Link from "next/link";
import { db } from "@/db";
import { getFlashcards } from "@/db/repository";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { FlashcardGrid } from "./FlashcardGrid";
import { EXAM_CERT, type ExamSlug } from "@/lib/exam";

export default async function CardsPage({
  params,
}: {
  params: Promise<{ exam: ExamSlug }>;
}) {
  const { exam } = await params;
  const cards = await getFlashcards(db, EXAM_CERT[exam]);

  if (cards.length === 0) return <EmptyState exam={exam} />;

  const domains = Array.from(new Set(cards.map((c) => c.domain))).sort();

  return (
    <main className="relative mx-auto w-full max-w-[1120px] px-6 py-10 sm:py-12">
      <ScrollBackground />
      <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        <span className="h-px w-8 bg-line-strong" aria-hidden />
        🗂️ Karteikarten
      </div>
      <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
        AWS Karteikarten
      </h1>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
        Vorderseite = Frage · Rückseite = Antwort · Klick zum Umdrehen
      </p>

      <FlashcardGrid
        exam={exam}
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

function EmptyState({ exam }: { exam: ExamSlug }) {
  return (
    <main className="relative mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <ScrollBackground />
      <h1 className="text-[clamp(26px,4vw,40px)] font-bold tracking-[-0.03em] text-ink">
        Karteikarten in Vorbereitung
      </h1>
      <p className="mt-3 text-ink-soft">Noch keine Karten in der Datenbank.</p>

      <Link
        href={`/${exam}`}
        className="mt-10 inline-block rounded-lg border border-line-strong px-6 py-3 text-center text-[13px] font-semibold text-ink transition-colors hover:border-ink-faint"
      >
        Zurück zum Dashboard
      </Link>
    </main>
  );
}
