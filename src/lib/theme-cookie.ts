// Theme cookie — mirrors profile-cookie.ts, with ONE deliberate difference:
// httpOnly is FALSE because the no-flash inline script in layout.tsx must read
// it via document.cookie before first paint (no secret stored, only a UI pref).
// SSR reads via cookies() are allowed ONLY in already-dynamic pages — never in
// the root layout, or every static (SSG) route flips to dynamic rendering.

export const THEME_COOKIE = "certops_theme";
const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export function isValidTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

export function themeCookieOptions(value: Theme) {
  return {
    name: THEME_COOKIE,
    value,
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEN_YEARS_SECONDS,
  };
}
