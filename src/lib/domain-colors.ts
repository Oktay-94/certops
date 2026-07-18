// Explicit class strings per domain so Tailwind's content scanner keeps them.
// Do not concatenate `bg-${color}-100` — purge will drop unseen variants.
import type { CSSProperties } from "react";

export type FallbackIconName = "Cloud" | "Shield" | "Server" | "DollarSign";

export type DomainColor = {
  tag: string;
  borderAccent: string;
  textAccent: string;
  iconBg: string;
  bgSoft: string;
  barTrack: string;
  barFill: string;
  textStrong: string;
  textMuted: string;
  fallbackIconName: FallbackIconName;
  // Single solid hex (the -600 hue). For inline SVG/style where a class won't
  // do and for dark mode, where the light bg-*-100 literals read too bright.
  // Matches the app's domain hues (Security = rose), not the mockup's red.
  solid: string;
};

const FALLBACK: DomainColor = {
  tag: "bg-zinc-100 text-zinc-800 border-zinc-200",
  borderAccent: "border-l-zinc-400",
  textAccent: "text-zinc-600",
  iconBg: "bg-zinc-500",
  bgSoft: "bg-zinc-50",
  barTrack: "bg-zinc-100",
  barFill: "bg-zinc-500",
  textStrong: "text-zinc-900",
  textMuted: "text-zinc-700",
  fallbackIconName: "Cloud",
  solid: "#71717a", // zinc-500
};

const MAP: Record<string, DomainColor> = {
  "Cloud Concepts": {
    tag: "bg-blue-100 text-blue-800 border-blue-200",
    borderAccent: "border-l-blue-600",
    textAccent: "text-blue-600",
    iconBg: "bg-blue-600",
    bgSoft: "bg-blue-50",
    barTrack: "bg-blue-100",
    barFill: "bg-blue-600",
    textStrong: "text-blue-900",
    textMuted: "text-blue-700",
    fallbackIconName: "Cloud",
    solid: "#2563eb", // blue-600
  },
  "Security and Compliance": {
    tag: "bg-rose-100 text-rose-800 border-rose-200",
    borderAccent: "border-l-rose-600",
    textAccent: "text-rose-600",
    iconBg: "bg-rose-600",
    bgSoft: "bg-rose-50",
    barTrack: "bg-rose-100",
    barFill: "bg-rose-600",
    textStrong: "text-rose-900",
    textMuted: "text-rose-700",
    fallbackIconName: "Shield",
    solid: "#e11d48", // rose-600
  },
  "Cloud Technology and Services": {
    tag: "bg-violet-100 text-violet-800 border-violet-200",
    borderAccent: "border-l-violet-600",
    textAccent: "text-violet-600",
    iconBg: "bg-violet-600",
    bgSoft: "bg-violet-50",
    barTrack: "bg-violet-100",
    barFill: "bg-violet-600",
    textStrong: "text-violet-900",
    textMuted: "text-violet-700",
    fallbackIconName: "Server",
    solid: "#7c3aed", // violet-600
  },
  "Billing, Pricing, and Support": {
    tag: "bg-amber-100 text-amber-900 border-amber-200",
    borderAccent: "border-l-amber-600",
    textAccent: "text-amber-600",
    iconBg: "bg-amber-600",
    bgSoft: "bg-amber-50",
    barTrack: "bg-amber-100",
    barFill: "bg-amber-600",
    textStrong: "text-amber-900",
    textMuted: "text-amber-700",
    fallbackIconName: "DollarSign",
    solid: "#d97706", // amber-600
  },
  // SAA-C03 — no domain colors in the mockups (statistik-v3 carries only the
  // CLF set); palette approved 2026-07-16: sky/emerald/fuchsia/amber, same
  // -600 ladder convention as CLF. Cost deliberately reuses the CLF billing
  // amber (same money semantics; the tracks never share a view).
  "Design Secure Architectures": {
    tag: "bg-sky-100 text-sky-800 border-sky-200",
    borderAccent: "border-l-sky-600",
    textAccent: "text-sky-600",
    iconBg: "bg-sky-600",
    bgSoft: "bg-sky-50",
    barTrack: "bg-sky-100",
    barFill: "bg-sky-600",
    textStrong: "text-sky-900",
    textMuted: "text-sky-700",
    fallbackIconName: "Shield",
    solid: "#0284c7", // sky-600
  },
  "Design Resilient Architectures": {
    tag: "bg-emerald-100 text-emerald-800 border-emerald-200",
    borderAccent: "border-l-emerald-600",
    textAccent: "text-emerald-600",
    iconBg: "bg-emerald-600",
    bgSoft: "bg-emerald-50",
    barTrack: "bg-emerald-100",
    barFill: "bg-emerald-600",
    textStrong: "text-emerald-900",
    textMuted: "text-emerald-700",
    fallbackIconName: "Cloud",
    solid: "#059669", // emerald-600
  },
  "Design High-Performing Architectures": {
    tag: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    borderAccent: "border-l-fuchsia-600",
    textAccent: "text-fuchsia-600",
    iconBg: "bg-fuchsia-600",
    bgSoft: "bg-fuchsia-50",
    barTrack: "bg-fuchsia-100",
    barFill: "bg-fuchsia-600",
    textStrong: "text-fuchsia-900",
    textMuted: "text-fuchsia-700",
    fallbackIconName: "Server",
    solid: "#c026d3", // fuchsia-600
  },
  "Design Cost-Optimized Architectures": {
    tag: "bg-amber-100 text-amber-900 border-amber-200",
    borderAccent: "border-l-amber-600",
    textAccent: "text-amber-600",
    iconBg: "bg-amber-600",
    bgSoft: "bg-amber-50",
    barTrack: "bg-amber-100",
    barFill: "bg-amber-600",
    textStrong: "text-amber-900",
    textMuted: "text-amber-700",
    fallbackIconName: "DollarSign",
    solid: "#d97706", // amber-600
  },
};

export function getDomainColor(domain: string): DomainColor {
  return MAP[domain] ?? FALLBACK;
}

/**
 * Accent CSS custom properties from a domain — same var recipe as
 * chapterColorVars(), so SkriptMarkdown and the reader shells draw
 * identically wherever a page is tinted by its primary domain.
 */
export function domainColorVars(domain: string): CSSProperties {
  const accent = getDomainColor(domain).solid;
  return {
    "--accent": accent,
    "--accent-soft": `color-mix(in srgb, ${accent} 16%, transparent)`,
    "--tint": "var(--canvas)",
  } as CSSProperties;
}
