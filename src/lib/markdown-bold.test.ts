import { describe, it, expect } from "vitest";
import { addBoldedTerms } from "./markdown-bold";

describe("addBoldedTerms", () => {
  it("leaves text without 'Begriff:' pattern untouched", () => {
    const t = "Just a sentence without any colon structure.";
    expect(addBoldedTerms(t)).toBe(t);
  });

  it("bolds a single term at the start", () => {
    expect(addBoldedTerms("EC2: virtuelle Server.")).toBe(
      "**EC2:** virtuelle Server.",
    );
  });

  it("bolds multiple terms separated by '. '", () => {
    const input =
      "On-Demand: pay-per-Stunde. Reserved Instances: 1-Jahres-Vertrag.";
    const out = addBoldedTerms(input);
    expect(out).toContain("**On-Demand:** pay-per-Stunde");
    expect(out).toContain("**Reserved Instances:** 1-Jahres-Vertrag");
  });

  it("is idempotent when text already contains bold markup", () => {
    const already = "**On-Demand:** pay. Reserved: foo.";
    expect(addBoldedTerms(already)).toBe(already);
  });

  it("running twice produces the same result", () => {
    const input = "Lambda: serverless. Fargate: containers.";
    const once = addBoldedTerms(input);
    const twice = addBoldedTerms(once);
    expect(twice).toBe(once);
  });

  it("ignores lowercase-start tokens before colon", () => {
    expect(addBoldedTerms("foo: bar.")).toBe("foo: bar.");
  });
});
