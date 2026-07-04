import Link from "next/link";
import { ArrowLeft, BookOpen, type LucideIcon } from "lucide-react";
import { SERVICES } from "@/lib/services-data";
import { MODE_STYLE } from "@/lib/mode-style";
import { ServiceCardGrid } from "@/components/services/ServiceCardGrid";
import { ServiceQuiz } from "@/components/services/ServiceQuiz";
import { BattleQuiz } from "@/components/services/BattleQuiz";
import { PuzzleGame } from "@/components/services/PuzzleGame";

export default function ServicesPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
            AWS Dienste
          </h1>
          <p className="mt-3 text-zinc-600">
            {SERVICES.length} Service-Karteikarten · freies Üben, kein Fortschritt
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/skript"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            Lernskript
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Zum Dashboard
          </Link>
        </div>
      </div>

      {/* Quiz/practice entries — pure client islands, each a full-screen overlay.
          "Accent Bar" style: top colour stripe + filled icon badge per mode. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ModeBox
          color={MODE_STYLE.quiz.base}
          Icon={MODE_STYLE.quiz.Icon}
          title="Dienste-Quiz"
          desc="Dienst-Name gezeigt — wähle die passende Beschreibung. Zufällige Auswahl, kein gespeicherter Fortschritt."
        >
          <ServiceQuiz />
        </ModeBox>

        <ModeBox
          color={MODE_STYLE.battle.base}
          Icon={MODE_STYLE.battle.Icon}
          title="Battle Cards"
          desc="50 Fragen, 4 Optionen, 60s pro Frage — in vier Schwierigkeitsstufen. Freies Üben, kein Fortschritt."
        >
          <BattleQuiz />
        </ModeBox>

        <ModeBox
          color={MODE_STYLE.puzzle.base}
          Icon={MODE_STYLE.puzzle.Icon}
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
  color,
  Icon,
  title,
  desc,
  children,
}: {
  color: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Top accent stripe — clipped into the card rounding via overflow-hidden */}
      <div className="h-[5px] w-full" style={{ backgroundColor: color }} aria-hidden />
      <div className="flex flex-1 flex-col p-6">
        <span
          className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          <Icon className="h-6 w-6 text-white" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{desc}</p>
        {children}
      </div>
    </div>
  );
}
