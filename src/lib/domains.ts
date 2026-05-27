export const CLF_C02_DOMAINS = [
  "Cloud Concepts",
  "Security and Compliance",
  "Cloud Technology and Services",
  "Billing, Pricing, and Support",
] as const;

export type ClfC02Domain = (typeof CLF_C02_DOMAINS)[number];

export const QUIZ_COUNT_OPTIONS = [10, 20, 50, 64, 100, "all"] as const;
export type QuizCount = (typeof QUIZ_COUNT_OPTIONS)[number];

export const QUIZ_MODES = ["random", "weakest-first"] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];
