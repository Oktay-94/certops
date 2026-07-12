export const CLF_C02_DOMAINS = [
  "Cloud Concepts",
  "Security and Compliance",
  "Cloud Technology and Services",
  "Billing, Pricing, and Support",
] as const;

export type ClfC02Domain = (typeof CLF_C02_DOMAINS)[number];

// Official CLF-C02 exam-guide domain weights (percent). Single source for the
// dashboard Domain-Mastery tile; DOM codes follow the exam guide order.
export const CLF_C02_DOMAIN_WEIGHTS: Record<ClfC02Domain, number> = {
  "Cloud Concepts": 24,
  "Security and Compliance": 30,
  "Cloud Technology and Services": 34,
  "Billing, Pricing, and Support": 12,
};

export const QUIZ_COUNT_OPTIONS = [10, 20, 50, 64, 100, "all"] as const;
export type QuizCount = (typeof QUIZ_COUNT_OPTIONS)[number];

export const QUIZ_MODES = ["random", "weakest-first"] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];
