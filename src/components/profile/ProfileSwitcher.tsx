"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { UserRound } from "lucide-react";
import { BRAND_ORANGE } from "@/lib/brand";
import { PROFILES, getOtherProfile, getProfileById } from "@/lib/profiles";
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
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-medium text-zinc-900">Wer lernt gerade?</p>
        <p className="mt-1 text-xs text-zinc-500">
          Fortschritt wird pro Person getrennt gespeichert.
        </p>
        <div className="mt-3 flex gap-2">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => choose(p.id)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 disabled:opacity-50"
            >
              <UserRound className="h-4 w-4 text-zinc-500" aria-hidden />
              {p.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const active = getProfileById(activeProfileId);
  const other = getOtherProfile(activeProfileId);

  // Active indicator — click switches to the other fixed profile.
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => other && choose(other.id)}
      title={other ? `Zu ${other.name} wechseln` : undefined}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 disabled:opacity-50"
    >
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: BRAND_ORANGE }}
        aria-hidden
      >
        <UserRound className="h-3.5 w-3.5" />
      </span>
      <span>{active?.name ?? "Profil"}</span>
      {other && (
        <span className="text-xs text-zinc-400">→ {other.name}</span>
      )}
    </button>
  );
}
