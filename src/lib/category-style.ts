// Single source of truth for the 12 service-category visuals: one distinct
// colour + one lucide icon per category. Used by the service cards, the Puzzle
// modal, and the Battle/Quiz category badges.
//
// Colours are arbitrary hex (not Tailwind palette tones), so consumers apply
// them via inline `style` — there is nothing for Tailwind to purge, and no
// safelist is needed. This is distinct from domain-colors.ts, which holds the
// four CLF *quiz-domain* colours and is unchanged.
import {
  ArrowRightLeft,
  BarChart3,
  Brain,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  HardDrive,
  Network,
  Radio,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type CategoryStyle = { color: string; Icon: LucideIcon };

export const CATEGORY_STYLE: Record<string, CategoryStyle> = {
  Compute: { color: "#2563eb", Icon: Cpu },
  Storage: { color: "#0d9488", Icon: HardDrive },
  Datenbanken: { color: "#4f46e5", Icon: Database },
  Netzwerk: { color: "#0891b2", Icon: Network },
  Sicherheit: { color: "#e11d48", Icon: ShieldCheck },
  Management: { color: "#d97706", Icon: Gauge },
  Analytik: { color: "#7c3aed", Icon: BarChart3 },
  MLKI: { color: "#c026d3", Icon: Brain },
  Integration: { color: "#059669", Icon: Workflow },
  Migration: { color: "#ea580c", Icon: ArrowRightLeft },
  DevOps: { color: "#65a30d", Icon: GitBranch },
  IoT: { color: "#0ea5e9", Icon: Radio },
};

const FALLBACK: CategoryStyle = { color: "#71717a", Icon: Cpu };

export function categoryStyle(domain: string): CategoryStyle {
  return CATEGORY_STYLE[domain] ?? FALLBACK;
}

// Append an 8-bit alpha to a #rrggbb hex (e.g. tint("#2563eb", "14") → light
// translucent fill). Widely supported in modern browsers for inline styles.
export function tint(color: string, alphaHex: string): string {
  return `${color}${alphaHex}`;
}
