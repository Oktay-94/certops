// Service flashcard data — mapped from the single source of truth
// `aws-services-172.json` (172 enriched AWS services, 12 categories).
//
// The JSON uses source-side field names (id/service/category/metaphor/
// explanation/note); this layer maps them to the stable ServiceCard shape the
// UI/quiz consume (num/title/domain/eselsbruecke/core/hint) and carries the new
// `distractor` field through unchanged. `distractor` is intentionally unused by
// the card grid (Task A) — it feeds the Battle Cards quiz (Task B).
//
// To update content, edit the JSON, not this file.
import raw from "./aws-services-172.json";
import type { SkriptRef } from "./skript";

export type ServiceCard = {
  num: number;
  title: string;
  domain: string;
  eselsbruecke: string;
  front: string;
  core: string;
  partners: string[];
  hint: string;
  /** Plausible-but-wrong description for the Battle Cards quiz (Task B). */
  distractor: string;
  /** Deep-link target into the Lernskript (validated by skript-anchors.test.ts). */
  skriptRef: SkriptRef;
};

type RawService = {
  id: number;
  service: string;
  category: string;
  metaphor: string;
  front: string;
  explanation: string;
  partners: string[];
  note: string;
  distractor: string;
  skriptRef: SkriptRef;
};

type RawSource = {
  count: number;
  categories: string[];
  services: RawService[];
};

const source = raw as RawSource;

export const SERVICES: ServiceCard[] = source.services.map((s) => ({
  num: s.id,
  title: s.service,
  domain: s.category,
  eselsbruecke: s.metaphor,
  front: s.front,
  core: s.explanation,
  partners: s.partners,
  hint: s.note,
  distractor: s.distractor,
  skriptRef: s.skriptRef,
}));

// Canonical 12-category order straight from the source (NOT data-derived
// first-seen), so the filter dropdown shows a stable, intentional ordering.
export const SERVICE_DOMAINS: string[] = source.categories;
