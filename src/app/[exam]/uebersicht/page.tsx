import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { readUebersichtServices } from "@/lib/uebersicht-content";
import { resolveServiceRef, serviceEmoji } from "@/lib/uebersicht";
import { sortKey } from "@/lib/uebersicht-search";
import { skriptUrl } from "@/lib/skript";
import { chapterColor } from "@/lib/skript-chapter-colors";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import {
  UebersichtBrowser,
  type UebersichtRow,
} from "@/components/uebersicht/UebersichtBrowser";

export const metadata = {
  title: "AWS-Dienste — Schnellübersicht — CertOps",
};

// CLF-only: die Dienste-Übersicht gehört zum CLF-Track — /saa/uebersicht 404t.
export default async function UebersichtPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  if ((await params).exam !== "clf") notFound();
  // Build-time data: sort, then resolve emoji / deep-link / accent per service.
  // The client component only filters this array.
  const rows: UebersichtRow[] = readUebersichtServices()
    .slice()
    .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name), "de"))
    .map((s) => {
      const ref = resolveServiceRef(s.name);
      return {
        name: s.name,
        emoji: serviceEmoji(s.name),
        deprecated: s.deprecated,
        metaphor: s.metaphor,
        signal: s.signal,
        href: ref ? skriptUrl(ref) : "/skript",
        // Neutral fallback (never expected — completeness test guards it).
        accent: ref ? chapterColor(ref.chapter).accent : "#475569",
        key: sortKey(s.name),
      };
    });

  return (
    <div className="relative min-h-screen">
      <ScrollBackground />

      {/* Sticky breadcrumb — same blur/token family as the skript reader. */}
      <div className="sticky top-0 z-20 border-b border-line bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[760px] items-center gap-2.5 px-6 py-3 text-[13.5px] text-ink-soft">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full"
            style={{ background: "var(--orange-bright)" }}
            aria-hidden
          />
          <Link href="/clf" className="transition-colors hover:text-ink">
            Dashboard
          </Link>
          <span aria-hidden>›</span>
          <span className="truncate text-ink">Dienste-Schnellübersicht</span>
        </div>
      </div>

      <main className="relative mx-auto max-w-[760px] px-6 pb-24">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 pt-12 sm:pt-14">
          <div>
            <div className="mb-3.5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              <span className="h-px w-8 bg-line-strong" aria-hidden />
              🔍 Dienste-Schnellübersicht
            </div>
            <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
              Dienste-Schnellübersicht
            </h1>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
              {rows.length} Dienste · Metapher &amp; Signalwort, Deep-Link ins
              Skript
            </p>
          </div>
          <Link
            href="/clf"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong"
          >
            <ArrowLeft className="h-4 w-4 text-ink-faint" aria-hidden />
            Zum Dashboard
          </Link>
        </header>

        <UebersichtBrowser rows={rows} />
      </main>
    </div>
  );
}
