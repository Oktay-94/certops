// Design tokens — TypeScript mirror for JS consumers (charts, SVG configs in
// later phases). THE RENDER SOURCE IS globals.css — keep both in sync manually.
// Values are extracted 1:1 from design/mockups/certops-redesign-v2.html.
//
// Two orthogonal axes (the mockup couples them; the app decouples them):
//   data-theme (light/dark)  → surface/ink/heat LADDERS
//   data-exam  (clf/saa)     → ACCENT identity
// Canonical, mockup-faithful combos: clf×light and saa×dark. The other two
// combos derive --accent-soft via color-mix in globals.css until designed.

/** Shared across all themes/exams (mockup :root). */
export const SHARED = {
  radiusCard: "12px",
  radiusBtn: "8px",
  radiusPill: "999px",
  spacing: ["4px", "8px", "12px", "16px", "24px", "48px"],
  motionFast: "140ms",
  motionMed: "200ms",
  orange: "#ED7100", // AWS "Smile" — signal only (single source: brand.ts)
  orangeBright: "#FF9900", // brand anchor, sparingly
  teal: "#01A88D", // AWS "Orbit" — mastered/success dark
} as const;

/** data-theme="light" ladder (mockup body[data-exam="clf"] block). */
export const THEME_LIGHT = {
  canvas: "#fafafa",
  surface: "#ffffff",
  surface2: "#f4f4f5",
  border: "#e7e7e9",
  borderStrong: "#d9d9dc",
  ink: "#17181a",
  inkSoft: "#55585f",
  inkFaint: "#a4a7ad",
  success: "#16a34a",
  successSoft: "#e8f7ee",
  gridLine: "rgba(35,47,62,.06)", // theme-scoped since 2b (diagramm-quiz)
  heat: ["#f0f0f1", "#d5eee3", "#9fdcc0", "#4cbe8b", "#16a34a"],
  ctaInk: "#1a1204",
} as const;

/** data-theme="dark" ladder — Squid-Ink, luminance stacking (mockup saa block). */
export const THEME_DARK = {
  canvas: "#141a24",
  surface: "#1b2330",
  surface2: "#222c3b",
  border: "rgba(255,255,255,.07)",
  borderStrong: "rgba(255,255,255,.14)",
  ink: "#eef2f7",
  inkSoft: "#9fadc0",
  inkFaint: "#5c6a7e",
  success: "#2bbf9e",
  successSoft: "rgba(1,168,141,.14)",
  gridLine: "rgba(255,255,255,.045)",
  heat: [
    "rgba(255,255,255,.05)",
    "rgba(255,255,255,.13)",
    "rgba(255,255,255,.26)",
    "rgba(255,255,255,.48)",
    "rgba(255,255,255,.8)",
  ],
  ctaInk: "#1a1204",
} as const;

/** data-exam accent identities. Domain colors stay in domain-colors.ts. */
export const EXAM_ACCENTS = {
  clf: { accent: "#0891b2", accentSoftLight: "#e0f5fa" },
  saa: { accent: "#7d93c9", accentSoftDark: "rgba(125,147,201,.14)" },
} as const;
