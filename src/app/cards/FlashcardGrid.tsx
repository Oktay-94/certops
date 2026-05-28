"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Lightbulb,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Search,
  Shuffle,
} from "lucide-react";
import { getDomainColor } from "@/lib/domain-colors";
import { FlashcardIcon } from "@/components/flashcards/FlashcardIcon";

export type FlashcardItem = {
  id: number;
  cert: string;
  domain: string;
  front: string;
  back: string;
  iconSlugs: string[] | null;
};

type Props = {
  cards: FlashcardItem[];
  domains: string[];
};

function shuffleInPlace<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function FlashcardGrid({ cards, domains }: Props) {
  const initialOrder = useMemo(() => cards.map((c) => c.id), [cards]);
  const byId = useMemo(() => {
    const m = new Map<number, FlashcardItem>();
    for (const c of cards) m.set(c.id, c);
    return m;
  }, [cards]);

  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("all");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [order, setOrder] = useState<number[]>(initialOrder);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return order
      .map((id) => byId.get(id))
      .filter((c): c is FlashcardItem => !!c)
      .filter((c) => (domain === "all" ? true : c.domain === domain))
      .filter((c) =>
        q === "" ? true : (c.front + " " + c.back).toLowerCase().includes(q),
      );
  }, [order, byId, domain, query]);

  const flippedVisibleCount = useMemo(
    () => visible.reduce((n, c) => n + (flipped.has(c.id) ? 1 : 0), 0),
    [visible, flipped],
  );

  function onShuffle() {
    setOrder((prev) => shuffleInPlace(prev));
  }

  function onFlipAll() {
    setFlipped((prev) => {
      const next = new Set(prev);
      const anyOpen = visible.some((c) => next.has(c.id));
      if (anyOpen) {
        for (const c of visible) next.delete(c.id);
      } else {
        for (const c of visible) next.add(c.id);
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

  function toggleCard(id: number) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Equal-height: measure all card wrappers, apply max as inline style.
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [cardHeight, setCardHeight] = useState<number | null>(null);

  const measure = useCallback(() => {
    let max = 0;
    for (const c of visible) {
      const el = cardRefs.current.get(c.id);
      if (!el) continue;
      // Temporär Inline-Höhe entfernen, um die natürliche Höhe zu messen.
      const prev = el.style.height;
      el.style.height = "auto";
      const h = el.offsetHeight;
      el.style.height = prev;
      if (h > max) max = h;
    }
    if (max > 0) setCardHeight(max);
  }, [visible]);

  useLayoutEffect(() => {
    measure();
  }, [measure, flipped]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  function setCardRef(id: number, el: HTMLButtonElement | null) {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }

  const btnBase =
    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50";
  const btnZinc = `${btnBase} border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400`;
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
            placeholder="Karten durchsuchen …"
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition hover:border-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Alle Bereiche</option>
          {domains.map((d) => (
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
        <Link href="/" className={btnZinc}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Zum Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="text-zinc-600">
            Karten gesamt:{" "}
            <span className="font-medium text-zinc-900">{cards.length}</span>
          </span>
          <span className="text-zinc-600">
            Angezeigt:{" "}
            <span className="font-medium text-blue-600">{visible.length}</span>
          </span>
          <span className="text-zinc-600">
            Umgedreht:{" "}
            <span className="font-medium text-emerald-600">
              {flippedVisibleCount}
            </span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Lightbulb className="h-3.5 w-3.5 text-amber-600" aria-hidden />
          Vorderseite = Frage · Rückseite = Antwort
        </span>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          Keine Karten gefunden.
        </p>
      ) : (
        <div
          ref={gridRef}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {visible.map((c) => {
            const isFlipped = flipped.has(c.id);
            const color = getDomainColor(c.domain);
            return (
              <button
                key={c.id}
                ref={(el) => setCardRef(c.id, el)}
                type="button"
                onClick={() => toggleCard(c.id)}
                style={cardHeight ? { height: `${cardHeight}px` } : undefined}
                className={`flex min-h-[180px] flex-col rounded-xl border border-l-4 border-zinc-200 ${color.borderAccent} bg-white p-4 text-left transition hover:border-zinc-400`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${color.tag}`}
                  >
                    {c.domain}
                  </span>
                  <FlashcardIcon iconSlugs={c.iconSlugs} domain={c.domain} />
                </div>
                <hr className="my-3 border-zinc-200" />
                {isFlipped ? (
                  <div className="flex flex-1 flex-col rounded-lg bg-zinc-50 p-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                      {c.back}
                    </p>
                    <div className="mt-auto flex justify-end pt-2 text-xs text-zinc-400">
                      #{c.id}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col">
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-900">
                      {c.front}
                    </p>
                    <div
                      className={`mt-3 flex items-center justify-between gap-2 text-xs ${color.textAccent}`}
                    >
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                        Klicken für Antwort
                      </span>
                      <span className="text-zinc-400">#{c.id}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
