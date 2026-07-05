import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { readUebersichtServices } from "@/lib/uebersicht-content";
import { letterOf, resolveServiceRef, sortKey } from "@/lib/uebersicht";
import { skriptUrl } from "@/lib/skript";
import { chapterColor } from "@/lib/skript-chapter-colors";

export const metadata = {
  title: "AWS-Dienste — Schnellübersicht — CertOps",
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Row = {
  name: string;
  deprecated: boolean;
  metaphor: string;
  signal: string;
  href: string;
  accent: string;
};

export default function UebersichtPage() {
  const services = readUebersichtServices()
    .slice()
    .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name), "de"));

  // Group into A–Z buckets (services are pre-sorted, so buckets stay contiguous).
  const groups = new Map<string, Row[]>();
  for (const s of services) {
    const ref = resolveServiceRef(s.name);
    // Neutral fallback accent when a row has no chapter (never expected — the
    // completeness test guards it), so the dot never disappears.
    const accent = ref ? chapterColor(ref.chapter).accent : "#475569";
    const row: Row = {
      name: s.name,
      deprecated: s.deprecated,
      metaphor: s.metaphor,
      signal: s.signal,
      href: ref ? skriptUrl(ref) : "/skript",
      accent,
    };
    const letter = letterOf(s.name);
    (groups.get(letter) ?? groups.set(letter, []).get(letter)!).push(row);
  }
  const present = new Set(groups.keys());

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
              {services.length} Dienste · alphabetisch · Metapher &amp; Signalwort,
              Deep-Link ins Skript
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

        {/* A–Z jump nav — sticky under the breadcrumb; empty letters muted. */}
        <nav
          aria-label="Alphabet-Sprungmarken"
          className="sticky top-[45px] z-10 mt-8 flex flex-wrap gap-1 rounded-2xl border border-zinc-200 bg-white/85 p-2.5 backdrop-blur-xl"
        >
          {ALPHABET.map((letter) =>
            present.has(letter) ? (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                {letter}
              </a>
            ) : (
              <span
                key={letter}
                aria-hidden
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-medium text-zinc-300"
              >
                {letter}
              </span>
            ),
          )}
        </nav>

        {/* Letter sections */}
        {[...groups.entries()].map(([letter, rows]) => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-[104px]">
            <h2 className="mt-10 mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-zinc-400">
              {letter}
            </h2>
            <ul className="space-y-2.5">
              {rows.map((row) => (
                <li key={row.name}>
                  <Link
                    href={row.href}
                    className="flex gap-3.5 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-px hover:border-zinc-400 hover:shadow-md"
                  >
                    <span
                      className="mt-[7px] h-[9px] w-[9px] shrink-0 rounded-full"
                      style={{ backgroundColor: row.accent }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[15.5px] font-semibold text-zinc-900">
                          {row.name}
                        </span>
                        {row.deprecated && (
                          <span className="rounded-md bg-amber-100 px-2 py-[2px] text-[11.5px] font-semibold text-amber-700">
                            abgekündigt
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-[14.5px] leading-snug text-zinc-700">
                        {row.metaphor}
                      </span>
                      <span className="mt-1 block text-[13px] italic leading-snug text-zinc-500">
                        {row.signal}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
