// src/db/seed/cards/index.ts

import type { NewFlashcard } from "../../schema";
import { clfC02ComputeStorageCards } from "./clf-c02-compute-storage";
import { clfC02DatabaseNetworkingCards } from "./clf-c02-database-networking";
import { clfC02NetworkingSecurityCards } from "./clf-c02-networking-security";
import { clfC02ConceptsArchitectureCards } from "./clf-c02-concepts-architecture";
import { clfC02BillingManagementCards } from "./clf-c02-billing-management";
import { clfC02AnalyticsAiGapsCards } from "./clf-c02-analytics-ai-gaps";

// Order matters: deterministic insert order -> stable autoincrement IDs after reseed.
export const clfC02Flashcards: NewFlashcard[] = [
  ...clfC02ComputeStorageCards, // Block 1: Compute + Storage (15)
  ...clfC02DatabaseNetworkingCards, // Block 2: Datenbanken + Networking (15)
  ...clfC02NetworkingSecurityCards, // Block 3: Networking-Rest + Security/IAM (30)
  ...clfC02ConceptsArchitectureCards, // Block 4: Cloud Concepts + Well-Architected (30)
  ...clfC02BillingManagementCards, // Block 5: Billing + Support + Management (30)
  ...clfC02AnalyticsAiGapsCards, // Block 6: Analytics + AI/ML + Integration + Lücken (30)
];
