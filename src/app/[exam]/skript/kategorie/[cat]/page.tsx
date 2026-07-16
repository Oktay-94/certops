// Level 2 of the SAA script navigation: one category, alphabetical service
// list with domain chips (D1–D4 = exam weight, category = navigation — see
// saa-script-categories.ts). SAA-only: the CLF Skript has file-based chapters
// and no category level. The literal `kategorie` segment wins over the
// sibling [kapitel] route, and no service slug is named "kategorie"
// (guard-tested).
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { getScriptsByCert } from "@/db/repository";
import {
  scriptCategoryByKey,
  SCRIPT_SLUGS_BY_CATEGORY,
  type SaaScriptCategoryKey,
} from "@/lib/saa-script-categories";
import { SAA_C03_DOMAINS } from "@/lib/domains";
import { getDomainColor } from "@/lib/domain-colors";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";

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
  const slugs = new Set(
    SCRIPT_SLUGS_BY_CATEGORY[cat as SaaScriptCategoryKey],
  );
  const scripts = (await getScriptsByCert(db, "SAA-C03"))
    .filter((s) => slugs.has(s.slug))
    .sort((a, b) => a.service.localeCompare(b.service, "de"));

  return (
    <div lang="de" className="relative min-h-screen">
      <ScrollBackground />
      {/* Sticky breadcrumb — same shell as the readers. */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-4xl items-center gap-2.5 px-6 py-3 text-[13.5px] text-ink-soft">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full"
            style={{ backgroundColor: category.accent }}
            aria-hidden
          />
          <Link
            href="/saa/skript"
            className="transition hover:text-ink"
          >
            Lernskript
          </Link>
          <span aria-hidden>›</span>
          <span className="truncate text-ink">{category.title}</span>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 pb-24">
        <header className="flex items-start gap-4 pt-12">
          <span
            className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: category.bg, color: category.accent }}
            aria-hidden
          >
            <category.Icon className="h-6 w-6" />
          </span>
          <div>
            <div
              className="font-mono text-[10.5px] font-semibold tracking-[0.12em]"
              style={{ color: category.accent }}
            >
              KATEGORIE
            </div>
            <h1 className="mt-0.5 text-[clamp(24px,3.5vw,34px)] font-bold leading-tight tracking-[-0.02em] text-ink">
              {category.title}
            </h1>
            <p className="mt-1.5 font-mono text-[11px] tracking-[0.1em] text-ink-faint">
              {scripts.length} SKRIPTE · ALPHABETISCH
            </p>
          </div>
        </header>

        {/* Service rows (mockup level-2 panel) */}
        <div className="mt-7 rounded-[14px] border border-line bg-surface p-1.5">
          {scripts.map((s) => (
            <Link
              key={s.slug}
              href={`/saa/skript/${s.slug}`}
              className="flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-3 transition hover:bg-surface-2"
            >
              <span className="min-w-0 truncate text-[14px] text-ink">
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
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
