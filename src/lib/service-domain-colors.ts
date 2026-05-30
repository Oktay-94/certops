// Maps the 12 service categories onto our 4 CLF domain colors. Single source:
// the actual Tailwind tones live in domain-colors.ts — we only reference its
// keys here, never duplicate the class strings. Documented debt: color groups
// only 4 buckets, the category name stays as text in the badge.
import { getDomainColor, type DomainColor } from "@/lib/domain-colors";

const CATEGORY_TO_CLF: Record<string, string> = {
  Compute: "Cloud Concepts",
  Storage: "Cloud Concepts",
  Datenbanken: "Cloud Concepts",
  Netzwerk: "Cloud Concepts",
  Sicherheit: "Security and Compliance",
  Analytik: "Cloud Technology and Services",
  MLKI: "Cloud Technology and Services",
  Integration: "Cloud Technology and Services",
  IoT: "Cloud Technology and Services",
  Management: "Billing, Pricing, and Support",
  DevOps: "Billing, Pricing, and Support",
  Migration: "Billing, Pricing, and Support",
};

export function getServiceColor(domain: string): DomainColor {
  return getDomainColor(CATEGORY_TO_CLF[domain] ?? "");
}
