// SAA script reader — one service script from the `scripts` table. Unknown
// slugs 404. Accent = PRIMARY domain (first frontmatter entry, order kept by
// the seed loader), fed through the same CSS custom properties the CLF reader
// uses so SkriptMarkdown draws identically for both tracks.
import type { CSSProperties } from "react";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { getScriptBySlug, getScriptsByCert } from "@/db/repository";
import { getDomainColor } from "@/lib/domain-colors";
import { splitChapter } from "@/lib/skript-content";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";

// Deduped between generateMetadata and the page render.
export const fetchScript = cache(async (slug: string) => {
  await connection();
  return getScriptBySlug(db, "SAA-C03", slug);
});

/** Same var recipe as chapterColorVars(), accent from the primary domain. */
function domainColorVars(domain: string): CSSProperties {
  const accent = getDomainColor(domain).solid;
  return {
    "--accent": accent,
    "--accent-soft": `color-mix(in srgb, ${accent} 16%, transparent)`,
    "--tint": "var(--canvas)",
  } as CSSProperties;
}

export async function SaaScriptDetail({ slug }: { slug: string }) {
  const script = await fetchScript(slug);
  if (!script) notFound();

  // The body's own `# <service>` h1 would duplicate the page header.
  const body = script.content.replace(/^# .*\n/, "");
  const { intro, sections } = splitChapter(body);

  const all = await getScriptsByCert(db, "SAA-C03");
  const idx = all.findIndex((s) => s.slug === script.slug);
  const prev = idx > 0 ? all[idx - 1] : undefined;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : undefined;

  const primaryDomain = script.domains[0];

  return (
    <div
      lang="de"
      style={domainColorVars(primaryDomain)}
      className="relative min-h-screen"
    >
      <ScrollBackground />
      {/* Sticky breadcrumb with blur — same shell as the CLF reader. */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[760px] items-center gap-2.5 px-6 py-3 text-[13.5px] text-ink-soft">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full bg-[color:var(--accent)]"
            aria-hidden
          />
          <Link
            href="/saa/skript"
            className="transition hover:text-[color:var(--accent)]"
          >
            Lernskript
          </Link>
          <span aria-hidden>›</span>
          <span className="truncate text-ink">{script.service}</span>
        </div>
      </div>

      <main className="mx-auto max-w-[760px] px-6 pb-24">
        <header className="pt-14">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {script.domains.map((d, i) => (
              <span
                key={d}
                className={`inline-flex items-center rounded-full border px-3 py-[5px] text-[12px] font-semibold ${getDomainColor(d).tag} ${i > 0 ? "opacity-80" : ""}`}
              >
                {d}
              </span>
            ))}
          </div>
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.021em] text-ink [overflow-wrap:anywhere] hyphens-auto">
            {script.title}
          </h1>
          {intro && (
            <div className="mt-4 text-[16.5px] text-ink-soft">
              <SkriptMarkdown markdown={intro} />
            </div>
          )}
        </header>

        {/* Section chips (CLF-Recap / SAA-Vertiefung / Knackpunkte …) */}
        {sections.length > 1 && (
          <nav
            aria-label="Abschnitte in diesem Skript"
            className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-4"
          >
            {sections.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="inline-flex items-center rounded-full border border-line bg-surface py-[7px] px-3.5 text-[14px] font-medium text-ink-soft transition hover:-translate-y-px hover:border-[color:var(--accent)]"
              >
                {/* raw heading text may carry markdown emphasis — chips show plain text */}
                {s.text.replace(/[*`]/g, "")}
              </a>
            ))}
          </nav>
        )}

        {sections.map((s) => (
          <article
            key={s.slug}
            className="mt-6 rounded-2xl border border-line bg-surface px-6 py-7 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_-16px_rgba(24,24,27,0.10)] dark:shadow-none sm:px-9 sm:py-8"
          >
            <SkriptMarkdown markdown={s.markdown} />
          </article>
        ))}

        {/* Prev / next pager in reading order (position) */}
        <div className="mt-11 flex gap-3.5">
          {prev ? (
            <Link
              href={`/saa/skript/${prev.slug}`}
              className="flex-1 rounded-2xl border border-line bg-surface px-[18px] py-4 transition hover:border-[color:var(--accent)]"
            >
              <div className="text-[12px] uppercase tracking-[0.04em] text-ink-faint">
                ‹ Vorher
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold text-ink">
                {prev.service}
              </div>
            </Link>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
          {next ? (
            <Link
              href={`/saa/skript/${next.slug}`}
              className="flex-1 rounded-2xl border border-line bg-surface px-[18px] py-4 text-right transition hover:border-[color:var(--accent)]"
            >
              <div className="text-[12px] uppercase tracking-[0.04em] text-ink-faint">
                Weiter ›
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold text-ink">
                {next.service}
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
