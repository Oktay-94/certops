import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExamTile } from "./ExamTile";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/exam-actions", () => ({
  setExamResult: vi.fn(),
  setExamDate: vi.fn(),
}));

describe("ExamTile states", () => {
  it("countdown: shows days, date and progress ring", () => {
    render(
      <ExamTile
        state={{
          kind: "countdown",
          daysLeft: 42,
          progress: 30,
          examDate: "2026-09-01",
        }}
      />,
    );
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/bis zur Prüfung/)).toBeInTheDocument();
    expect(screen.getByText("2026-09-01")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument(); // ring svg
  });

  it("decision: offers Bestanden / Nicht bestanden", () => {
    render(<ExamTile state={{ kind: "decision" }} />);
    expect(
      screen.getByRole("button", { name: /bestanden 🎉/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nicht bestanden/i }),
    ).toBeInTheDocument();
  });

  it("reschedule: date input + start button (disabled until a date is set)", () => {
    render(<ExamTile state={{ kind: "reschedule" }} />);
    expect(screen.getByLabelText("Neues Prüfungsdatum")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /countdown starten/i }),
    ).toBeDisabled();
  });

  it("passed: renders the certificate", () => {
    render(<ExamTile state={{ kind: "passed" }} />);
    expect(
      screen.getByText("AWS Certified Cloud Practitioner"),
    ).toBeInTheDocument();
  });
});
