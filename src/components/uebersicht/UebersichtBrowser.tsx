"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
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
      <div className="sticky top-[45px] z-10 mt-8 rounded-2xl border border-zinc-200 bg-white/85 p-2.5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 focus-within:border-zinc-400">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dienst suchen … (z. B. „glue“ oder „a“)"
            aria-label="Dienst nach Namen suchen"
            className="w-full bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          />
          {query && (
            <span className="shrink-0 text-[13px] tabular-nums text-zinc-400">
              {filtered.length}
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-8 text-center text-[14.5px] text-zinc-500">
          Kein Dienst gefunden.
        </p>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {filtered.map((row) => (
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
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-[15.5px] font-semibold text-zinc-900">
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
      )}
    </>
  );
}
