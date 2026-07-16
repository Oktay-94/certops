import { describe, expect, it } from "vitest";
import { getDomainColor } from "./domain-colors";
import { CLF_C02_DOMAINS, SAA_C03_DOMAINS } from "./domains";

describe("getDomainColor", () => {
  it("every CLF and SAA domain has a valid solid hex, no zinc fallback", () => {
    for (const domain of [...CLF_C02_DOMAINS, ...SAA_C03_DOMAINS]) {
      const color = getDomainColor(domain);
      expect(color.solid, domain).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color.solid, domain).not.toBe("#71717a");
    }
  });

  it("SAA colors are distinct within the track (approved palette)", () => {
    const solids = SAA_C03_DOMAINS.map((d) => getDomainColor(d).solid);
    expect(new Set(solids).size).toBe(4);
    expect(getDomainColor("Design Secure Architectures").solid).toBe("#0284c7");
  });

  it("Security stays rose (#e11d48), not the mockup's red", () => {
    expect(getDomainColor("Security and Compliance").solid).toBe("#e11d48");
  });

  it("unknown domain falls back to zinc with a valid solid hex", () => {
    expect(getDomainColor("Nonexistent").solid).toBe("#71717a");
  });
});
