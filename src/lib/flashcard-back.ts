// Structured flashcard back (SAA enrichment). Stored JSON-serialized in the
// nullable flashcards.back_structured column; the plain `back` field remains
// the render fallback, so CLF cards (always NULL here) are untouched.
//
// Key ↔ section label mapping (labels rendered by the card back):
//   summary  → „Kurz gesagt"
//   why      → „Warum so?"
//   example  → „Beispiel"
//   examTrap → „⚠ Prüfungs-Knackpunkt"
//   mnemonic → „Merksatz"
//   keywords → Stichworte-Pills
export type FlashcardBackStructured = {
  summary?: string;
  why?: string;
  example?: string;
  examTrap?: string;
  mnemonic?: string;
  keywords?: string[];
};

const TEXT_KEYS = ["summary", "why", "example", "examTrap", "mnemonic"] as const;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * Runtime shape guard for values read from the DB. Drizzle's json mode only
 * casts; this keeps a malformed row from crashing the card UI. Accepts the
 * object only if every present key has the right type AND at least one
 * section carries content — otherwise the caller falls back to `back`.
 */
export function isFlashcardBackStructured(
  value: unknown,
): value is FlashcardBackStructured {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  for (const key of TEXT_KEYS) {
    if (obj[key] !== undefined && typeof obj[key] !== "string") return false;
  }
  if (
    obj.keywords !== undefined &&
    (!Array.isArray(obj.keywords) ||
      !obj.keywords.every((k) => typeof k === "string"))
  ) {
    return false;
  }

  const hasText = TEXT_KEYS.some((key) => isNonEmptyString(obj[key]));
  const hasKeywords =
    Array.isArray(obj.keywords) && obj.keywords.some(isNonEmptyString);
  return hasText || hasKeywords;
}
