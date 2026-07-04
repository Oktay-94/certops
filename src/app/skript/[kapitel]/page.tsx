import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { SKRIPT_CHAPTERS, chapterBySlug } from "@/lib/skript";
import { parseHeadings, readChapterMarkdown } from "@/lib/skript-content";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";
import { tint } from "@/lib/category-style";

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

export default async function SkriptChapterPage({
  params,
}: {
  params: Promise<{ kapitel: string }>;
}) {
  const chapter = chapterBySlug((await params).kapitel);
  if (!chapter) notFound();

  const markdown = readChapterMarkdown(chapter);
  const headings = parseHeadings(markdown);
  const prev = SKRIPT_CHAPTERS.find((c) => c.num === chapter.num - 1);
  const next = SKRIPT_CHAPTERS.find((c) => c.num === chapter.num + 1);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: chapter.color }}
            aria-hidden
          >
            <chapter.Icon className="h-6 w-6 text-white" />
          </span>
          <div>
            <p
              className="text-xs font-bold tabular-nums"
              style={{ color: chapter.color }}
            >
              Kapitel {chapter.num} von {SKRIPT_CHAPTERS.length}
            </p>
            <h1 className="mt-0.5 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
              {chapter.title}
            </h1>
          </div>
        </div>
        <Link
          href="/skript"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Alle Kapitel
        </Link>
      </div>

      {/* Service index: chapter → service → prose. Anchor targets come from
          the same slugifyHeading the h2 renderer uses. */}
      <nav
        aria-label="Dienste in diesem Kapitel"
        className="mt-6 flex flex-wrap gap-1.5 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        {headings.map((h) => (
          <a
            key={h.slug}
            href={`#${h.slug}`}
            className="rounded-full border px-2.5 py-1 text-[12px] font-medium transition hover:opacity-75"
            style={{
              backgroundColor: tint(chapter.color, "14"),
              color: chapter.color,
              borderColor: tint(chapter.color, "33"),
            }}
          >
            {h.text}
          </a>
        ))}
      </nav>

      <article className="mt-2">
        <SkriptMarkdown markdown={markdown} />
      </article>

      {/* Prev/next chapter navigation */}
      <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-zinc-200 pt-6">
        {prev ? (
          <Link
            href={`/skript/${prev.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kapitel {prev.num}: {prev.title}
          </Link>
        ) : (
          <span aria-hidden />
        )}
        {next && (
          <Link
            href={`/skript/${next.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400"
          >
            Kapitel {next.num}: {next.title}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
    </main>
  );
}
