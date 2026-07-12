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

// Layered Apple-style shadow (same recipe as /cards) — reads as a physical card
// via elevation. Light only; dark mode gets elevation from surface brightness.
const CARD_SHADOW =
  "0 1px 1px hsl(220 20% 10% / 0.04), 0 2px 2px hsl(220 20% 10% / 0.04), 0 4px 8px hsl(220 20% 10% / 0.05), 0 8px 16px hsl(220 20% 10% / 0.05)";
const CARD_SHADOW_HOVER =
  "0 1px 1px hsl(220 20% 10% / 0.04), 0 2px 2px hsl(220 20% 10% / 0.04), 0 4px 8px hsl(220 20% 10% / 0.05), 0 12px 24px hsl(220 20% 10% / 0.08)";

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

  // Uniform token buttons (dark-safe); icon + label distinguish the actions.
  const btn =
    "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1 sm:flex-none">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dienste durchsuchen …"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">Alle Bereiche</option>
          {SERVICE_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <button type="button" onClick={onShuffle} className={btn}>
          <Shuffle className="h-4 w-4 text-ink-faint" aria-hidden />
          Mischen
        </button>
        <button type="button" onClick={onFlipAll} className={btn}>
          <RefreshCw className="h-4 w-4 text-ink-faint" aria-hidden />
          Alle umdrehen
        </button>
        <button type="button" onClick={onReset} className={btn}>
          <RotateCcw className="h-4 w-4 text-ink-faint" aria-hidden />
          Reset
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-ink">
          <span>
            Dienste gesamt: <span>{SERVICES.length}</span>
          </span>
          <span>
            Angezeigt: <span className="text-accent">{visible.length}</span> von{" "}
            {SERVICES.length}
          </span>
          <span>
            Umgedreht:{" "}
            <span style={{ color: "var(--success)" }}>{flippedVisibleCount}</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-faint">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden />
          Vorderseite = Dienst · Rückseite = Erklärung
        </span>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-faint">
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

            // Category badge + number header — repeated on both faces so each
            // side reads as a complete card during the 3D flip.
            const header = (
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
            );

            const stripe = (
              <div
                className="w-[5px] shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden
              />
            );

            return (
              // div[role=button] (not <button>): the back carries a real <Link>
              // (Skript deep link) and interactive elements must not nest in a
              // button. Whole card flips in 3D; hover lifts the scene 4px.
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
                className="group flip-scene relative h-[24rem] cursor-pointer rounded-xl transition-transform duration-150 ease-[cubic-bezier(.22,.9,.3,1)] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className={`flip-inner rounded-xl ${isFlipped ? "flipped" : ""}`}>
                  {/* FRONT — metaphor emoji + service name + mnemonic */}
                  <div
                    className="flip-face flex overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--card-shadow)] transition-shadow duration-150 group-hover:shadow-[var(--card-shadow-hover)] dark:shadow-none dark:group-hover:shadow-none"
                    style={
                      {
                        "--card-shadow": CARD_SHADOW,
                        "--card-shadow-hover": CARD_SHADOW_HOVER,
                      } as React.CSSProperties
                    }
                    aria-hidden={isFlipped}
                  >
                    {stripe}
                    <div className="flex min-w-0 flex-1 flex-col">
                      {header}
                      <div className="mx-5 shrink-0 border-t border-line" />
                      <div className="flex min-h-0 flex-1 flex-col p-5">
                        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-center">
                          <p className="text-[30px] leading-none" aria-hidden>
                            {eselEmoji}
                          </p>
                          <p className="text-lg font-bold leading-snug text-ink">
                            {c.title}
                          </p>
                          <p className="text-sm font-medium leading-snug text-ink-soft">
                            {eselText}
                          </p>
                          <p className="mt-1 text-sm italic leading-relaxed text-ink-faint">
                            {c.front}
                          </p>
                        </div>
                        <div className="mt-4 flex shrink-0 items-center justify-center gap-1 text-[11px] text-ink-faint">
                          <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                          Klicken für Antwort
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BACK — neutral surface; core text, partner chips, hint, deep link */}
                  <div
                    className="flip-face flip-back flex overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--card-shadow)] dark:bg-surface-2 dark:shadow-none"
                    style={{ "--card-shadow": CARD_SHADOW } as React.CSSProperties}
                    aria-hidden={!isFlipped}
                  >
                    {stripe}
                    <div className="flex min-w-0 flex-1 flex-col">
                      {header}
                      <div className="mx-5 shrink-0 border-t border-line" />
                      <div className="flex min-h-0 flex-1 flex-col p-5">
                        <h3 className="mb-2 shrink-0 text-xl font-bold leading-snug text-ink">
                          {c.title}
                        </h3>
                        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
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
                          <div className="mt-3 rounded-md border-l-2 border-amber-500 bg-amber-500/10 px-2.5 py-1.5">
                            <p className="text-[11.5px] leading-snug text-amber-700 dark:text-amber-300">
                              {c.hint}
                            </p>
                          </div>
                        </div>

                        {/* Deep link into the Lernskript chapter/section. Only
                            tab-focusable while this (back) face is showing. */}
                        <Link
                          href={skriptUrl(c.skriptRef)}
                          onClick={(e) => e.stopPropagation()}
                          tabIndex={isFlipped ? 0 : -1}
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

                        <div className="mt-2 flex shrink-0 items-center justify-center gap-1 text-[11px] text-ink-faint">
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                          Klicken zum Umdrehen
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
