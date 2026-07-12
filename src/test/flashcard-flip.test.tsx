import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FlashcardGrid, type FlashcardItem } from "@/app/cards/FlashcardGrid";

const markFlashcardSeen = vi.fn().mockResolvedValue(undefined);
vi.mock("@/app/cards/actions", () => ({
  markFlashcardSeen: (id: number) => markFlashcardSeen(id),
  resetFlashcardViews: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  cleanup();
  markFlashcardSeen.mockClear();
});

const cards: FlashcardItem[] = [
  {
    id: 42,
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Was ist S3?",
    back: "Objektspeicher.",
    iconSlugs: null,
  },
];

function cardButton(): HTMLElement {
  return screen
    .getAllByRole("button")
    .find((b) => b.className.includes("h-80"))!;
}

describe("FlashcardGrid flip (behaviour preserved through re-skin)", () => {
  it("click toggles the .flipped class and marks seen once on reveal", () => {
    render(<FlashcardGrid cards={cards} domains={["Cloud Concepts"]} />);
    const inner = document.querySelector(".flip-inner")!;
    expect(inner.className).not.toContain("flipped");

    fireEvent.click(cardButton());
    expect(document.querySelector(".flip-inner")!.className).toContain(
      "flipped",
    );
    expect(markFlashcardSeen).toHaveBeenCalledTimes(1);
    expect(markFlashcardSeen).toHaveBeenCalledWith(42);

    // Flipping back does NOT re-mark as seen.
    fireEvent.click(cardButton());
    expect(document.querySelector(".flip-inner")!.className).not.toContain(
      "flipped",
    );
    expect(markFlashcardSeen).toHaveBeenCalledTimes(1);
  });
});
