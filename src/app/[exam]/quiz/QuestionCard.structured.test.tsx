import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QuestionCard } from "./QuestionCard";
import type { QuestionDisplay } from "@/db/schema";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const submitAnswer = vi.fn();
vi.mock("./[id]/actions", () => ({
  submitAnswer: (args: unknown) => submitAnswer(args),
}));

afterEach(() => {
  cleanup();
  submitAnswer.mockReset();
});

const question: QuestionDisplay = {
  id: 1,
  cert: "SAA-C03",
  domain: "Design Secure Architectures",
  type: "single",
  prompt: "Was gewinnt?",
  choices: [
    { id: "A", text: "Allow gewinnt" },
    { id: "B", text: "Deny gewinnt" },
  ],
};

const structured = {
  verdict: "Explizites Deny gewinnt immer.",
  optionAnalysis: {
    A: "Falsch — Allow verliert gegen Deny.",
    B: "Richtig — explizites Deny entscheidet.",
  },
  mnemonic: "Deny schlägt Allow.",
  examTrap: "Kein Allow hebt ein Deny auf.",
};

async function answerWith(result: object) {
  submitAnswer.mockResolvedValue(result);
  fireEvent.click(screen.getByRole("button", { name: /Allow gewinnt/ }));
  fireEvent.click(screen.getByRole("button", { name: /antwort prüfen/i }));
  await waitFor(() =>
    expect(screen.getAllByText(/richtig|falsch/i).length).toBeGreaterThan(0),
  );
}

describe("QuestionCard structured explanation", () => {
  it("renders verdict body, Eselsbrücke/Prüfungsfalle boxes and option rows", async () => {
    render(
      <QuestionCard question={question} nextHref="/x" homeHref="/saa" isLast />,
    );
    await answerWith({
      correct: false,
      explanation: "FLACHE ERKLÄRUNG — darf nicht erscheinen.",
      explanationStructured: structured,
      correctIds: ["B"],
    });

    expect(screen.getByText("Explizites Deny gewinnt immer.")).toBeDefined();
    expect(screen.queryByText(/FLACHE ERKLÄRUNG/)).toBeNull();
    expect(screen.getByText("Eselsbrücke")).toBeDefined();
    expect(screen.getByText("Prüfungsfalle")).toBeDefined();

    const rows = screen.getByTestId("option-analysis");
    const ps = rows.querySelectorAll("p");
    expect(ps).toHaveLength(2);
    // A was chosen and is wrong → danger row; B is the answer → success row.
    expect(ps[0]!.className).toContain("bg-danger-soft");
    expect(ps[1]!.className).toContain("bg-success-soft");
  });

  it("falls back to the flat explanation when structured is null", async () => {
    render(
      <QuestionCard question={question} nextHref="/x" homeHref="/saa" isLast />,
    );
    await answerWith({
      correct: false,
      explanation: "Nur flache Erklärung.",
      explanationStructured: null,
      correctIds: ["B"],
    });

    expect(screen.getByText("Nur flache Erklärung.")).toBeDefined();
    expect(screen.queryByText("Eselsbrücke")).toBeNull();
    expect(screen.queryByTestId("option-analysis")).toBeNull();
  });
});
