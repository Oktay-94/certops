import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MiniCalendar } from "./MiniCalendar";

afterEach(cleanup);

describe("MiniCalendar", () => {
  it("renders the current German month label and 1..N day cells", () => {
    render(<MiniCalendar />);
    expect(
      screen.getByText(
        /^(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4}$/,
      ),
    ).toBeInTheDocument();
    // Day "1" always exists in any month.
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("works without a highlight (stats use case — today only)", () => {
    // Must not throw when highlight is omitted.
    expect(() => render(<MiniCalendar />)).not.toThrow();
  });
});
