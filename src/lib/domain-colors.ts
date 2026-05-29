// Explicit class strings per domain so Tailwind's content scanner keeps them.
// Do not concatenate `bg-${color}-100` — purge will drop unseen variants.

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
  },
};

export function getDomainColor(domain: string): DomainColor {
  return MAP[domain] ?? FALLBACK;
}
