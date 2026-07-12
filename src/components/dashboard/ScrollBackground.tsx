"use client";

import { useEffect, useRef } from "react";

// Fixed blueprint grid + two glows that drift with scroll (mockup:
// certops-weitere-seiten.html). Drives only the --scrollp custom property on
// its own element — no body/layout mutation. Passive listener + rAF throttle;
// prefers-reduced-motion keeps the background fully static.
export function ScrollBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        el.style.setProperty("--scrollp", (window.scrollY / max).toFixed(3));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div ref={ref} aria-hidden className="scroll-bg" />;
}
