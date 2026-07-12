import { describe, expect, it } from "vitest";
import { getDomainColor } from "./domain-colors";
import { CLF_C02_DOMAINS } from "./domains";

describe("getDomainColor", () => {
  it("every CLF domain has a valid solid hex (used by stats + dark mode)", () => {
    for (const domain of CLF_C02_DOMAINS) {
      const color = getDomainColor(domain);
      expect(color.solid).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("Security stays rose (#e11d48), not the mockup's red", () => {
    expect(getDomainColor("Security and Compliance").solid).toBe("#e11d48");
  });

  it("unknown domain falls back to zinc with a valid solid hex", () => {
    expect(getDomainColor("Nonexistent").solid).toBe("#71717a");
  });
});
