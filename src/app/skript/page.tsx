import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SKRIPT_CHAPTERS } from "@/lib/skript";
import { chapterColor, chapterColorVars } from "@/lib/skript-chapter-colors";
import {
  parseHeadings,
  readChapterMarkdown,
  readDeckblattMarkdown,
} from "@/lib/skript-content";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";

export const metadata = {
  title: "AWS-Lernskript — CertOps",
};

export default function SkriptIndexPage() {
  const deckblatt = readDeckblattMarkdown();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.02em] text-zinc-900 sm:text-4xl">
            AWS-Lernskript
          </h1>
          <p className="mt-3 text-zinc-600">
            13 Kapitel · 172 Dienste · freies Lesen, kein Fortschritt
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Zum Dashboard
        </Link>
      </div>

      {/* Chapter grid — accent-stripe cards, same visual family as the reader. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SKRIPT_CHAPTERS.map((chapter) => {
          const { accent, accentSoft } = chapterColor(chapter.num);
          const serviceCount = parseHeadings(readChapterMarkdown(chapter)).length;
          return (
            <Link
              key={chapter.num}
              href={`/skript/${chapter.slug}`}
              className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-px hover:border-zinc-400 hover:shadow-md"
            >
              <div className="w-[5px] shrink-0" style={{ backgroundColor: accent }} aria-hidden />
              <div className="flex items-start gap-4 p-5">
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                >
                  <chapter.Icon className="h-5 w-5 text-white" />
                </span>
                <div className="min-w-0">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.05em] tabular-nums"
                    style={{ color: accent }}
                  >
                    Kapitel {chapter.num}
                  </p>
                  <h2 className="mt-0.5 text-base font-semibold leading-snug text-zinc-900">
                    {chapter.title}
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-snug text-zinc-500">
                    {chapter.topics}
                  </p>
                  <span
                    className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: accentSoft, color: accent }}
                  >
                    {serviceCount} Abschnitte
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Deckblatt: conventions + the fact-checked deprecation overview. Neutral
          accent — no single chapter owns the cover. */}
      <section
        style={chapterColorVars(0)}
        className="mt-12 border-t border-zinc-200 pt-8"
      >
        <SkriptMarkdown markdown={deckblatt} />
      </section>
    </main>
  );
}
