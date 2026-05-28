"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Lightbulb,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Search,
  Shuffle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getDomainColor } from "@/lib/domain-colors";
import { FlashcardIcon } from "@/components/flashcards/FlashcardIcon";
import { markFlashcardSeen, resetFlashcardViews } from "./actions";

const MARKDOWN_COMPONENTS = {
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-4" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-4" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-zinc-100 px-1 text-[13px]" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-zinc-800" {...props} />
  ),
};

const MARKDOWN_ALLOWED = ["p", "strong", "em", "ul", "ol", "li", "code"];

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
  const displayNumberById = useMemo(() => {
    const m = new Map<number, number>();
    cards.forEach((c, i) => m.set(c.id, i + 1));
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
    void resetFlashcardViews().catch(() => {});
  }

  function toggleCard(id: number) {
    const wasUnflipped = !flipped.has(id);
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (wasUnflipped) {
      void markFlashcardSeen(id).catch(() => {});
    }
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
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="text-zinc-900">
            Karten gesamt:{" "}
            <span className="text-zinc-900">{cards.length}</span>
          </span>
          <span className="text-zinc-900">
            Angezeigt:{" "}
            <span className="text-blue-600">{visible.length}</span>
          </span>
          <span className="text-zinc-900">
            Umgedreht:{" "}
            <span className="text-emerald-600">{flippedVisibleCount}</span>
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
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((c) => {
            const isFlipped = flipped.has(c.id);
            const color = getDomainColor(c.domain);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCard(c.id)}
                className={`flex h-80 flex-col rounded-xl border border-l-4 border-zinc-200 ${color.borderAccent} bg-white p-4 text-left transition hover:border-zinc-400`}
              >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-2 border-b-[0.5px] border-zinc-200 pb-2.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${color.tag}`}
                  >
                    {c.domain}
                  </span>
                  <span className="text-[15px] font-bold text-zinc-900">
                    #{displayNumberById.get(c.id)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex min-h-0 flex-1 flex-col">
                  {isFlipped ? (
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="my-2.5 shrink-0 rounded-md border-l-2 border-amber-500 bg-amber-100 px-2.5 py-1.5">
                        <p className="text-[11.5px] leading-snug text-amber-900">
                          {c.front}
                        </p>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto pr-1 text-sm leading-relaxed text-zinc-800">
                        <ReactMarkdown
                          allowedElements={MARKDOWN_ALLOWED}
                          unwrapDisallowed
                          components={MARKDOWN_COMPONENTS}
                        >
                          {c.back}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3.5 py-2.5">
                      <FlashcardIcon
                        iconSlugs={c.iconSlugs}
                        domain={c.domain}
                        variant="hero"
                      />
                      <p className="whitespace-pre-wrap text-center text-[15px] font-semibold leading-relaxed text-zinc-900">
                        {c.front}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  className={`flex shrink-0 items-center gap-1 border-t-[0.5px] border-zinc-200 pt-2.5 text-[11px] italic ${color.textAccent}`}
                >
                  {isFlipped ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      Klicken zum Umdrehen
                    </>
                  ) : (
                    <>
                      <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                      Klicken für Antwort
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
