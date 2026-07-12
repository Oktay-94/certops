import { describe, expect, it } from "vitest";
import {
  CLF_C02_DOMAINS,
  CLF_C02_DOMAIN_WEIGHTS,
  SAA_C03_DOMAINS,
  SAA_C03_DOMAIN_WEIGHTS,
} from "./domains";

// Guard: weights stay complete (sum 100) and keyed by their own exam's
// domains — CLF (24/30/34/12) and SAA (30/26/24/20) must never mix.
describe("exam domain weights", () => {
  it("CLF-C02 weights cover exactly the CLF domains and sum to 100", () => {
    expect(Object.keys(CLF_C02_DOMAIN_WEIGHTS).sort()).toEqual(
      [...CLF_C02_DOMAINS].sort(),
    );
    expect(
      Object.values(CLF_C02_DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0),
    ).toBe(100);
  });

  it("SAA-C03 weights cover exactly the SAA domains and sum to 100", () => {
    expect(Object.keys(SAA_C03_DOMAIN_WEIGHTS).sort()).toEqual(
      [...SAA_C03_DOMAINS].sort(),
    );
    expect(
      Object.values(SAA_C03_DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0),
    ).toBe(100);
  });

  it("no domain string appears in both exams", () => {
    const clf = new Set<string>(CLF_C02_DOMAINS);
    for (const d of SAA_C03_DOMAINS) expect(clf.has(d)).toBe(false);
  });
});
