"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { matchesQuery } from "@/lib/uebersicht-search";

// Fully build-time data — the server computes emoji/href/accent/key once and
// passes plain rows down. Only the prefix filter runs in the client; no data
// fetch, no JSON in the browser bundle.
export type UebersichtRow = {
  name: string;
  emoji: string | null;
  deprecated: boolean;
  metaphor: string;
  signal: string;
  href: string;
  accent: string;
  /** Sort key (name without Amazon/AWS prefix) — the prefix-search target. */
  key: string;
};

export function UebersichtBrowser({ rows }: { rows: UebersichtRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => rows.filter((r) => matchesQuery(r.key, query)),
    [rows, query],
  );

  return (
    <>
      {/* Prefix search — replaces the A–Z jump bar. Sticky under the breadcrumb. */}
      <div className="sticky top-[45px] z-10 mt-8 rounded-2xl border border-line bg-surface/85 p-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 transition-colors focus-within:border-accent">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dienst suchen … (z. B. „glue“ oder „a“)"
            aria-label="Dienst nach Namen suchen"
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {query && (
            <span className="shrink-0 text-[13px] tabular-nums text-ink-faint">
              {filtered.length}
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-8 text-center text-[14.5px] text-ink-faint">
          Kein Dienst gefunden.
        </p>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {filtered.map((row) => (
            <li key={row.name}>
              <Link
                href={row.href}
                className="group flex items-start gap-3.5 rounded-2xl border border-line bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_20px_-14px_rgba(24,24,27,0.10)] transition hover:-translate-y-px hover:border-line-strong dark:shadow-none"
              >
                <span
                  className="mt-[7px] h-[9px] w-[9px] shrink-0 rounded-full"
                  style={{ backgroundColor: row.accent }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-[15.5px] font-semibold text-ink">
                      {row.emoji && (
                        <span
                          aria-hidden
                          className="mr-2 text-[22px] leading-none [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.06))]"
                        >
                          {row.emoji}
                        </span>
                      )}
                      {row.name}
                    </span>
                    {row.deprecated && (
                      <span className="rounded-md bg-amber-500/15 px-2 py-[2px] text-[11.5px] font-semibold text-amber-700 dark:text-amber-300">
                        abgekündigt
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[14.5px] leading-snug text-ink-soft">
                    {row.metaphor}
                  </span>
                  <span className="mt-1 block text-[13px] italic leading-snug text-ink-faint">
                    {row.signal}
                  </span>
                </span>
                <ChevronRight
                  className="mt-[3px] h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
