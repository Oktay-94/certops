import type { ReactNode } from "react";

// Stagger-reveal for bento tiles — CSS-only (mockup .rise pattern).
// History: first built with `motion` (LazyMotion + m), but even the async-
// features split kept ~30 KB gz of animation code in the route while the
// perf gate is 200 KB total JS (measured 2026-07-12). The implementation
// plan's own overrun rule ("Motion strikt reduzieren") applies: identical
// visual via @keyframes rise in globals.css, zero JS, reduced-motion handled
// by the global media query. Server component; carries grid col-span classes.
export function StaggerReveal({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <div
      className={`rise ${className}`}
      style={{ animationDelay: `${0.03 + index * 0.05}s` }}
    >
      {children}
    </div>
  );
}
