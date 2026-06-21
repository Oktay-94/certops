// Single source of truth for the three /services practice-mode accents, used by
// the mode cards (top stripe + icon tile) AND their gradient "start" buttons.
//
// Each mode stores `base` (600 tone) + `hover` (700 tone). The hover tone is a
// deliberate Tailwind-700 value, not an arithmetic darkening of `base` — a naive
// multiply wouldn't land on it, and the Variant-B gradient needs the exact 700
// tone anyway. The glow colour is *derived* from `base` via tint(), so it is not
// a third scattered source. Colours are arbitrary hex → applied via inline style
// / CSS custom properties (nothing for Tailwind to purge).
import { GraduationCap, Puzzle, Swords, type LucideIcon } from "lucide-react";
import { tint } from "@/lib/category-style";

export type ModeStyle = { base: string; hover: string; Icon: LucideIcon };

export const MODE_STYLE = {
  quiz: { base: "#2563eb", hover: "#1d4ed8", Icon: GraduationCap },
  battle: { base: "#e11d48", hover: "#be123c", Icon: Swords },
  puzzle: { base: "#7c3aed", hover: "#6d28d9", Icon: Puzzle },
} as const satisfies Record<string, ModeStyle>;

export type ModeKey = keyof typeof MODE_STYLE;

// CSS custom properties for the .mode-start-btn gradient + shine sweep. Glow is
// `base` at 0.40 alpha (0x66) — derived, never hardcoded per mode.
export function modeButtonVars(mode: ModeKey): React.CSSProperties {
  const { base, hover } = MODE_STYLE[mode];
  return {
    "--mode-bg": base,
    "--mode-bg-hover": hover,
    "--mode-glow": tint(base, "66"),
  } as React.CSSProperties;
}
