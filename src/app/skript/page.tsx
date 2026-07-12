import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { SKRIPT_CHAPTERS } from "@/lib/skript";
import { chapterColor, chapterColorVars } from "@/lib/skript-chapter-colors";
import {
  parseHeadings,
  readChapterMarkdown,
  readDeckblattMarkdown,
} from "@/lib/skript-content";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";

export const metadata = {
  title: "AWS-Lernskript — CertOps",
};

const linkBtn =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong";

export default function SkriptIndexPage() {
  const deckblatt = readDeckblattMarkdown();

  return (
    <main className="relative mx-auto max-w-4xl px-6 py-10 sm:py-12">
      <ScrollBackground />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            <span className="h-px w-8 bg-line-strong" aria-hidden />
            📖 Lernskript
          </div>
          <h1 className="text-[clamp(26px,4vw,40px)] font-bold tracking-[-0.03em] text-ink">
            AWS-Lernskript
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
            13 Kapitel · 172 Dienste · freies Lesen, kein Fortschritt
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/uebersicht" className={linkBtn}>
            <Layers className="h-4 w-4 text-ink-faint" aria-hidden />
            Übersicht
          </Link>
          <Link href="/" className={linkBtn}>
            <ArrowLeft className="h-4 w-4 text-ink-faint" aria-hidden />
            Zum Dashboard
          </Link>
        </div>
      </div>

      {/* Chapter grid — accent-stripe cards, same visual family as the reader. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SKRIPT_CHAPTERS.map((chapter) => {
          const { accent } = chapterColor(chapter.num);
          const serviceCount = parseHeadings(readChapterMarkdown(chapter)).length;
          return (
            <Link
              key={chapter.num}
              href={`/skript/${chapter.slug}`}
              className="flex overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_24px_-14px_rgba(0,0,0,0.10)] transition hover:-translate-y-px hover:border-line-strong dark:shadow-none"
            >
              <div
                className="w-[5px] shrink-0"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
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
                  <h2 className="mt-0.5 text-base font-semibold leading-snug text-ink [overflow-wrap:anywhere]">
                    {chapter.title}
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">
                    {chapter.topics}
                  </p>
                  <span
                    className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
                      color: accent,
                    }}
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
        className="mt-12 border-t border-line pt-8"
      >
        <SkriptMarkdown markdown={deckblatt} />
      </section>
    </main>
  );
}
