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
import { INTRO_SLUG, ttsPlainText } from "@/lib/tts-text";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import {
  TtsChapterButton,
  TtsProvider,
  TtsSectionButton,
} from "@/components/skript/TtsPlayer";
import { SaaScriptDetail, fetchScript } from "./SaaScriptDetail";
import { SCRIPT_SLUGS_BY_CATEGORY } from "@/lib/saa-script-categories";

// CLF chapters prerender; the SAA slugs are enumerated from the STATIC
// category mapping (no build-time DB) — their build render bails out via
// connection() and Next registers them as request-time dynamic. Slugs not
// listed here 404 via dynamicParams=false, so production never attempts
// on-demand static generation (which would 500 on connection()).
export function generateStaticParams() {
  return [
    ...SKRIPT_CHAPTERS.map((c) => ({ exam: "clf", kapitel: c.slug })),
    ...Object.values(SCRIPT_SLUGS_BY_CATEGORY)
      .flat()
      .map((slug) => ({ exam: "saa", kapitel: slug })),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exam: string; kapitel: string }>;
}) {
  const { exam, kapitel } = await params;
  if (exam === "saa") {
    const script = await fetchScript(kapitel);
    return {
      title: script
        ? `${script.service} — SAA-Lernskript`
        : "SAA-Lernskript",
    };
  }
  const chapter = chapterBySlug(kapitel);
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

// Storage-model split per track — see skript/page.tsx.
export default async function SkriptChapterPage({
  params,
}: {
  params: Promise<{ exam: string; kapitel: string }>;
}) {
  const { exam, kapitel } = await params;
  if (exam === "saa") return <SaaScriptDetail slug={kapitel} />;
  if (exam !== "clf") notFound();
  const chapter = chapterBySlug(kapitel);
  if (!chapter) notFound();

  const { intro, sections } = splitChapter(readChapterMarkdown(chapter));
  const prev = SKRIPT_CHAPTERS.find((c) => c.num === chapter.num - 1);
  const next = SKRIPT_CHAPTERS.find((c) => c.num === chapter.num + 1);

  // TTS playlist in reading order — intro only when it actually speaks.
  const playlist = [
    ...(ttsPlainText(intro) ? [INTRO_SLUG] : []),
    ...sections.map((s) => s.slug),
  ];

  return (
    <div
      lang="de"
      style={chapterColorVars(chapter.num)}
      className="relative min-h-screen"
    >
      <ScrollBackground />
      {/* Sticky breadcrumb with blur */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[760px] items-center gap-2.5 px-6 py-3 text-[13.5px] text-ink-soft">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full bg-[color:var(--accent)]"
            aria-hidden
          />
          <Link href="/clf/skript" className="transition hover:text-[color:var(--accent)]">
            Lernskript
          </Link>
          <span aria-hidden>›</span>
          <span className="truncate text-ink">
            Kapitel {chapter.num} · {chapter.title}
          </span>
        </div>
      </div>

      <TtsProvider kapitel={chapter.slug} playlist={playlist}>
      <main className="mx-auto max-w-[760px] px-6 pb-24">
        {/* Chapter header */}
        <header className="pt-14">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-[5px] text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[color:var(--accent)]">
              <chapter.Icon className="h-3.5 w-3.5" aria-hidden />
              Kapitel {chapter.num}
            </span>
            {playlist.length > 0 && <TtsChapterButton />}
          </div>
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.021em] text-ink [overflow-wrap:anywhere] hyphens-auto sm:text-[40px]">
            {chapter.title}
          </h1>
          {intro && (
            <div className="mt-4 text-[16.5px] text-ink-soft">
              <SkriptMarkdown markdown={intro} />
            </div>
          )}
        </header>

        {/* Service chips */}
        {sections.length > 0 && (
          <nav
            aria-label="Dienste in diesem Kapitel"
            className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-4 sm:p-5"
          >
            {sections.map((s) => {
              const emoji = emojiForHeadingText(s.raw);
              return (
                <a
                  key={s.slug}
                  href={`#${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-[7px] pl-[11px] pr-3.5 text-[14px] font-medium text-ink-soft transition hover:-translate-y-px hover:border-[color:var(--accent)]"
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
            className="relative mt-6 rounded-2xl border border-line bg-surface px-6 py-7 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_-16px_rgba(24,24,27,0.10)] dark:shadow-none sm:px-9 sm:py-8 [&_.svc-head]:pr-10"
          >
            {/* Section play button — top-right of the card, outside the
                markdown renderer (h2 id/emoji logic stays untouched). The
                .svc-head padding above reserves its corner. */}
            <div className="absolute right-4 top-6 sm:right-6 sm:top-7">
              <TtsSectionButton slug={s.slug} />
            </div>
            {toRenderBlocks(s.markdown).map((block, i) =>
              block.kind === "exam" ? (
                <div
                  key={i}
                  className="mt-6 rounded-2xl border border-line bg-surface-2 px-5 py-[18px] [&_ul]:mt-2.5"
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
              href={`/clf/skript/${prev.slug}`}
              className="flex-1 rounded-2xl border border-line bg-surface px-[18px] py-4 transition hover:border-[color:var(--accent)]"
            >
              <div className="text-[12px] uppercase tracking-[0.04em] text-ink-faint">
                ‹ Vorher
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold text-ink">
                Kapitel {prev.num} · {prev.title}
              </div>
            </Link>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
          {next ? (
            <Link
              href={`/clf/skript/${next.slug}`}
              className="flex-1 rounded-2xl border border-line bg-surface px-[18px] py-4 text-right transition hover:border-[color:var(--accent)]"
            >
              <div className="text-[12px] uppercase tracking-[0.04em] text-ink-faint">
                Weiter ›
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold text-ink">
                Kapitel {next.num} · {next.title}
              </div>
            </Link>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
        </div>
      </main>
      </TtsProvider>
    </div>
  );
}
