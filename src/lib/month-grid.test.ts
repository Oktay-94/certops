import { describe, expect, it } from "vitest";
import { monthGrid } from "./month-grid";

describe("monthGrid", () => {
  it("July 2026 starts on Wednesday, has 31 days, label in German", () => {
    const grid = monthGrid("2026-07-12");
    expect(grid.label).toBe("Juli 2026");
    // 2026-07-01 is a Wednesday → two leading blanks (Mon, Tue)
    expect(grid.weeks[0]!.slice(0, 3)).toEqual(["", "", "2026-07-01"]);
    const days = grid.weeks.flat().filter(Boolean);
    expect(days).toHaveLength(31);
    expect(days[0]).toBe("2026-07-01");
    expect(days[30]).toBe("2026-07-31");
  });

  it("every row has exactly 7 cells, trailing cells padded", () => {
    const grid = monthGrid("2026-02-15");
    for (const week of grid.weeks) expect(week).toHaveLength(7);
    expect(grid.weeks.flat().length % 7).toBe(0);
    expect(grid.weeks.flat().filter(Boolean)).toHaveLength(28); // Feb 2026
  });

  it("month starting on Monday has no leading blanks (June 2026)", () => {
    const grid = monthGrid("2026-06-01");
    expect(grid.weeks[0]![0]).toBe("2026-06-01");
  });
});
