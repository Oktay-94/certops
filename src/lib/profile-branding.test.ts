import { describe, expect, it } from "vitest";
import { getProfileBranding } from "./profile-branding";

describe("getProfileBranding", () => {
  it("maps oktay to blue tokens and the oktay logo", () => {
    const b = getProfileBranding("oktay");
    expect(b?.logoSrc).toBe("/logo-oktay.png");
    expect(b?.pill).toEqual({
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-800",
    });
  });

  it("maps merve to rose tokens and the merve logo", () => {
    const b = getProfileBranding("merve");
    expect(b?.logoSrc).toBe("/logo-merve.png");
    expect(b?.pill).toEqual({
      bg: "bg-rose-50",
      border: "border-rose-300",
      text: "text-rose-800",
    });
  });

  it("returns undefined for null, empty or unknown ids", () => {
    expect(getProfileBranding(null)).toBeUndefined();
    expect(getProfileBranding(undefined)).toBeUndefined();
    expect(getProfileBranding("")).toBeUndefined();
    expect(getProfileBranding("nobody")).toBeUndefined();
  });
});
