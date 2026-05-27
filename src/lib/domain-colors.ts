// Explicit class strings per domain so Tailwind's content scanner keeps them.
// Do not concatenate `bg-${color}-100` — purge will drop unseen variants.

export type DomainColor = {
  tag: string;
  borderAccent: string;
  textAccent: string;
};

const FALLBACK: DomainColor = {
  tag: "bg-zinc-100 text-zinc-800 border-zinc-200",
  borderAccent: "border-l-zinc-400",
  textAccent: "text-zinc-600",
};

const MAP: Record<string, DomainColor> = {
  "Cloud Concepts": {
    tag: "bg-blue-100 text-blue-800 border-blue-200",
    borderAccent: "border-l-blue-600",
    textAccent: "text-blue-600",
  },
  "Security and Compliance": {
    tag: "bg-rose-100 text-rose-800 border-rose-200",
    borderAccent: "border-l-rose-600",
    textAccent: "text-rose-600",
  },
  "Cloud Technology and Services": {
    tag: "bg-violet-100 text-violet-800 border-violet-200",
    borderAccent: "border-l-violet-600",
    textAccent: "text-violet-600",
  },
  "Billing, Pricing, and Support": {
    tag: "bg-amber-100 text-amber-800 border-amber-200",
    borderAccent: "border-l-amber-600",
    textAccent: "text-amber-600",
  },
};

export function getDomainColor(domain: string): DomainColor {
  return MAP[domain] ?? FALLBACK;
}
