export const CLF_C02_DOMAINS = [
  "Cloud Concepts",
  "Security and Compliance",
  "Cloud Technology and Services",
  "Billing, Pricing, and Support",
] as const;

export type ClfC02Domain = (typeof CLF_C02_DOMAINS)[number];

// Official exam-guide domain weights (percent), fact-checked 2026-07-12.
// Single source for mastery tiles; DOM codes follow exam-guide order.
// CLF and SAA weights MUST never mix — each keyed by its own domain type.
export const CLF_C02_DOMAIN_WEIGHTS: Record<ClfC02Domain, number> = {
  "Cloud Concepts": 24,
  "Security and Compliance": 30,
  "Cloud Technology and Services": 34,
  "Billing, Pricing, and Support": 12,
};

// SAA-C03 (prepared for Phase 6/7 — not consumed by any tile yet).
// Domain strings EXACTLY as in the exam guide / implementation plan.
export const SAA_C03_DOMAINS = [
  "Design Secure Architectures",
  "Design Resilient Architectures",
  "Design High-Performing Architectures",
  "Design Cost-Optimized Architectures",
] as const;

export type SaaC03Domain = (typeof SAA_C03_DOMAINS)[number];

export const SAA_C03_DOMAIN_WEIGHTS: Record<SaaC03Domain, number> = {
  "Design Secure Architectures": 30,
  "Design Resilient Architectures": 26,
  "Design High-Performing Architectures": 24,
  "Design Cost-Optimized Architectures": 20,
};

export type ExamDomain = ClfC02Domain | SaaC03Domain;

// Per-cert lookups so route-parameterized pages never mix the two tracks.
export const DOMAINS_BY_CERT = {
  "CLF-C02": CLF_C02_DOMAINS,
  "SAA-C03": SAA_C03_DOMAINS,
} as const;

export const DOMAIN_WEIGHTS_BY_CERT: Record<
  keyof typeof DOMAINS_BY_CERT,
  Record<string, number>
> = {
  "CLF-C02": CLF_C02_DOMAIN_WEIGHTS,
  "SAA-C03": SAA_C03_DOMAIN_WEIGHTS,
};

export const QUIZ_COUNT_OPTIONS = [10, 20, 50, 64, 100, "all"] as const;
export type QuizCount = (typeof QUIZ_COUNT_OPTIONS)[number];

export const QUIZ_MODES = ["random", "weakest-first"] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];
