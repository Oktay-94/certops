import type { NewQuestion } from "../schema";
import { cloudConceptsQuestions } from "./cloud-concepts";
import { securityQuestions } from "./security";
import { cloudTechQuestions } from "./cloud-tech";
import { billingQuestions } from "./billing";

// Order matters: deterministic insert order → stable autoincrement IDs after reseed.
// K1 + K2 batches are merged per domain inside each file.
export const clfC02Questions: NewQuestion[] = [
  ...cloudConceptsQuestions,
  ...securityQuestions,
  ...cloudTechQuestions,
  ...billingQuestions,
];
