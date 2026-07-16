// SAA script overview — DB-based track (deliberate storage split from the
// file-based CLF chapters, see db/schema.ts). Grouped by PRIMARY domain =
// first entry of the frontmatter `domains` array (order is preserved by the
// seed loader); within a group alphabetical by service name. Batches are
// pipeline provenance, not didactic — they don't structure this page.
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { getScriptsByCert, type ScriptListItem } from "@/db/repository";
import { SAA_C03_DOMAINS, type SaaC03Domain } from "@/lib/domains";
import { getDomainColor } from "@/lib/domain-colors";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";

const linkBtn =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong";

/** Short chip code for a domain ("D1"…"D4", exam-guide order). */
function domainCode(domain: string): string {
  const i = (SAA_C03_DOMAINS as readonly string[]).indexOf(domain);
  return i === -1 ? "D?" : `D${i + 1}`;
}

export async function SaaSkriptIndex() {
  // Request-time render: reseeded scripts show up without a redeploy, and the
  // build never needs DB access (the CLF branch of this route stays static).
  await connection();
  const scripts = await getScriptsByCert(db, "SAA-C03");

  const byDomain = new Map<SaaC03Domain, ScriptListItem[]>(
    SAA_C03_DOMAINS.map((d) => [d, []]),
  );
  for (const s of scripts) {
    const primary = s.domains[0] as SaaC03Domain;
    (byDomain.get(primary) ?? byDomain.get(SAA_C03_DOMAINS[0])!).push(s);
  }
  for (const group of byDomain.values()) {
    group.sort((a, b) => a.service.localeCompare(b.service, "de"));
  }

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
            {scripts.length} Dienst-Skripte · CLF-Recap → SAA-Vertiefung →
            Prüfungs-Knackpunkte · freies Lesen, kein Fortschritt
          </p>
        </div>
        <Link href="/saa" className={linkBtn}>
          <ArrowLeft className="h-4 w-4 text-ink-faint" aria-hidden />
          Zum Dashboard
        </Link>
      </div>

      {SAA_C03_DOMAINS.map((domain) => {
        const group = byDomain.get(domain)!;
        if (group.length === 0) return null;
        const color = getDomainColor(domain);
        return (
          <section key={domain} className="mt-10">
            <div className="flex items-baseline gap-2.5">
              <span
                className="h-[9px] w-[9px] translate-y-px rounded-full"
                style={{ backgroundColor: color.solid }}
                aria-hidden
              />
              <h2 className="text-[15px] font-semibold text-ink">{domain}</h2>
              <span className="text-[12.5px] tabular-nums text-ink-faint">
                {group.length} Skripte
              </span>
            </div>

            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              {group.map((s) => (
                <Link
                  key={s.slug}
                  href={`/saa/skript/${s.slug}`}
                  className="flex overflow-hidden rounded-xl border border-line bg-surface transition hover:-translate-y-px hover:border-line-strong"
                >
                  <div
                    className="w-[4px] shrink-0"
                    style={{ backgroundColor: color.solid }}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3">
                    <span className="truncate text-[14.5px] font-medium text-ink">
                      {s.service}
                    </span>
                    {s.domains.length > 1 && (
                      <span className="flex shrink-0 gap-1">
                        {s.domains.slice(1).map((d) => (
                          <span
                            key={d}
                            title={d}
                            className={`rounded-full border px-1.5 py-px text-[10px] font-semibold ${getDomainColor(d).tag}`}
                          >
                            {domainCode(d)}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
