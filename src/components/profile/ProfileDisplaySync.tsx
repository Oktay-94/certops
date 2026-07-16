"use client";

import { useEffect } from "react";
import { PROFILE_DISPLAY_COOKIE } from "@/lib/profiles";

export const PROFILE_DISPLAY_EVENT = "certops:profile-display";

// Bootstrap healer for the header profile pill: profiles chosen BEFORE the
// display-mirror cookie existed have only the httpOnly identity cookie. The
// dashboard (dynamic, knows the server-side profile) mounts this island to
// write the mirror client-side and notify the header. No-op once in sync.
export function ProfileDisplaySync({ profileId }: { profileId: string }) {
  useEffect(() => {
    const current = document.cookie.match(
      new RegExp(`(?:^|; )${PROFILE_DISPLAY_COOKIE}=([^;]*)`),
    )?.[1];
    if (current === profileId) return;
    const tenYears = 60 * 60 * 24 * 365 * 10;
    document.cookie = `${PROFILE_DISPLAY_COOKIE}=${profileId}; path=/; max-age=${tenYears}; samesite=lax`;
    window.dispatchEvent(new Event(PROFILE_DISPLAY_EVENT));
  }, [profileId]);

  return null;
}
