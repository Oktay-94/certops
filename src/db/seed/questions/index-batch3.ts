// src/db/seed/questions/index-batch3.ts

import type { NewQuestion } from "../../schema";
import { clfC02QCloudConceptsB3 } from "./clf-c02-q-cc-batch3";
import { clfC02QSecurityB3 } from "./clf-c02-q-sec-batch3";
import { clfC02QCloudTech1B3 } from "./clf-c02-q-ct1-batch3";
import { clfC02QCloudTech2B3 } from "./clf-c02-q-ct2-batch3";
import { clfC02QBillingB3 } from "./clf-c02-q-bill-batch3";

// 100 neue CLF-C02-Quiz-Fragen (Batch 3), Verteilung nach echter
// Prüfungs-Gewichtung: Cloud Concepts 24 / Security 30 /
// Cloud Tech 34 (17+17) / Billing 12.
// Werden in src/db/seed.ts an clfC02Questions + clfC02QuestionsBatch2 angehängt.
export const clfC02QuestionsBatch3: NewQuestion[] = [
  ...clfC02QCloudConceptsB3, // 24 — Cloud Concepts
  ...clfC02QSecurityB3, // 30 — Security and Compliance
  ...clfC02QCloudTech1B3, // 17 — Cloud Technology (Compute, Storage, DB)
  ...clfC02QCloudTech2B3, // 17 — Cloud Technology (Networking, AI/ML, Analytics, Integration)
  ...clfC02QBillingB3, // 12 — Billing, Pricing, and Support
];
