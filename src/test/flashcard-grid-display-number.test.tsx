import { act } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/app/[exam]/cards/actions", () => ({
  markFlashcardSeen: vi.fn(() => Promise.resolve()),
  resetFlashcardViews: vi.fn(() => Promise.resolve()),
}));

import { FlashcardGrid, type FlashcardItem } from "@/app/[exam]/cards/FlashcardGrid";

const cards: FlashcardItem[] = [
  {
    id: 5,
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "F1",
    back: "B1",
    iconSlugs: null,
  },
  {
    id: 17,
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "F2",
    back: "B2",
    iconSlugs: null,
  },
  {
    id: 42,
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "F3",
    back: "B3",
    iconSlugs: null,
  },
];

describe("FlashcardGrid display numbers", () => {
  it("renders 1.–N. based on position in ASC-sorted cards prop, not DB id", () => {
    render(<FlashcardGrid exam="clf" cards={cards} domains={["Cloud Concepts"]} />);
    // Redesign: the position number prefixes the domain pill as "N." (bold),
    // no longer a "#N" badge.
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
    expect(screen.getByText("3.")).toBeInTheDocument();
    expect(screen.queryByText("5.")).toBeNull();
    expect(screen.queryByText("17.")).toBeNull();
    expect(screen.queryByText("42.")).toBeNull();
  });
});

describe("FlashcardGrid markdown answer", () => {
  it("renders **bold** in answers as <strong>", async () => {
    const md: FlashcardItem[] = [
      {
        id: 1,
        cert: "CLF-C02",
        domain: "Cloud Concepts",
        front: "Q",
        back: "**EC2:** virtuelle Server.",
        iconSlugs: null,
      },
    ];
    const { container } = render(
      <FlashcardGrid exam="clf" cards={md} domains={["Cloud Concepts"]} />,
    );
    const cardBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="flashcard"]',
    );
    expect(cardBtn).toBeDefined();
    await act(async () => {
      cardBtn!.click();
    });
    await waitFor(() => {
      const strong = container.querySelector("strong");
      expect(strong).not.toBeNull();
      expect(strong?.textContent).toBe("EC2:");
    });
  });

  it("renders ==text== in answers as <mark> with orange styling", async () => {
    const md: FlashcardItem[] = [
      {
        id: 1,
        cert: "CLF-C02",
        domain: "Cloud Concepts",
        front: "Q",
        back: "==EC2== ist Compute.",
        iconSlugs: null,
      },
    ];
    const { container } = render(
      <FlashcardGrid exam="clf" cards={md} domains={["Cloud Concepts"]} />,
    );
    const cardBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="flashcard"]',
    );
    await act(async () => {
      cardBtn!.click();
    });
    await waitFor(() => {
      const mark = container.querySelector("mark");
      expect(mark).not.toBeNull();
      expect(mark?.textContent).toBe("EC2");
      expect(mark?.className).toContain("bg-orange-100");
    });
  });
});
