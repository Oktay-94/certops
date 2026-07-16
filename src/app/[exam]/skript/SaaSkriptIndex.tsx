// SAA script index — category chapter grid (Schema B, mockup
// design/mockups/saa-skript-kategorien-mockup.html 1:1). Level 1 of the
// two-level navigation: category cards link to /saa/skript/kategorie/<key>;
// the exam domains stay as chips on the service rows (level 2). Counts come
// from mapping ∩ DB list, so a reseed is reflected without touching the
// mapping file.
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { getScriptsByCert } from "@/db/repository";
import {
  SAA_SCRIPT_CATEGORIES,
  SCRIPT_SLUGS_BY_CATEGORY,
} from "@/lib/saa-script-categories";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";

const linkBtn =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong";

export async function SaaSkriptIndex() {
  // Request-time render: reseeded scripts show up without a redeploy, and the
  // build never needs DB access (the CLF branch of this route stays static).
  await connection();
  const scripts = await getScriptsByCert(db, "SAA-C03");
  const dbSlugs = new Set(scripts.map((s) => s.slug));

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
            SAA-Lernskript
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
            {scripts.length} Dienst-Skripte in 10 Kategorien · CLF-Recap →
            SAA-Vertiefung → Prüfungs-Knackpunkte · freies Lesen, kein
            Fortschritt
          </p>
        </div>
        <Link href="/saa" className={linkBtn}>
          <ArrowLeft className="h-4 w-4 text-ink-faint" aria-hidden />
          Zum Dashboard
        </Link>
      </div>

      {/* Category grid — mockup values 1:1 (accent border, tinted icon tile,
          eyebrow, summary, count pill). */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SAA_SCRIPT_CATEGORIES.map((cat) => {
          const count = SCRIPT_SLUGS_BY_CATEGORY[cat.key].filter((slug) =>
            dbSlugs.has(slug),
          ).length;
          return (
            <Link
              key={cat.key}
              href={`/saa/skript/kategorie/${cat.key}`}
              style={{ borderLeftColor: cat.accent }}
              className="rounded-[14px] border border-line border-l-4 bg-surface p-[18px] pb-4 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_8px_24px_rgba(20,26,36,0.08)] dark:hover:shadow-none"
            >
              <div className="flex items-start gap-[13px]">
                <span
                  className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[11px]"
                  style={{ backgroundColor: cat.bg, color: cat.accent }}
                  aria-hidden
                >
                  <cat.Icon className="h-[22px] w-[22px]" />
                </span>
                <div>
                  <div
                    className="mb-[3px] font-mono text-[10.5px] font-semibold tracking-[0.12em]"
                    style={{ color: cat.accent }}
                  >
                    KATEGORIE
                  </div>
                  <h2 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-ink">
                    {cat.title}
                  </h2>
                </div>
              </div>
              <p className="mb-3 mt-[9px] text-[13px] leading-normal text-ink-soft">
                {cat.summary}
              </p>
              {/* Fixed mockup ink on the fixed light tint — theme tokens would
                  go light-on-light in dark mode. */}
              <span
                className="inline-block rounded-full px-2.5 py-1 font-mono text-[11.5px]"
                style={{ backgroundColor: cat.bg, color: "#5b6472" }}
              >
                {count} Skripte
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
