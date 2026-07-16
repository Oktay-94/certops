import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  FlashcardGrid,
  type FlashcardItem,
} from "@/app/[exam]/cards/FlashcardGrid";

vi.mock("@/app/[exam]/cards/actions", () => ({
  markFlashcardSeen: vi.fn().mockResolvedValue(undefined),
  resetFlashcardViews: vi.fn().mockResolvedValue(undefined),
}));

afterEach(cleanup);

const structuredCard: FlashcardItem = {
  id: 1,
  cert: "SAA-C03",
  domain: "Design Secure Architectures",
  front: "Was ist IAM?",
  back: "Legacy-Fallback-Text — darf bei structured NICHT erscheinen.",
  backStructured: {
    summary: "Zugriffssteuerung für AWS.",
    why: "Least Privilege als Grundprinzip.",
    example: "Rolle statt Access Keys auf EC2.",
    examTrap: "IAM ist global, nicht regional.",
    mnemonic: "Wer darf was womit.",
    keywords: ["IAM", "Least Privilege"],
  },
  iconSlugs: null,
};

const plainCard: FlashcardItem = {
  ...structuredCard,
  id: 2,
  front: "Was ist S3?",
  back: "Nur Fallback-Text.",
  backStructured: null,
};

describe("FlashcardGrid structured back", () => {
  it("renders all sections + keyword pills when backStructured is set", () => {
    render(
      <FlashcardGrid
        exam="saa"
        cards={[structuredCard]}
        domains={[structuredCard.domain]}
      />,
    );

    for (const label of [
      "Kurz gesagt",
      "Warum so?",
      "Beispiel",
      "⚠ Prüfungs-Knackpunkt",
      "Merksatz",
      "Stichworte",
    ]) {
      expect(screen.getByText(label)).toBeDefined();
    }
    expect(screen.getByText("Zugriffssteuerung für AWS.")).toBeDefined();
    expect(screen.getByText("Least Privilege")).toBeDefined();
    // Legacy back must not render alongside the structured sections.
    expect(
      screen.queryByText(/Legacy-Fallback-Text/),
    ).toBeNull();
  });

  it("skips empty sections instead of rendering bare labels", () => {
    render(
      <FlashcardGrid
        exam="saa"
        cards={[
          {
            ...structuredCard,
            backStructured: { summary: "Nur Kurzfassung.", example: "  " },
          },
        ]}
        domains={[structuredCard.domain]}
      />,
    );
    expect(screen.getByText("Kurz gesagt")).toBeDefined();
    expect(screen.queryByText("Beispiel")).toBeNull();
    expect(screen.queryByText("Stichworte")).toBeNull();
  });

  it("falls back to the plain back when backStructured is null", () => {
    render(
      <FlashcardGrid
        exam="saa"
        cards={[plainCard]}
        domains={[plainCard.domain]}
      />,
    );
    expect(screen.getByText("Nur Fallback-Text.")).toBeDefined();
    expect(screen.queryByText("Kurz gesagt")).toBeNull();
  });
});
