import type { ReactNode } from "react";

// Bento tile shell (mockup .tile + .t-label): surface card, hairline border,
// mono uppercase label row with optional right-aligned value. Optional emoji
// glyph (same size/hover animation as the area tiles — .area-glyph animates
// on .bento-tile hover, see globals.css).
export function Tile({
  label,
  glyph,
  value,
  className = "",
  children,
}: {
  label: string;
  glyph?: string;
  value?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`bento-tile relative overflow-hidden rounded-xl border border-line bg-surface p-5 ${className}`}
    >
      <div className="mb-3.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        <span className="flex items-center gap-2">
          {glyph && (
            <span className="area-glyph text-[30px] leading-none" aria-hidden>
              {glyph}
            </span>
          )}
          {label}
        </span>
        {value && <span className="tracking-[0.06em] text-ink-soft">{value}</span>}
      </div>
      {children}
    </div>
  );
}
