"use client";

import { useCallback } from "react";
import { BRAND_ORANGE } from "@/lib/brand";

// Certificate tile for the passed state (mockup #view-clf .cert). Confetti
// loads lazily on first click — canvas-confetti costs 0 KB until then.
// Palette from the mockup fireConfetti() (brand orange via single source).
const CONFETTI_COLORS = [
  BRAND_ORANGE,
  "#FF9900",
  "#16a34a",
  "#0891b2",
  "#232F3E",
];

export function CertTile() {
  const fire = useCallback(async () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 110,
      spread: 75,
      gravity: 0.9,
      origin: { y: 0.35 },
      colors: CONFETTI_COLORS,
    });
  }, []);

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={fire}
        title="Klick mich"
        aria-label="Konfetti abfeuern"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[26px] font-extrabold transition-transform hover:scale-106"
        style={{
          background: "var(--success-soft)",
          color: "var(--success)",
          border:
            "1.5px solid color-mix(in srgb, var(--success) 45%, transparent)",
        }}
      >
        ✓
      </button>
      <div>
        <h2 className="text-xl font-bold text-ink">
          AWS Certified Cloud Practitioner
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          CLF-C02 bestanden. Quiz, Karten und Statistik laufen im Archiv-Modus
          weiter — nichts geht verloren.
        </p>
        <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
          Bestanden · Juli 2026 · Klick aufs Siegel 🎉
        </div>
      </div>
    </div>
  );
}
