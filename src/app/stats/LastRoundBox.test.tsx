import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LastRoundBox } from "./LastRoundBox";
import type { LastRoundReview } from "@/db/repository";

afterEach(cleanup);

const review: LastRoundReview = {
  roundId: "r1",
  correctCount: 2,
  incorrectCount: 1,
  correct: [
    {
      questionId: 10,
      questionText: "Was ist S3?",
      correctAnswerText: "Objektspeicher",
      isCorrect: true,
    },
    {
      questionId: 11,
      questionText: "Was ist EC2?",
      correctAnswerText: "Virtuelle Server",
      isCorrect: true,
    },
  ],
  incorrect: [
    {
      questionId: 12,
      questionText: "Was ist IAM?",
      correctAnswerText: "Zugriffsverwaltung",
      isCorrect: false,
    },
  ],
};

describe("LastRoundBox tabs (behaviour preserved through re-skin)", () => {
  it("empty when no round played", () => {
    render(
      <LastRoundBox
        review={{
          roundId: null,
          correctCount: 0,
          incorrectCount: 0,
          correct: [],
          incorrect: [],
        }}
      />,
    );
    expect(screen.getByText(/Spiel eine Runde/)).toBeInTheDocument();
  });

  it("defaults to the Falsch tab and shows the wrong question", () => {
    render(<LastRoundBox review={review} />);
    const falsch = screen.getByRole("tab", { name: /Falsch · 1/ });
    expect(falsch).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Was ist IAM?")).toBeInTheDocument();
    expect(screen.queryByText("Was ist S3?")).toBeNull();
  });

  it("switches to Richtig and lists the correct questions", () => {
    render(<LastRoundBox review={review} />);
    fireEvent.click(screen.getByRole("tab", { name: /Richtig · 2/ }));

    expect(
      screen.getByRole("tab", { name: /Richtig · 2/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Was ist S3?")).toBeInTheDocument();
    expect(screen.getByText("Was ist EC2?")).toBeInTheDocument();
    expect(screen.queryByText("Was ist IAM?")).toBeNull();
  });
});
