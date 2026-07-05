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

// Sort/index key: drop a leading Amazon/AWS prefix, lowercase — a learner looks
// up "Athena", not "Amazon Athena". Display always keeps the full name.
export function sortKey(name: string): string {
  return name.replace(/^(Amazon|AWS)\s+/i, "").toLowerCase();
}

/** Uppercase first letter of the sort key (A–Z bucket for the jump nav). */
export function letterOf(name: string): string {
  return sortKey(name).charAt(0).toUpperCase();
}
