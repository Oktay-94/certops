// Structured quiz explanation (SAA enrichment), the questions-side sibling of
// the flashcards' back_structured. Stored JSON-serialized in the nullable
// questions.explanation_structured column; the flat `explanation` stays the
// render fallback, so CLF questions (always NULL here) are untouched.
//
// Key ↔ UI mapping (quiz result view):
//   verdict        → body of the RICHTIG/FALSCH box
//   mnemonic       → „Eselsbrücke" box
//   examTrap       → „Prüfungsfalle" box
//   optionAnalysis → one line per choice ID (A–E), rendered in choice order
export type QuestionExplanationStructured = {
  verdict?: string;
  optionAnalysis?: Record<string, string>;
  mnemonic?: string;
  examTrap?: string;
};

const TEXT_KEYS = ["verdict", "mnemonic", "examTrap"] as const;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * Runtime shape guard for values read from the DB (json mode only casts).
 * Accepts the object only if every present key has the right type AND at
 * least one section carries content — otherwise the caller falls back to
 * the flat `explanation`.
 */
export function isQuestionExplanationStructured(
  value: unknown,
): value is QuestionExplanationStructured {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  for (const key of TEXT_KEYS) {
    if (obj[key] !== undefined && typeof obj[key] !== "string") return false;
  }

  const oa = obj.optionAnalysis;
  if (oa !== undefined) {
    if (typeof oa !== "object" || oa === null || Array.isArray(oa)) {
      return false;
    }
    if (!Object.values(oa).every((v) => typeof v === "string")) return false;
  }

  const hasText = TEXT_KEYS.some((key) => isNonEmptyString(obj[key]));
  const hasAnalysis =
    typeof oa === "object" &&
    oa !== null &&
    Object.values(oa).some(isNonEmptyString);
  return hasText || hasAnalysis;
}
