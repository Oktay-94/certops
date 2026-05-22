"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Flashcard } from "@/db/schema";

type Card = Pick<Flashcard, "id" | "cert" | "domain" | "front" | "back">;

export function FlashcardDeck({ cards }: { cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];
  const total = cards.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const flip = useCallback(() => setFlipped((f) => !f), []);
  const goPrev = useCallback(() => {
    setIndex((i) => (i === 0 ? i : i - 1));
    setFlipped(false);
  }, []);
  const goNext = useCallback(() => {
    setIndex((i) => (i >= total - 1 ? i : i + 1));
    setFlipped(false);
  }, [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
        return;
      }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "n") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, goNext, goPrev]);

  return (
    <article>
      <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700">
          {card.domain}
        </span>
        <span>{card.cert}</span>
        <span className="ml-auto tabular-nums text-zinc-600">
          Karte {index + 1} von {total}
        </span>
      </div>

      <button
        type="button"
        onClick={flip}
        aria-label={flipped ? "Vorderseite anzeigen" : "Rückseite anzeigen"}
        className="relative mt-6 block w-full min-h-[16rem] cursor-pointer [perspective:1000px]"
      >
        <div
          className={`relative h-full min-h-[16rem] w-full transition-transform duration-300 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 text-center text-lg leading-relaxed text-zinc-900 [backface-visibility:hidden]">
            {card.front}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-base leading-relaxed text-zinc-800 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {card.back}
          </div>
        </div>
      </button>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirst}
          className="inline-block rounded-xl border border-zinc-300 px-6 py-3 text-center text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          ‹ Zurück
        </button>
        <button
          type="button"
          onClick={flip}
          className="inline-block rounded-xl bg-zinc-900 px-6 py-3 text-center text-white transition hover:bg-zinc-800"
        >
          Umdrehen
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={isLast}
          className="inline-block rounded-xl border border-zinc-300 px-6 py-3 text-center text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Weiter ›
        </button>
      </div>

      {isLast && (
        <p className="mt-4 text-sm text-zinc-500">
          Alle Karten durch — zurückblättern oder zum Dashboard.
        </p>
      )}

      <p className="mt-6 text-xs text-zinc-500">
        Tasten: Leertaste / Enter umdrehen · ← / → blättern · N nächste
      </p>

      <Link
        href="/"
        className="mt-10 inline-block rounded-xl border border-zinc-300 px-6 py-3 text-center text-zinc-900 transition hover:bg-zinc-100"
      >
        Zurück zum Dashboard
      </Link>
    </article>
  );
}
