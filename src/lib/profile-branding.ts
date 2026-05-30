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
  pill: { bg: string; border: string; text: string };
};

const BRANDING: Record<string, ProfileBranding> = {
  oktay: {
    logoSrc: "/logo-oktay.png",
    pill: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800" },
  },
  merve: {
    logoSrc: "/logo-merve.png",
    pill: { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-800" },
  },
};

export function getProfileBranding(
  id: string | null | undefined,
): ProfileBranding | undefined {
  if (!id) return undefined;
  return BRANDING[id];
}
