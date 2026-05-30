// Two fixed learners share the same content; progress is separated per profile
// via user_id (DB + cookie). This is a code constant, NOT a users table —
// YAGNI at two people, and no real auth is involved (id is the truth that
// lands in the DB/cookie; name is display-only).

export type Profile = { id: string; name: string };

export const PROFILES: readonly Profile[] = [
  { id: "oktay", name: "Oktay" },
  { id: "merve", name: "Merve" },
] as const;

export const PROFILE_IDS: readonly string[] = PROFILES.map((p) => p.id);

export function getProfileById(id: string | undefined | null): Profile | undefined {
  if (!id) return undefined;
  return PROFILES.find((p) => p.id === id);
}

export function isValidProfileId(id: string | undefined | null): id is string {
  return getProfileById(id) !== undefined;
}

// The "other" profile — used by the dashboard switcher to toggle between the
// two fixed learners with a single click.
export function getOtherProfile(id: string): Profile | undefined {
  return PROFILES.find((p) => p.id !== id);
}
