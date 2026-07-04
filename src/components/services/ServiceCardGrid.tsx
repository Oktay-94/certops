"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Lightbulb,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Search,
  Shuffle,
} from "lucide-react";
import { SERVICES, SERVICE_DOMAINS, type ServiceCard } from "@/lib/services-data";
import { categoryStyle, tint } from "@/lib/category-style";
import { skriptUrl } from "@/lib/skript";

function shuffleInPlace<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function haystack(c: ServiceCard): string {
  return [c.title, c.front, c.core, c.domain, c.eselsbruecke, ...c.partners]
    .join(" ")
    .toLowerCase();
}

export function ServiceCardGrid() {
  const initialOrder = useMemo(() => SERVICES.map((s) => s.num), []);
  const byNum = useMemo(() => {
    const m = new Map<number, ServiceCard>();
    for (const s of SERVICES) m.set(s.num, s);
    return m;
  }, []);

  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("all");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [order, setOrder] = useState<number[]>(initialOrder);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return order
      .map((n) => byNum.get(n))
      .filter((c): c is ServiceCard => !!c)
      .filter((c) => (domain === "all" ? true : c.domain === domain))
      .filter((c) => (q === "" ? true : haystack(c).includes(q)));
  }, [order, byNum, domain, query]);

  const flippedVisibleCount = useMemo(
    () => visible.reduce((n, c) => n + (flipped.has(c.num) ? 1 : 0), 0),
    [visible, flipped],
  );

  function onShuffle() {
    setOrder((prev) => shuffleInPlace(prev));
  }

  function onFlipAll() {
    setFlipped((prev) => {
      const next = new Set(prev);
      const anyOpen = visible.some((c) => next.has(c.num));
      if (anyOpen) {
        for (const c of visible) next.delete(c.num);
      } else {
        for (const c of visible) next.add(c.num);
      }
      return next;
    });
  }

  function onReset() {
    setQuery("");
    setDomain("all");
    setFlipped(new Set());
    setOrder(initialOrder);
  }

  function toggleCard(num: number) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }

  const btnBase =
    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50";
  const btnShuffle = `${btnBase} border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200`;
  const btnFlipAll = `${btnBase} border-violet-200 bg-violet-100 text-violet-800 hover:bg-violet-200`;
  const btnReset = `${btnBase} border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200`;

  return (
    <div className="mt-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1 sm:flex-none">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dienste durchsuchen …"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition hover:border-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Alle Bereiche</option>
          {SERVICE_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <button type="button" onClick={onShuffle} className={btnShuffle}>
          <Shuffle className="h-4 w-4" aria-hidden />
          Mischen
        </button>
        <button type="button" onClick={onFlipAll} className={btnFlipAll}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Alle umdrehen
        </button>
        <button type="button" onClick={onReset} className={btnReset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="text-zinc-900">
            Dienste gesamt: <span className="text-zinc-900">{SERVICES.length}</span>
          </span>
          <span className="text-zinc-900">
            Angezeigt:{" "}
            <span className="text-blue-600">{visible.length}</span> von{" "}
            {SERVICES.length}
          </span>
          <span className="text-zinc-900">
            Umgedreht:{" "}
            <span className="text-emerald-600">{flippedVisibleCount}</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Lightbulb className="h-3.5 w-3.5 text-amber-600" aria-hidden />
          Vorderseite = Dienst · Rückseite = Erklärung
        </span>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          Keine Dienste gefunden.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((c) => {
            const isFlipped = flipped.has(c.num);
            const { color, Icon } = categoryStyle(c.domain);
            // Presentational split: leading emoji shown large, mnemonic text below.
            const eselEmoji = c.eselsbruecke.split(" ")[0];
            const eselText = c.eselsbruecke.split(" ").slice(1).join(" ");
            return (
              // div[role=button] instead of <button>: the back carries a real
              // <Link> (Skript deep link) and interactive elements must not
              // nest. Enter/Space keep the keyboard flip working.
              <div
                key={c.num}
                role="button"
                tabIndex={0}
                aria-pressed={isFlipped}
                onClick={() => toggleCard(c.num)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCard(c.num);
                  }
                }}
                className="flex h-[24rem] cursor-pointer overflow-hidden rounded-[18px] border border-zinc-200 bg-white text-left shadow-[0_18px_40px_-12px_rgba(24,24,27,0.22),0_6px_14px_-6px_rgba(24,24,27,0.12)] transition hover:shadow-[0_24px_50px_-12px_rgba(24,24,27,0.28),0_8px_18px_-6px_rgba(24,24,27,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
              >
                {/* Left category stripe — clipped into the card rounding */}
                <div
                  className="w-[5px] shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />

                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Header: category label (icon + name) left, number right */}
                  <div className="flex shrink-0 items-center justify-between gap-2 px-5 pb-3.5 pt-5">
                    <span
                      className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                      style={{ backgroundColor: tint(color, "14"), color }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{c.domain}</span>
                    </span>
                    <span
                      className="shrink-0 text-sm font-bold tabular-nums"
                      style={{ color }}
                    >
                      {c.num}.
                    </span>
                  </div>

                  <div className="mx-5 shrink-0 border-t border-zinc-200" />

                  {isFlipped ? (
                    /* BACK — core, 🔗 partner chips (category-tinted), hint box */
                    <div className="flex min-h-0 flex-1 flex-col p-5">
                      <h3 className="mb-2 shrink-0 text-xl font-bold leading-snug text-zinc-900">
                        {c.title}
                      </h3>
                      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                          {c.core}
                        </p>
                        {c.partners.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {c.partners.map((p) => (
                              <span
                                key={p}
                                className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                                style={{
                                  backgroundColor: tint(color, "14"),
                                  color,
                                  borderColor: tint(color, "33"),
                                }}
                              >
                                🔗 {p}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 rounded-md border-l-2 border-amber-500 bg-amber-100 px-2.5 py-1.5">
                          <p className="text-[11.5px] leading-snug text-amber-900">
                            {c.hint}
                          </p>
                        </div>
                      </div>

                      {/* Deep link into the Lernskript chapter/section */}
                      <Link
                        href={skriptUrl(c.skriptRef)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition hover:opacity-75"
                        style={{
                          backgroundColor: tint(color, "14"),
                          color,
                          borderColor: tint(color, "33"),
                        }}
                      >
                        <BookOpen className="h-3.5 w-3.5" aria-hidden />
                        Im Skript lesen
                      </Link>

                      {/* Flip hint */}
                      <div className="mt-2 flex shrink-0 items-center justify-center gap-1 text-[11px] text-zinc-400">
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        Klicken zum Umdrehen
                      </div>
                    </div>
                  ) : (
                    /* FRONT — big metaphor emoji center, then service name + mnemonic */
                    <div className="flex min-h-0 flex-1 flex-col p-5">
                      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
                        <p className="text-5xl leading-none">{eselEmoji}</p>
                        <p className="text-lg font-bold leading-snug text-zinc-900">
                          {c.title}
                        </p>
                        <p className="text-sm font-medium leading-snug text-zinc-700">
                          {eselText}
                        </p>
                        <p className="mt-1 text-sm italic leading-relaxed text-zinc-500">
                          {c.front}
                        </p>
                      </div>

                      {/* Flip hint */}
                      <div className="mt-4 flex shrink-0 items-center justify-center gap-1 text-[11px] text-zinc-400">
                        <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                        Klicken für Antwort
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
