"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { UserRound } from "lucide-react";
import { PROFILES, getOtherProfile, getProfileById } from "@/lib/profiles";
import { getProfileBranding } from "@/lib/profile-branding";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { setActiveProfile } from "@/app/profile-actions";

type Props = { activeProfileId: string | null };

export function ProfileSwitcher({ activeProfileId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(id: string) {
    startTransition(async () => {
      await setActiveProfile(id);
      router.refresh();
    });
  }

  // First visit — no profile yet. Ask once, no silent default.
  if (!activeProfileId) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-line dark:bg-surface">
        <p className="text-sm font-medium text-zinc-900 dark:text-ink">
          Wer lernt gerade?
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-ink-soft">
          Fortschritt wird pro Person getrennt gespeichert.
        </p>
        <div className="mt-3 flex gap-2">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => choose(p.id)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 disabled:opacity-50 dark:border-line dark:bg-surface-2 dark:text-ink dark:hover:border-line-strong"
            >
              <UserRound className="h-4 w-4 text-zinc-500 dark:text-ink-faint" aria-hidden />
              {p.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const active = getProfileById(activeProfileId);
  const other = getOtherProfile(activeProfileId);
  const branding = getProfileBranding(activeProfileId);
  const pill = branding
    ? `${branding.pill.bg} ${branding.pill.border} ${branding.pill.text}`
    : "bg-white border-zinc-200 text-zinc-900 dark:bg-surface dark:border-line dark:text-ink";

  // Active indicator — click switches to the other fixed profile.
  // Avatar inherits the pill text color via fill="currentColor".
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => other && choose(other.id)}
      title={other ? `Zu ${other.name} wechseln` : undefined}
      className={`inline-flex items-center gap-2 rounded-full border py-1.5 pl-3 pr-3 text-sm font-medium transition hover:border-zinc-400 disabled:opacity-50 ${pill}`}
    >
      <ProfileAvatar profileId={activeProfileId} />
      <span>{active?.name ?? "Profil"}</span>
      {other && (
        <span className="text-xs text-zinc-400 dark:text-ink-faint">
          → {other.name}
        </span>
      )}
    </button>
  );
}
