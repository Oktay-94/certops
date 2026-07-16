import { describe, expect, it } from "vitest";
import { isFlashcardBackStructured } from "./flashcard-back";

describe("isFlashcardBackStructured", () => {
  it("accepts a full structured back", () => {
    expect(
      isFlashcardBackStructured({
        summary: "S3 ist Objektspeicher.",
        why: "Beliebig skalierend, 11 Neunen Durability.",
        example: "Statisches Website-Hosting.",
        examTrap: "S3 ist KEIN Blockspeicher (das ist EBS).",
        mnemonic: "S3 = Simple Storage Service.",
        keywords: ["S3", "Objektspeicher", "Durability"],
      }),
    ).toBe(true);
  });

  it("accepts partial objects as long as one section has content", () => {
    expect(isFlashcardBackStructured({ summary: "Nur Kurzfassung." })).toBe(
      true,
    );
    expect(isFlashcardBackStructured({ keywords: ["EC2"] })).toBe(true);
  });

  it("rejects non-objects and empty shells", () => {
    expect(isFlashcardBackStructured(null)).toBe(false);
    expect(isFlashcardBackStructured(undefined)).toBe(false);
    expect(isFlashcardBackStructured("string")).toBe(false);
    expect(isFlashcardBackStructured([])).toBe(false);
    expect(isFlashcardBackStructured({})).toBe(false);
    expect(isFlashcardBackStructured({ summary: "   ", keywords: [] })).toBe(
      false,
    );
  });

  it("rejects wrong field types (malformed DB rows fall back to `back`)", () => {
    expect(isFlashcardBackStructured({ summary: 42 })).toBe(false);
    expect(isFlashcardBackStructured({ summary: "ok", keywords: "S3" })).toBe(
      false,
    );
    expect(
      isFlashcardBackStructured({ summary: "ok", keywords: ["S3", 7] }),
    ).toBe(false);
  });
});
