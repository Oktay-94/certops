// Single source for the Lernskript reading-area chapter accents. The reading
// pages read ONLY from here (as CSS custom properties) — no inline hex, no tint
// alpha maths. Distinct from domain-colors.ts (4 CLF quiz domains) and
// category-style.ts (12 service categories), both untouched.
//
// Each chapter: accent (full tone), accentSoft (chip/metaphor fill),
// tint (page background). The tinted page surface was pulled back to a single
// neutral zinc across all chapters — the flat colour wash distracted from the
// reading flow. Orientation now comes from the accent dots only (eyebrow text,
// metaphor border, list markers, chip borders), not a full-bleed area.
import type { CSSProperties } from "react";

// Shared neutral page surface (very light zinc). A whisper above pure white so
// the white chip containers keep a visible edge.
const NEUTRAL_TINT = "#fafafa";

export type ChapterColor = { accent: string; accentSoft: string; tint: string };

export const CHAPTER_COLORS: Record<number, ChapterColor> = {
  1: { accent: "#0891b2", accentSoft: "#cdeff5", tint: NEUTRAL_TINT },
  2: { accent: "#7c3aed", accentSoft: "#e7d9fb", tint: NEUTRAL_TINT },
  3: { accent: "#059669", accentSoft: "#c9eddf", tint: NEUTRAL_TINT },
  4: { accent: "#4f46e5", accentSoft: "#dcd9fb", tint: NEUTRAL_TINT },
  5: { accent: "#0284c7", accentSoft: "#c9e6f9", tint: NEUTRAL_TINT },
  6: { accent: "#e11d48", accentSoft: "#f9d3dc", tint: NEUTRAL_TINT },
  7: { accent: "#0d9488", accentSoft: "#cbeee8", tint: NEUTRAL_TINT },
  8: { accent: "#c026d3", accentSoft: "#f3d2f8", tint: NEUTRAL_TINT },
  9: { accent: "#2563eb", accentSoft: "#d2e0fc", tint: NEUTRAL_TINT },
  10: { accent: "#65a30d", accentSoft: "#deeebc", tint: NEUTRAL_TINT },
  11: { accent: "#9333ea", accentSoft: "#ebd7fb", tint: NEUTRAL_TINT },
  12: { accent: "#475569", accentSoft: "#dbe1e9", tint: NEUTRAL_TINT },
  13: { accent: "#db2777", accentSoft: "#fad2e4", tint: NEUTRAL_TINT },
};

// Neutral tone for the Deckblatt (no single chapter) and any unknown num.
const FALLBACK: ChapterColor = {
  accent: "#475569",
  accentSoft: "#eef1f5",
  tint: NEUTRAL_TINT,
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
