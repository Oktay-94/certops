"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_COOKIE, type Theme } from "@/lib/theme-cookie";

const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

// The <html data-theme> attribute IS the theme state (set pre-paint by the
// no-flash script in layout.tsx). No local React state: useSyncExternalStore
// reads the attribute and a MutationObserver keeps the button in sync.
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

// Client-only cookie write on purpose: a Server Action + revalidatePath would
// touch the whole route tree; the theme is pure client presentation state and
// the no-flash script picks the cookie up on the next load.
function persistTheme(theme: Theme): void {
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${TEN_YEARS_SECONDS}; samesite=lax`;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light");
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={next === "dark" ? "Dark Mode aktivieren" : "Light Mode aktivieren"}
      title={next === "dark" ? "Dark Mode" : "Light Mode"}
      onClick={() => persistTheme(next)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
