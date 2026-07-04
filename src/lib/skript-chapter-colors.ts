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
  1: { accent: "#475569", accentSoft: "#eef1f5", tint: "#f8fafc" },
  2: { accent: "#6d28d9", accentSoft: "#f1ecfb", tint: "#faf8fe" },
  3: { accent: "#047857", accentSoft: "#e8f5f0", tint: "#f5fbf9" },
  4: { accent: "#4338ca", accentSoft: "#ecedfb", tint: "#f7f8fe" },
  5: { accent: "#0369a1", accentSoft: "#e6f2fa", tint: "#f4fafd" },
  6: { accent: "#be123c", accentSoft: "#fceef1", tint: "#fdf6f8" },
  7: { accent: "#0e7490", accentSoft: "#ecf7f8", tint: "#f6fbfb" },
  8: { accent: "#a21caf", accentSoft: "#fbedfa", tint: "#fdf7fd" },
  9: { accent: "#1d4ed8", accentSoft: "#e9eefc", tint: "#f5f8fe" },
  10: { accent: "#4d7c0f", accentSoft: "#f0f6e6", tint: "#f9fbf4" },
  11: { accent: "#7e22ce", accentSoft: "#f3e9fb", tint: "#faf6fe" },
  12: { accent: "#57534e", accentSoft: "#f1efee", tint: "#faf9f8" },
  13: { accent: "#be185d", accentSoft: "#fceef4", tint: "#fdf6fa" },
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
