// Profile-specific branding: logo + switcher pill colors. Single source for
// both the dashboard logo (server) and the ProfileSwitcher pill (client).
// Tailwind classes are explicit string literals so the JIT purge keeps them —
// same convention as domain-colors.ts. Avatar SVGs live in ProfileAvatar.tsx
// (JSX), not here, so this stays a pure, testable data module.
//
// Deliberate color reuse: blue is otherwise the Cloud-Concepts domain color,
// rose the Security one — in the switcher context this overlap is intentional.

export type ProfileBranding = {
  logoSrc: string;
  profileName: string;
  pill: { bg: string; border: string; text: string };
};

// Pill classes carry explicit dark: literals (data-theme driven variant,
// see globals.css @custom-variant) — still purge-safe full strings.
const BRANDING: Record<string, ProfileBranding> = {
  oktay: {
    logoSrc: "/logo-oktay.png",
    profileName: "Oktay",
    pill: {
      bg: "bg-blue-50 dark:bg-blue-950",
      border: "border-blue-300 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
    },
  },
  merve: {
    logoSrc: "/logo-merve.png",
    profileName: "Merve",
    pill: {
      bg: "bg-rose-50 dark:bg-rose-950",
      border: "border-rose-300 dark:border-rose-800",
      text: "text-rose-800 dark:text-rose-200",
    },
  },
};

export function getProfileBranding(
  id: string | null | undefined,
): ProfileBranding | undefined {
  if (!id) return undefined;
  return BRANDING[id];
}
