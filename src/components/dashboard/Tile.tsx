import type { ReactNode } from "react";

// Bento tile shell (mockup .tile + .t-label): surface card, hairline border,
// mono uppercase label row with optional right-aligned value.
export function Tile({
  label,
  value,
  className = "",
  children,
}: {
  label: string;
  value?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-line bg-surface p-5 ${className}`}
    >
      <div className="mb-3.5 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        <span>{label}</span>
        {value && <span className="tracking-[0.06em] text-ink-soft">{value}</span>}
      </div>
      {children}
    </div>
  );
}
