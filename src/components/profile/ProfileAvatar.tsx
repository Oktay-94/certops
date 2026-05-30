// Gender-distinct avatar icons. lucide-react 0.383.0 has no person icons that
// read as male/female, so these are small hand-rolled SVGs. fill="currentColor"
// makes them inherit the surrounding text color (e.g. the switcher pill color).

type Props = { profileId: string; size?: number };

export function ProfileAvatar({ profileId, size = 18 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor" as const,
    "aria-hidden": true,
  };

  if (profileId === "merve") {
    return (
      <svg {...common}>
        <path d="M12 3 C7.6 3 5.5 6 5.5 9.5 C5.5 13 6.2 15.5 6.8 17 L9 17 C8.3 15 8 12.5 8.2 11 C9.2 12 14.8 12 15.8 11 C16 12.5 15.7 15 15 17 L17.2 17 C17.8 15.5 18.5 13 18.5 9.5 C18.5 6 16.4 3 12 3 Z" />
        <circle cx="12" cy="9" r="3.4" />
        <path d="M6 20.5 C6 16.3 8.9 14 12 14 C15.1 14 18 16.3 18 20.5 Z" />
      </svg>
    );
  }

  // oktay (and default)
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4.2" />
      <path d="M4.5 20.5 C4.5 15.8 7.8 13.5 12 13.5 C16.2 13.5 19.5 15.8 19.5 20.5 Z" />
    </svg>
  );
}
