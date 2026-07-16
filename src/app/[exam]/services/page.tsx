import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";
import { SERVICES } from "@/lib/services-data";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { ServiceCardGrid } from "@/components/services/ServiceCardGrid";
import { ServiceQuiz } from "@/components/services/ServiceQuiz";
import { BattleQuiz } from "@/components/services/BattleQuiz";
import { PuzzleGame } from "@/components/services/PuzzleGame";

// Token buttons (dark-safe) — same shell as the /cards toolbar links.
const navBtn =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong";

// CLF-only: der Dienste-Übungsbereich gehört zum CLF-Track — /saa/services 404t.
export default async function ServicesPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  if ((await params).exam !== "clf") notFound();
  return (
    <main className="relative mx-auto w-full max-w-7xl px-6 py-10 sm:py-12">
      <ScrollBackground />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            <span className="h-px w-8 bg-line-strong" aria-hidden />
            🧩 AWS Dienste
          </div>
          <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
            AWS Dienste
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
            {SERVICES.length} Service-Karteikarten · freies Üben, kein Fortschritt
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/clf/skript" className={navBtn}>
            <BookOpen className="h-4 w-4 text-ink-faint" aria-hidden />
            Lernskript
          </Link>
          <Link href="/clf/uebersicht" className={navBtn}>
            <Layers className="h-4 w-4 text-ink-faint" aria-hidden />
            Übersicht
          </Link>
          <Link href="/clf" className={navBtn}>
            <ArrowLeft className="h-4 w-4 text-ink-faint" aria-hidden />
            Zum Dashboard
          </Link>
        </div>
      </div>

      {/* Quiz/practice entries — pure client islands, each a full-screen overlay.
          Dashboard "Bereiche-Kachel" look: surface card, hairline border, emoji
          glyph + title + desc; the mode colour lives in the launcher gradient. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModeBox
          glyph="🎓"
          title="Dienste-Quiz"
          desc="Dienst-Name gezeigt — wähle die passende Beschreibung. Zufällige Auswahl, kein gespeicherter Fortschritt."
        >
          <ServiceQuiz />
        </ModeBox>

        <ModeBox
          glyph="⚔️"
          title="Battle Cards"
          desc="50 Fragen, 4 Optionen, 60s pro Frage — in vier Schwierigkeitsstufen. Freies Üben, kein Fortschritt."
        >
          <BattleQuiz />
        </ModeBox>

        <ModeBox
          glyph="🧩"
          title="Puzzle"
          desc="Begriff auf die passende Beschreibung ziehen oder antippen — gemischt oder nach Kategorie. Freies Üben, kein Fortschritt."
        >
          <PuzzleGame />
        </ModeBox>
      </div>

      <ServiceCardGrid />
    </main>
  );
}

function ModeBox({
  glyph,
  title,
  desc,
  children,
}: {
  glyph: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bento-tile relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface p-[18px]">
      <h2 className="flex items-center gap-2.5 text-[14.5px] font-semibold text-ink">
        <span className="area-glyph text-[30px] leading-none" aria-hidden>
          {glyph}
        </span>
        {title}
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{desc}</p>
      {children}
    </div>
  );
}
