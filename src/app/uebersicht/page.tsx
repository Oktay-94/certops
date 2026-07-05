import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { readUebersichtServices } from "@/lib/uebersicht-content";
import { resolveServiceRef, serviceEmoji } from "@/lib/uebersicht";
import { sortKey } from "@/lib/uebersicht-search";
import { skriptUrl } from "@/lib/skript";
import { chapterColor } from "@/lib/skript-chapter-colors";
import {
  UebersichtBrowser,
  type UebersichtRow,
} from "@/components/uebersicht/UebersichtBrowser";

export const metadata = {
  title: "AWS-Dienste — Schnellübersicht — CertOps",
};

export default function UebersichtPage() {
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
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sticky breadcrumb — same blur/token family as the skript reader. */}
      <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[760px] items-center gap-2.5 px-6 py-3 text-[13.5px] text-zinc-500">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#ED7100]"
            aria-hidden
          />
          <Link href="/" className="transition hover:text-zinc-900">
            Dashboard
          </Link>
          <span aria-hidden>›</span>
          <span className="truncate text-zinc-900">Dienste-Schnellübersicht</span>
        </div>
      </div>

      <main className="mx-auto max-w-[760px] px-6 pb-24">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 pt-12 sm:pt-14">
          <div>
            <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-zinc-900 sm:text-4xl">
              Dienste-Schnellübersicht
            </h1>
            <p className="mt-3 text-zinc-600">
              {rows.length} Dienste · Metapher &amp; Signalwort, Deep-Link ins
              Skript
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Zum Dashboard
          </Link>
        </header>

        <UebersichtBrowser rows={rows} />
      </main>
    </div>
  );
}
