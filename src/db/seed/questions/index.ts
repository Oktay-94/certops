// src/db/seed/questions/index.ts

import type { NewQuestion } from "../../schema";
import { clfC02QCloudConcepts } from "./clf-c02-q-cloud-concepts";
import { clfC02QSecurity } from "./clf-c02-q-security";
import { clfC02QCloudTech1 } from "./clf-c02-q-cloud-tech-1";
import { clfC02QCloudTech2 } from "./clf-c02-q-cloud-tech-2";
import { clfC02QBilling } from "./clf-c02-q-billing";

// 100 neue CLF-C02-Quiz-Fragen (Batch 2), verteilt nach echter Prüfungs-Gewichtung:
// Cloud Concepts 24 / Security 30 / Cloud Tech 34 (17+17) / Billing 12.
// HINWEIS: Die bestehenden 64 Fragen liegen weiterhin in
// src/db/seed/{cloud-concepts,security,cloud-tech,billing}.ts.
// Die seed-Logik muss BEIDE zusammenführen (siehe Einbau-Prompt).
export const clfC02QuestionsBatch2: NewQuestion[] = [
  ...clfC02QCloudConcepts, // 24 — Cloud Concepts
  ...clfC02QSecurity, // 30 — Security and Compliance
  ...clfC02QCloudTech1, // 17 — Cloud Technology (Compute, Storage, DB)
  ...clfC02QCloudTech2, // 17 — Cloud Technology (Networking, Integration, Analytics, AI/ML, Mgmt)
  ...clfC02QBilling, // 12 — Billing, Pricing, and Support
];
