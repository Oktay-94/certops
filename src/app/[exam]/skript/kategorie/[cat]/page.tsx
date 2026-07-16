// Level 2 of the SAA script navigation — a CLF-chapter-style READING page:
// all service scripts of one category stacked and fully rendered,
// alphabetical, with a TOC of in-page anchors on top (no detail-page links).
// The standalone /saa/skript/<slug> detail pages stay untouched — both
// reading surfaces deliberately coexist (see CLAUDE.md).
//
// Anchor uniqueness (phase-5 invariant): stacked scripts repeat their `##`
// headings (CLF-Recap, Knackpunkte …), so SkriptMarkdown namespaces every
// section id under the service slug via anchorPrefix (stackedAnchorId — no
// second slugger); the service article itself carries the plain service slug.
// Guard-tested in saa-script-categories.test.ts. No TTS here: SAA-TTS stays
// documented debt, as on the detail pages.
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Layers } from "lucide-react";
import { db } from "@/db";
import { getScriptsBySlugs } from "@/db/repository";
import {
  scriptCategoryByKey,
  SCRIPT_SLUGS_BY_CATEGORY,
  type SaaScriptCategoryKey,
} from "@/lib/saa-script-categories";
import { SAA_C03_DOMAINS } from "@/lib/domains";
import { getDomainColor } from "@/lib/domain-colors";
import { splitChapter } from "@/lib/skript-content";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";

const linkBtn =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cat: string }>;
}) {
  const category = scriptCategoryByKey((await params).cat);
  return {
    title: category
      ? `${category.title} — SAA-Lernskript`
      : "SAA-Lernskript",
  };
}

/** Same var recipe as chapterColorVars(), accent from the category. */
function categoryColorVars(accent: string): CSSProperties {
  return {
    "--accent": accent,
    "--accent-soft": `color-mix(in srgb, ${accent} 16%, transparent)`,
    "--tint": "var(--canvas)",
  } as CSSProperties;
}

/** Short chip code for a domain ("D1"…"D4", exam-guide order). */
function domainCode(domain: string): string {
  const i = (SAA_C03_DOMAINS as readonly string[]).indexOf(domain);
  return i === -1 ? "D?" : `D${i + 1}`;
}

export default async function SkriptKategoriePage({
  params,
}: {
  params: Promise<{ exam: string; cat: string }>;
}) {
  const { exam, cat } = await params;
  if (exam !== "saa") notFound();
  const category = scriptCategoryByKey(cat);
  if (!category) notFound();

  await connection();
  const scripts = (
    await getScriptsBySlugs(
      db,
      "SAA-C03",
      SCRIPT_SLUGS_BY_CATEGORY[cat as SaaScriptCategoryKey],
    )
  ).sort((a, b) => a.service.localeCompare(b.service, "de"));

  return (
    <div
      lang="de"
      style={categoryColorVars(category.accent)}
      className="relative min-h-screen"
    >
      <ScrollBackground />
      {/* Sticky breadcrumb — same shell as the readers. */}
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
          <span className="truncate text-ink">{category.title}</span>
        </div>
      </div>

      <main className="mx-auto max-w-[760px] px-6 pb-24">
        {/* Chapter header — CLF chrome: Übersicht → grid, Dashboard → /saa. */}
        <header className="pt-14">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-soft)] px-3 py-[5px] text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[color:var(--accent)]">
              <category.Icon className="h-3.5 w-3.5" aria-hidden />
              Kategorie
            </span>
            <div className="flex flex-wrap gap-2">
              <Link href="/saa/skript" className={linkBtn}>
                <Layers className="h-4 w-4 text-ink-faint" aria-hidden />
                Übersicht
              </Link>
              <Link href="/saa" className={linkBtn}>
                <ArrowLeft className="h-4 w-4 text-ink-faint" aria-hidden />
                Zum Dashboard
              </Link>
            </div>
          </div>
          <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.021em] text-ink [overflow-wrap:anywhere] hyphens-auto">
            {category.title}
          </h1>
          <p className="mt-2.5 text-[14.5px] text-ink-soft">
            {scripts.length} Dienst-Skripte · alphabetisch · D-Chips =
            Prüfungs-Domänen
          </p>
        </header>

        {/* TOC — services with domain chips, in-page anchor jumps. */}
        {scripts.length > 1 && (
          <nav
            aria-label="Dienste in dieser Kategorie"
            className="mt-8 rounded-2xl border border-line bg-surface p-2"
          >
            {scripts.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-2.5 transition hover:bg-surface-2"
              >
                <span className="min-w-0 truncate text-[14px] font-medium text-ink-soft">
                  {s.service}
                </span>
                <span className="flex shrink-0 gap-[5px]">
                  {s.domains.map((d) => (
                    <span
                      key={d}
                      title={d}
                      className={`rounded-md border px-[7px] py-[2px] font-mono text-[10.5px] font-semibold ${getDomainColor(d).tag}`}
                    >
                      {domainCode(d)}
                    </span>
                  ))}
                </span>
              </a>
            ))}
          </nav>
        )}

        {/* Stacked scripts — one card per service, sections namespaced under
            the service slug. */}
        {scripts.map((s) => {
          const body = s.content.replace(/^# .*\n/, "");
          const { intro, sections } = splitChapter(body);
          return (
            <article
              key={s.slug}
              id={s.slug}
              className="mt-6 scroll-mt-[72px] rounded-2xl border border-line bg-surface px-6 py-7 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_-16px_rgba(24,24,27,0.10)] dark:shadow-none sm:px-9 sm:py-8"
            >
              <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[26px] font-[680] leading-tight tracking-[-0.017em] text-ink [overflow-wrap:anywhere]">
                  {s.service}
                </h2>
                <span className="flex shrink-0 gap-[5px]">
                  {s.domains.map((d) => (
                    <span
                      key={d}
                      title={d}
                      className={`rounded-md border px-[7px] py-[2px] font-mono text-[10.5px] font-semibold ${getDomainColor(d).tag}`}
                    >
                      {domainCode(d)}
                    </span>
                  ))}
                </span>
              </div>
              {intro && <SkriptMarkdown markdown={intro} anchorPrefix={s.slug} />}
              {sections.map((sec) => (
                <div key={sec.slug} className="mt-6">
                  <SkriptMarkdown
                    markdown={sec.markdown}
                    anchorPrefix={s.slug}
                  />
                </div>
              ))}
            </article>
          );
        })}
      </main>
    </div>
  );
}
