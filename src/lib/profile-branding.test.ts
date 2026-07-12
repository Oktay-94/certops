import { describe, expect, it } from "vitest";
import { getProfileBranding } from "./profile-branding";

describe("getProfileBranding", () => {
  it("maps oktay to blue tokens and the oktay logo", () => {
    const b = getProfileBranding("oktay");
    expect(b?.logoSrc).toBe("/logo-oktay.png");
    expect(b?.profileName).toBe("Oktay");
    expect(b?.pill).toEqual({
      bg: "bg-blue-50 dark:bg-blue-950",
      border: "border-blue-300 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
    });
  });

  it("maps merve to rose tokens and the merve logo", () => {
    const b = getProfileBranding("merve");
    expect(b?.logoSrc).toBe("/logo-merve.png");
    expect(b?.profileName).toBe("Merve");
    expect(b?.pill).toEqual({
      bg: "bg-rose-50 dark:bg-rose-950",
      border: "border-rose-300 dark:border-rose-800",
      text: "text-rose-800 dark:text-rose-200",
    });
  });

  it("returns undefined for null, empty or unknown ids", () => {
    expect(getProfileBranding(null)).toBeUndefined();
    expect(getProfileBranding(undefined)).toBeUndefined();
    expect(getProfileBranding("")).toBeUndefined();
    expect(getProfileBranding("nobody")).toBeUndefined();
  });
});
