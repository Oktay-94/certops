import { describe, expect, it } from "vitest";
import { isQuestionExplanationStructured } from "./question-explanation";

describe("isQuestionExplanationStructured", () => {
  it("accepts a full structured explanation", () => {
    expect(
      isQuestionExplanationStructured({
        verdict: "**Explizites Deny** gewinnt.",
        optionAnalysis: { A: "Falsch.", B: "Richtig." },
        mnemonic: "Deny schlägt Allow.",
        examTrap: "Kein Allow hebt ein Deny auf.",
      }),
    ).toBe(true);
  });

  it("accepts partial objects as long as one section has content", () => {
    expect(isQuestionExplanationStructured({ verdict: "Nur Verdict." })).toBe(
      true,
    );
    expect(
      isQuestionExplanationStructured({ optionAnalysis: { A: "Falsch." } }),
    ).toBe(true);
  });

  it("rejects non-objects and empty shells", () => {
    expect(isQuestionExplanationStructured(null)).toBe(false);
    expect(isQuestionExplanationStructured("x")).toBe(false);
    expect(isQuestionExplanationStructured([])).toBe(false);
    expect(isQuestionExplanationStructured({})).toBe(false);
    expect(
      isQuestionExplanationStructured({ verdict: " ", optionAnalysis: {} }),
    ).toBe(false);
  });

  it("rejects wrong field types", () => {
    expect(isQuestionExplanationStructured({ verdict: 1 })).toBe(false);
    expect(
      isQuestionExplanationStructured({ optionAnalysis: ["A"] }),
    ).toBe(false);
    expect(
      isQuestionExplanationStructured({ optionAnalysis: { A: 42 } }),
    ).toBe(false);
  });
});
