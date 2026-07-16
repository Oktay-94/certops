import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QuizConfigForm } from "./QuizConfigForm";

const startRound = vi.fn();
vi.mock("./actions", () => ({
  startRound: (args: unknown) => startRound(args),
}));

afterEach(() => {
  cleanup();
  startRound.mockReset();
});

describe("QuizConfigForm (behaviour preserved through re-skin)", () => {
  it("count chip reflects selection via aria-pressed", () => {
    render(<QuizConfigForm exam="clf" questionCount={264} />);
    const chip10 = screen.getByRole("button", { name: "10" });
    expect(chip10).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip10);
    expect(chip10).toHaveAttribute("aria-pressed", "true");
  });

  it("picking a specific domain forces count to 'Alle'", () => {
    render(<QuizConfigForm exam="clf" questionCount={264} />);
    // Default count is 20 → chip "20" pressed, "Alle" not.
    expect(screen.getByRole("button", { name: "Alle" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Security and Compliance/ }),
    );
    expect(screen.getByRole("button", { name: "Alle" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("submit calls startRound with the chosen config", () => {
    render(<QuizConfigForm exam="clf" questionCount={264} />);
    fireEvent.click(screen.getByRole("button", { name: "50" }));
    fireEvent.click(screen.getByRole("button", { name: /schwache zuerst/i }));
    fireEvent.click(screen.getByRole("button", { name: /quiz starten/i }));

    expect(startRound).toHaveBeenCalledWith({
      exam: "clf",
      count: 50,
      domain: "all",
      mode: "weakest-first",
    });
  });
});
