import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AreaTiles } from "./AreaTiles";
import { RING_CIRC, ringDashOffset } from "./ReadinessRing";
import { nodeState } from "./TopicMap";

describe("ringDashOffset", () => {
  it("0 → full circumference, 100 → 0, clamps out-of-range", () => {
    expect(ringDashOffset(0)).toBeCloseTo(RING_CIRC);
    expect(ringDashOffset(100)).toBeCloseTo(0);
    expect(ringDashOffset(50)).toBeCloseTo(RING_CIRC / 2);
    expect(ringDashOffset(-5)).toBeCloseTo(RING_CIRC);
    expect(ringDashOffset(140)).toBeCloseTo(0);
  });
});

describe("nodeState", () => {
  it("null → open, ≥ strong → mastered, otherwise in progress", () => {
    expect(nodeState(null)).toBe("o");
    expect(nodeState(0.75)).toBe("m");
    expect(nodeState(0.9)).toBe("m");
    expect(nodeState(0.74)).toBe("c");
    expect(nodeState(0.1)).toBe("c");
  });
});

describe("AreaTiles", () => {
  // globals:false disables testing-library auto-cleanup — without this, the
  // second render races env teardown (unhandled "window is not defined").
  afterEach(cleanup);

  it("renders all six areas with correct targets", () => {
    render(<AreaTiles exam="clf" />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual([
      "/clf/quiz",
      "/clf/cards",
      "/clf/skript",
      "/clf/services",
      "/clf/stats",
      "/clf/uebersicht",
    ]);
    // Shared areas carry the GETEILT pill (Skript + Übersicht).
    expect(screen.getAllByText("GETEILT")).toHaveLength(2);
  });

  it("SAA renders quiz, cards, skript and stats (Dienste/Übersicht stay CLF-only)", () => {
    render(<AreaTiles exam="saa" />);
    const hrefs = screen
      .getAllByRole("link")
      .map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual([
      "/saa/quiz",
      "/saa/cards",
      "/saa/skript",
      "/saa/stats",
    ]);
  });
});
