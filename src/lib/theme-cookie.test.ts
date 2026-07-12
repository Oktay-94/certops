import { describe, expect, it } from "vitest";
import {
  THEME_COOKIE,
  isValidTheme,
  themeCookieOptions,
} from "./theme-cookie";

describe("theme-cookie", () => {
  it("validates only light/dark", () => {
    expect(isValidTheme("light")).toBe(true);
    expect(isValidTheme("dark")).toBe(true);
    expect(isValidTheme("auto")).toBe(false);
    expect(isValidTheme(undefined)).toBe(false);
    expect(isValidTheme("")).toBe(false);
  });

  it("options: NOT httpOnly (inline script must read it), lax, path=/", () => {
    const opts = themeCookieOptions("dark");
    expect(opts.name).toBe(THEME_COOKIE);
    expect(opts.value).toBe("dark");
    expect(opts.httpOnly).toBe(false);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(60 * 60 * 24 * 365 * 10);
  });
});

// SSG guard: the root layout must never read cookies server-side — a
// cookies()/next/headers call there flips every static route to dynamic.
// Cheap source-level regression check, mirrors the invariant in DESIGN.md.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("SSG guard: root layout", () => {
  const layoutSource = readFileSync(
    resolve(__dirname, "../app/layout.tsx"),
    "utf8",
  );

  it("does not import next/headers", () => {
    // Import form only — comments may mention the module name when explaining
    // exactly this invariant.
    expect(layoutSource).not.toMatch(/from\s+["']next\/headers["']/);
    expect(layoutSource).not.toMatch(/require\(["']next\/headers["']\)/);
  });

  it("keeps the static no-flash theme script", () => {
    expect(layoutSource).toContain("certops_theme=dark");
    expect(layoutSource).toContain("suppressHydrationWarning");
  });
});
