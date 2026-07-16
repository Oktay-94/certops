import { cookies } from "next/headers";
import { PROFILE_DISPLAY_COOKIE, isValidProfileId } from "@/lib/profiles";

export const PROFILE_COOKIE = "certops_profile";
const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

// Reads the active profile id from the cookie. Returns null on first visit
// (no cookie) — we never silently default; the dashboard asks "who's learning".
export async function getActiveProfileId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(PROFILE_COOKIE)?.value;
  return isValidProfileId(value) ? value : null;
}

// Cookie options mirror certops_session_id / certops_round_id in middleware.ts.
export function profileCookieOptions(value: string) {
  return {
    name: PROFILE_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEN_YEARS_SECONDS,
  };
}

// Display mirror (see PROFILE_DISPLAY_COOKIE in profiles.ts): deliberately
// NOT httpOnly so the cookie-free sticky header can show the active profile
// without flipping SSG routes dynamic. Contains only the profile id.
export function profileDisplayCookieOptions(value: string) {
  return {
    name: PROFILE_DISPLAY_COOKIE,
    value,
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEN_YEARS_SECONDS,
  };
}
