// Single source for the Lernskript reading-area chapter accents. The reading
// pages read ONLY from here (as CSS custom properties) — no inline hex, no tint
// alpha maths. Distinct from domain-colors.ts (4 CLF quiz domains) and
// category-style.ts (12 service categories), both untouched.
//
// Each chapter: accent (full tone), accentSoft (chip/metaphor fill),
// tint (a whisper of the accent as page background).
import type { CSSProperties } from "react";

export type ChapterColor = { accent: string; accentSoft: string; tint: string };

export const CHAPTER_COLORS: Record<number, ChapterColor> = {
  1: { accent: "#0891b2", accentSoft: "#cdeff5", tint: "#e0f4f8" },
  2: { accent: "#7c3aed", accentSoft: "#e7d9fb", tint: "#f1e9fd" },
  3: { accent: "#059669", accentSoft: "#c9eddf", tint: "#e0f4ec" },
  4: { accent: "#4f46e5", accentSoft: "#dcd9fb", tint: "#ebe9fd" },
  5: { accent: "#0284c7", accentSoft: "#c9e6f9", tint: "#e0f0fc" },
  6: { accent: "#e11d48", accentSoft: "#f9d3dc", tint: "#fce8ee" },
  7: { accent: "#0d9488", accentSoft: "#cbeee8", tint: "#dff4f0" },
  8: { accent: "#c026d3", accentSoft: "#f3d2f8", tint: "#fae8fb" },
  9: { accent: "#2563eb", accentSoft: "#d2e0fc", tint: "#e6effe" },
  10: { accent: "#65a30d", accentSoft: "#deeebc", tint: "#eff7db" },
  11: { accent: "#9333ea", accentSoft: "#ebd7fb", tint: "#f4ecfd" },
  12: { accent: "#475569", accentSoft: "#dbe1e9", tint: "#edf1f5" },
  13: { accent: "#db2777", accentSoft: "#fad2e4", tint: "#fce7f1" },
};

// Neutral tone for the Deckblatt (no single chapter) and any unknown num.
const FALLBACK: ChapterColor = {
  accent: "#475569",
  accentSoft: "#eef1f5",
  tint: "#f8fafc",
};

export function chapterColor(num: number): ChapterColor {
  return CHAPTER_COLORS[num] ?? FALLBACK;
}

/** CSS custom properties for a chapter accent, spread onto a wrapper's style. */
export function chapterColorVars(num: number): CSSProperties {
  const c = chapterColor(num);
  return {
    "--accent": c.accent,
    "--accent-soft": c.accentSoft,
    "--tint": c.tint,
  } as CSSProperties;
}
