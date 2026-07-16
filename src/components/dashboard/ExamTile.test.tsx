import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ExamTile } from "./ExamTile";

// No vitest globals in this file → Testing Library's auto-cleanup isn't
// registered; unmount between tests so repeated renders don't collide.
afterEach(cleanup);

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
      <ExamTile cert="CLF-C02"
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

  it("countdown: pencil toggles the inline date editor", () => {
    render(
      <ExamTile cert="CLF-C02"
        state={{
          kind: "countdown",
          daysLeft: 42,
          progress: 30,
          examDate: "2026-09-01",
        }}
      />,
    );
    const pencil = screen.getByRole("button", {
      name: /prüfungsdatum bearbeiten/i,
    });
    expect(screen.queryByLabelText("Neues Prüfungsdatum")).toBeNull();

    fireEvent.click(pencil);
    expect(screen.getByLabelText("Neues Prüfungsdatum")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /speichern/i }),
    ).toBeDisabled(); // no date picked yet

    fireEvent.click(pencil); // toggle closed again
    expect(screen.queryByLabelText("Neues Prüfungsdatum")).toBeNull();
  });

  it("countdown: mini calendar shows the current month label", () => {
    render(
      <ExamTile cert="CLF-C02"
        state={{
          kind: "countdown",
          daysLeft: 42,
          progress: 30,
          examDate: "2026-09-01",
        }}
      />,
    );
    // Current month/year label (German), e.g. "Juli 2026" — assert pattern,
    // not a fixed month, so the test doesn't rot.
    expect(
      screen.getByText(
        /^(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4}$/,
      ),
    ).toBeInTheDocument();
  });

  it("decision: offers Bestanden / Nicht bestanden", () => {
    render(<ExamTile cert="CLF-C02" state={{ kind: "decision" }} />);
    expect(
      screen.getByRole("button", { name: /bestanden 🎉/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nicht bestanden/i }),
    ).toBeInTheDocument();
  });

  it("reschedule: date input + start button (disabled until a date is set)", () => {
    render(<ExamTile cert="CLF-C02" state={{ kind: "reschedule" }} />);
    expect(screen.getByLabelText("Neues Prüfungsdatum")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /countdown starten/i }),
    ).toBeDisabled();
  });

  it("passed: renders the certificate", () => {
    render(<ExamTile cert="CLF-C02" state={{ kind: "passed" }} />);
    expect(
      screen.getByText("AWS Certified Cloud Practitioner"),
    ).toBeInTheDocument();
  });

  it("passed: pencil opens the date editor to plan a new exam (SAA)", () => {
    render(<ExamTile cert="CLF-C02" state={{ kind: "passed" }} />);
    expect(screen.queryByLabelText("Neues Prüfungsdatum")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /neue prüfung planen/i }),
    );
    expect(screen.getByLabelText("Neues Prüfungsdatum")).toBeInTheDocument();
  });
});
