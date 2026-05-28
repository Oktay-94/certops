import { describe, it, expect } from "vitest";
import { daysUntil } from "./config";

describe("daysUntil", () => {
  it("returns days remaining for a future target", () => {
    const now = new Date("2026-05-28T00:00:00Z");
    const target = new Date("2026-06-02T00:00:00Z");
    expect(daysUntil(target, now)).toBe(5);
  });

  it("returns 0 when target is in the past", () => {
    const now = new Date("2026-08-01T00:00:00Z");
    const target = new Date("2026-07-15T00:00:00Z");
    expect(daysUntil(target, now)).toBe(0);
  });

  it("returns 0 when target equals now", () => {
    const now = new Date("2026-05-28T12:00:00Z");
    expect(daysUntil(now, now)).toBe(0);
  });

  it("rounds up sub-day intervals", () => {
    const now = new Date("2026-05-28T00:00:00Z");
    const target = new Date("2026-05-28T06:00:00Z");
    expect(daysUntil(target, now)).toBe(1);
  });
});
