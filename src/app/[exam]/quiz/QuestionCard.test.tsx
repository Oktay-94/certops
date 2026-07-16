import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuestionCard } from "./QuestionCard";
import type { QuestionDisplay } from "@/db/schema";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const submitAnswer = vi.fn();
vi.mock("./[id]/actions", () => ({
  submitAnswer: (args: unknown) => submitAnswer(args),
}));

afterEach(() => {
  cleanup();
  submitAnswer.mockReset();
  push.mockReset();
});

const question: QuestionDisplay = {
  id: 1,
  cert: "CLF-C02",
  domain: "Cloud Concepts",
  type: "single",
  prompt: "Was ist Elastizität?",
  choices: [
    { id: "A", text: "Auto-scaling" },
    { id: "B", text: "Datenhaltbarkeit" },
  ],
};

describe("QuestionCard (behaviour preserved through re-skin)", () => {
  it("check button is disabled until an option is selected", () => {
    render(<QuestionCard question={question} nextHref="/quiz/2"
          homeHref="/clf" isLast={false} />);
    expect(screen.getByRole("button", { name: /antwort prüfen/i })).toBeDisabled();

    const optionA = screen.getByRole("button", { name: /Auto-scaling/ });
    fireEvent.click(optionA);
    expect(optionA).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /antwort prüfen/i }),
    ).not.toBeDisabled();
  });

  it("marks correct green / wrong red and disables options after check", async () => {
    submitAnswer.mockResolvedValue({
      correct: false,
      explanation: "Elastizität = Skalieren mit der Last.",
      correctIds: ["A"],
    });
    render(<QuestionCard question={question} nextHref="/quiz/2"
          homeHref="/clf" isLast={false} />);

    // Pick the WRONG option B, then check.
    fireEvent.click(screen.getByRole("button", { name: /Datenhaltbarkeit/ }));
    fireEvent.click(screen.getByRole("button", { name: /antwort prüfen/i }));

    await waitFor(() =>
      expect(screen.getByText("Falsch")).toBeInTheDocument(),
    );
    expect(submitAnswer).toHaveBeenCalledWith({ questionId: 1, selected: ["B"] });
    // Explanation shown, options now disabled.
    expect(
      screen.getByText("Elastizität = Skalieren mit der Last."),
    ).toBeInTheDocument();
    const optionA = screen.getByRole("button", { name: /Auto-scaling/ });
    const optionB = screen.getByRole("button", { name: /Datenhaltbarkeit/ });
    expect(optionA).toBeDisabled();
    expect(optionB).toBeDisabled();
    // Correct option A gets the success border; wrong pick B the danger border.
    expect(optionA.className).toMatch(/border-success/);
    expect(optionB.className).toMatch(/border-danger/);
  });
});
