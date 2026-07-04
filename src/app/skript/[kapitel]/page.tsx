import Link from "next/link";
import { notFound } from "next/navigation";
import { SKRIPT_CHAPTERS, chapterBySlug } from "@/lib/skript";
import { chapterColorVars } from "@/lib/skript-chapter-colors";
import {
  readChapterMarkdown,
  splitChapter,
  toRenderBlocks,
} from "@/lib/skript-content";
import { emojiForHeadingText } from "@/lib/skript-emoji";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";

export function generateStaticParams() {
  return SKRIPT_CHAPTERS.map((c) => ({ kapitel: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kapitel: string }>;
}) {
  const chapter = chapterBySlug((await params).kapitel);
  return {
    title: chapter
      ? `Kapitel ${chapter.num}: ${chapter.title} — AWS-Lernskript`
      : "AWS-Lernskript",
  };
}

/** Chip label without the Amazon/AWS prefix ("Amazon Athena" → "Athena"). */
function shortLabel(text: string): string {
  return text.replace(/^(Amazon|AWS)\s+/, "");
}

export default async function SkriptChapterPage({
  params,
}: {
  params: Promise<{ kapitel: string }>;
}) {
  const chapter = chapterBySlug((await params).kapitel);
  if (!chapter) notFound();

  const { intro, sections } = splitChapter(readChapterMarkdown(chapter));
  const prev = SKRIPT_CHAPTERS.find((c) => c.num === chapter.num - 1);
  const next = SKRIPT_CHAPTERS.find((c) => c.num === chapter.num + 1);

  return (
    <div
      style={chapterColorVars(chapter.num)}
      className="min-h-screen bg-[color:var(--tint)]"
    >
      {/* Sticky breadcrumb with blur */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[760px] items-center gap-2.5 px-6 py-3 text-[13.5px] text-zinc-500">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full bg-[color:var(--accent)]"
            aria-hidden
          />
          <Link href="/skript" className="transition hover:text-[color:var(--accent)]">
            Lernskript
          </Link>
          <span aria-hidden>›</span>
          <span className="truncate text-zinc-900">
            Kapitel {chapter.num} · {chapter.title}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-[760px] px-6 pb-24">
        {/* Chapter header */}
        <header className="pt-14">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-[5px] text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[color:var(--accent)]">
            <chapter.Icon className="h-3.5 w-3.5" aria-hidden />
            Kapitel {chapter.num}
          </span>
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.021em] text-zinc-900 sm:text-[40px]">
            {chapter.title}
          </h1>
          {intro && (
            <div className="mt-4 text-[16.5px] text-zinc-600">
              <SkriptMarkdown markdown={intro} />
            </div>
          )}
        </header>

        {/* Service chips */}
        {sections.length > 0 && (
          <nav
            aria-label="Dienste in diesem Kapitel"
            className="mt-8 flex flex-wrap gap-2"
          >
            {sections.map((s) => {
              const emoji = emojiForHeadingText(s.raw);
              return (
                <a
                  key={s.slug}
                  href={`#${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white py-[7px] pl-[11px] pr-3.5 text-[14px] font-medium text-zinc-700 transition hover:-translate-y-px hover:border-[color:var(--accent)]"
                >
                  {emoji && <span aria-hidden>{emoji}</span>}
                  {shortLabel(s.text)}
                </a>
              );
            })}
          </nav>
        )}

        {/* Per-service cards */}
        {sections.map((s) => (
          <article
            key={s.slug}
            className="mt-6 rounded-[20px] border border-zinc-200 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_-16px_rgba(24,24,27,0.12)] sm:px-9 sm:py-8"
          >
            {toRenderBlocks(s.markdown).map((block, i) =>
              block.kind === "exam" ? (
                <div
                  key={i}
                  className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-[18px] [&_ul]:mt-2.5"
                >
                  <SkriptMarkdown markdown={block.markdown} />
                </div>
              ) : (
                <SkriptMarkdown key={i} markdown={block.markdown} />
              ),
            )}
          </article>
        ))}

        {/* Prev / next pager */}
        <div className="mt-11 flex gap-3.5">
          {prev ? (
            <Link
              href={`/skript/${prev.slug}`}
              className="flex-1 rounded-2xl border border-zinc-200 bg-white px-[18px] py-4 transition hover:border-[color:var(--accent)]"
            >
              <div className="text-[12px] uppercase tracking-[0.04em] text-zinc-500">
                ‹ Vorher
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold text-zinc-900">
                Kapitel {prev.num} · {prev.title}
              </div>
            </Link>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
          {next ? (
            <Link
              href={`/skript/${next.slug}`}
              className="flex-1 rounded-2xl border border-zinc-200 bg-white px-[18px] py-4 text-right transition hover:border-[color:var(--accent)]"
            >
              <div className="text-[12px] uppercase tracking-[0.04em] text-zinc-500">
                Weiter ›
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold text-zinc-900">
                Kapitel {next.num} · {next.title}
              </div>
            </Link>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
        </div>
      </main>
    </div>
  );
}
