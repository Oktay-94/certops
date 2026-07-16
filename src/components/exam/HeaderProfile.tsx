"use client";

import { useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PROFILE_DISPLAY_COOKIE,
  getOtherProfile,
  getProfileById,
  isValidProfileId,
} from "@/lib/profiles";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PROFILE_DISPLAY_EVENT } from "@/components/profile/ProfileDisplaySync";
import { setActiveProfile } from "@/app/profile-actions";

// Compact profile pill for the cookie-free sticky header. Reads the
// non-httpOnly DISPLAY mirror cookie after mount (SSR renders nothing →
// hydration-safe); identity itself stays in the httpOnly cookie and is only
// ever read server-side. First visit (no cookie) renders nothing — the
// dashboard's "Wer lernt gerade?" chooser owns that flow. Known edge: an
// existing identity cookie WITHOUT the mirror (set before this feature)
// shows no pill until the next profile choice writes both.
function readDisplayCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${PROFILE_DISPLAY_COOKIE}=([^;]*)`),
  );
  const value = match?.[1];
  return isValidProfileId(value) ? value : null;
}

// The cookie is an external store (same pattern as ThemeToggle): snapshot =
// cookie read, change signal = the PROFILE_DISPLAY_EVENT that ProfileDisplaySync
// and the switch below dispatch. Server snapshot is null → SSR renders nothing.
function subscribe(onChange: () => void): () => void {
  window.addEventListener(PROFILE_DISPLAY_EVENT, onChange);
  return () => window.removeEventListener(PROFILE_DISPLAY_EVENT, onChange);
}

export function HeaderProfile() {
  const router = useRouter();
  const profileId = useSyncExternalStore(
    subscribe,
    readDisplayCookie,
    () => null,
  );
  const [pending, startTransition] = useTransition();

  if (!profileId) return null;

  const active = getProfileById(profileId);
  const other = getOtherProfile(profileId);

  function choose(id: string) {
    startTransition(async () => {
      await setActiveProfile(id);
      // The action's Set-Cookie has landed — notify all cookie subscribers.
      window.dispatchEvent(new Event(PROFILE_DISPLAY_EVENT));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending || !other}
      onClick={() => other && choose(other.id)}
      title={other ? `Zu ${other.name} wechseln` : undefined}
      aria-label={active ? `Profil: ${active.name}` : "Profil"}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 py-1 pl-2 pr-2 text-xs font-medium text-ink transition-colors hover:border-line-strong disabled:opacity-50 sm:pr-2.5"
    >
      <ProfileAvatar profileId={profileId} />
      {/* Name is the <sm space saver: avatar-only pill on phones. */}
      <span className="hidden sm:inline">{active?.name ?? "Profil"}</span>
    </button>
  );
}
