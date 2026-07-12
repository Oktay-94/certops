"use client";

import { useSyncExternalStore } from "react";
import { THEME_COOKIE, type Theme } from "@/lib/theme-cookie";

const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

// The <html data-theme> attribute IS the theme state (set pre-paint by the
// no-flash script in layout.tsx). No local React state: useSyncExternalStore
// reads the attribute and a MutationObserver keeps the control in sync.
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

// Pill toggle 1:1 from the mockups (weitere-seiten .theme-toggle, 56×28,
// knob 22×22, translateX(28px) in light, .28s cubic-bezier; hover border
// from the diagramm-quiz variant). Sun/moon are text glyphs like the mockup.
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light");
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={next === "dark" ? "Dark Mode aktivieren" : "Light Mode aktivieren"}
      title={next === "dark" ? "Dark Mode" : "Light Mode"}
      onClick={() => persistTheme(next)}
      className="relative h-7 w-14 cursor-pointer rounded-full border border-line bg-surface-2 transition-colors hover:border-line-strong"
    >
      <span
        aria-hidden
        className="absolute left-[2px] top-[2px] flex h-[22px] w-[22px] items-center justify-center rounded-full border border-line-strong bg-surface text-[11px] transition-transform duration-[280ms] ease-[cubic-bezier(.22,.9,.3,1)]"
        style={{
          transform: theme === "light" ? "translateX(28px)" : "translateX(0)",
        }}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
