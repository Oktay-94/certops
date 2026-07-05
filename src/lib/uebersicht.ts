// Dienste-Schnellübersicht (/uebersicht) — pure, isomorphic helpers.
//
// The overview is an INDEX into the Lernskript: each row deep-links to the
// service's skript section. It therefore reuses the skript's slug/ref machinery
// (normalizeName, SkriptRef, skriptUrl) and the skript's colour language
// (chapter accents) — never a parallel slugger or a second colour system.
//
// Filesystem access (reading the markdown) lives in uebersicht-content.ts so
// this module stays import-safe from client and test contexts.
import services from "./aws-services-172.json";
import { normalizeName, type SkriptRef } from "./skript";
import { emojiForHeadingText } from "./skript-emoji";

type RawService = { service: string; skriptRef?: SkriptRef };
const SERVICES = (services as { services: RawService[] }).services;

const byNorm = new Map(SERVICES.map((s) => [normalizeName(s.service), s]));
const byName = new Map(SERVICES.map((s) => [s.service, s]));

// A few overview entries are listed individually but folded into a detail /
// collection card in the JSON, so their normalized name has no 1:1 match. Map
// them (by normalized overview name) to the JSON service that owns their skript
// section, so the deep link still lands on the right anchor.
const REF_ALIASES: Record<string, string> = {
  "auto scaling": "Auto Scaling Group",
  ecr: "Container, ECS & ECR Details",
  "local zones": "AWS Hybrid & Edge – Local Zones, Wavelength",
  wavelength: "AWS Hybrid & Edge – Local Zones, Wavelength",
};

/** Resolve an overview service name to its skript deep-link ref, or null. */
export function resolveServiceRef(name: string): SkriptRef | null {
  const norm = normalizeName(name);
  const direct = byNorm.get(norm);
  if (direct?.skriptRef) return direct.skriptRef;
  const aliased = REF_ALIASES[norm];
  if (aliased) return byName.get(aliased)?.skriptRef ?? null;
  return null;
}

/**
 * Leading metaphor emoji for a service, or null. Reuses the skript resolver
 * (emojiForHeadingText → normalizeName lookup against the JSON metaphor fields)
 * so the overview and the reader show the SAME emoji per service. For the four
 * aliased entries the JSON folds into detail cards, we look up the emoji of the
 * owning card instead (same REF_ALIASES table as the deep link).
 */
export function serviceEmoji(name: string): string | null {
  const direct = emojiForHeadingText(name);
  if (direct) return direct;
  const aliased = REF_ALIASES[normalizeName(name)];
  return aliased ? emojiForHeadingText(aliased) : null;
}
