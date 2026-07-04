import { describe, expect, it } from "vitest";
import { SERVICES, SERVICE_DOMAINS, type ServiceCard } from "./services-data";

const REQUIRED_TEXT: (keyof ServiceCard)[] = [
  "title",
  "front",
  "core",
  "hint",
  "eselsbruecke",
  "distractor",
];

describe("SERVICES (172 enriched AWS service cards)", () => {
  it("has exactly 172 services", () => {
    expect(SERVICES).toHaveLength(172);
  });

  it("has unique, contiguous nums 1..172", () => {
    const nums = SERVICES.map((s) => s.num).sort((a, b) => a - b);
    expect(new Set(nums).size).toBe(172);
    expect(nums[0]).toBe(1);
    expect(nums[171]).toBe(172);
  });

  it("exposes the 12 canonical categories in source order", () => {
    expect(SERVICE_DOMAINS).toEqual([
      "Compute",
      "Storage",
      "Datenbanken",
      "Netzwerk",
      "Sicherheit",
      "Management",
      "DevOps",
      "Analytik",
      "MLKI",
      "Integration",
      "Migration",
      "IoT",
    ]);
  });

  it("every card's domain is one of the 12 categories", () => {
    const known = new Set(SERVICE_DOMAINS);
    for (const s of SERVICES) {
      expect(known.has(s.domain)).toBe(true);
    }
  });

  it("every card has non-empty required text fields and a partners array", () => {
    for (const s of SERVICES) {
      for (const key of REQUIRED_TEXT) {
        expect(typeof s[key] === "string" && (s[key] as string).length > 0).toBe(
          true,
        );
      }
      expect(Array.isArray(s.partners)).toBe(true);
    }
  });

  it("every card carries a skriptRef with a valid chapter number", () => {
    // Anchor existence against the markdown files is covered by
    // skript-anchors.test.ts; here we only guard the mapped shape.
    for (const s of SERVICES) {
      expect(s.skriptRef, s.title).toBeDefined();
      expect(s.skriptRef.chapter).toBeGreaterThanOrEqual(1);
      expect(s.skriptRef.chapter).toBeLessThanOrEqual(13);
    }
  });
});
