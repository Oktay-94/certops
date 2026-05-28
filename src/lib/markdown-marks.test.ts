import { describe, it, expect } from "vitest";
import { addServiceMarkers } from "./markdown-marks";

describe("addServiceMarkers", () => {
  it("leaves text without service names untouched", () => {
    const t = "Generic sentence with no AWS service mention.";
    expect(addServiceMarkers(t)).toBe(t);
  });

  it("marks a single service name outside any markup", () => {
    expect(addServiceMarkers("EC2 ist ein virtueller Server.")).toBe(
      "==EC2== ist ein virtueller Server.",
    );
  });

  it("does NOT mark service names inside bold spans", () => {
    const input = "**EC2:** virtuelle Server.";
    expect(addServiceMarkers(input)).toBe(input);
  });

  it("is idempotent on already-marked text", () => {
    const input = "==EC2== ist ein Server.";
    expect(addServiceMarkers(input)).toBe(input);
  });

  it("marks multiple service names in one sentence", () => {
    expect(addServiceMarkers("EC2 und Lambda sind Compute.")).toBe(
      "==EC2== und ==Lambda== sind Compute.",
    );
  });

  it("prefers the longest alias (Amazon EC2 over EC2)", () => {
    expect(addServiceMarkers("Amazon EC2 ist Compute.")).toBe(
      "==Amazon EC2== ist Compute.",
    );
  });

  it("running twice produces the same result", () => {
    const input = "EC2 mit S3 und **Lambda:** serverless.";
    const once = addServiceMarkers(input);
    const twice = addServiceMarkers(once);
    expect(twice).toBe(once);
  });

  it("respects bold AND mark spans together", () => {
    const input = "**On-Demand:** EC2 läuft auf ==S3== Buckets.";
    expect(addServiceMarkers(input)).toBe(
      "**On-Demand:** ==EC2== läuft auf ==S3== Buckets.",
    );
  });
});
