"use client";

import { useEffect, useRef } from "react";

// Ring geometry per mockup buildRing(): C=66, R=52, 48 outside ticks (every
// 6th long), track+arc stroke 7, arc animates via stroke-dashoffset.
const C = 66;
const R = 52;
const TICKS = 48;
export const RING_CIRC = 2 * Math.PI * R;

/** Final dashoffset for a 0–100 value (exported for tests). */
export function ringDashOffset(value: number): number {
  const clamped = Math.max(0, Math.min(100, value));
  return RING_CIRC * (1 - clamped / 100);
}

type Tick = { x1: number; y1: number; x2: number; y2: number; long: boolean };

// 2 decimals: raw cos/sin floats serialize differently between SSR and client
// hydration (dev-only warning); the rounding is visually invisible (<0.01px).
const round2 = (n: number) => Number(n.toFixed(2));

function buildTicks(): Tick[] {
  return Array.from({ length: TICKS }, (_, i) => {
    const a = (i / TICKS) * 2 * Math.PI - Math.PI / 2;
    const long = i % 6 === 0;
    const r1 = R + 6;
    const r2 = R + (long ? 12 : 9);
    return {
      x1: round2(C + r1 * Math.cos(a)),
      y1: round2(C + r1 * Math.sin(a)),
      x2: round2(C + r2 * Math.cos(a)),
      y2: round2(C + r2 * Math.sin(a)),
      long,
    };
  });
}

const TICK_ELEMENTS = buildTicks();

export function ReadinessRing({
  value,
  size = 132,
  accent = "var(--accent)",
}: {
  value: number;
  size?: number;
  accent?: string;
}) {
  const arcRef = useRef<SVGCircleElement>(null);
  const target = ringDashOffset(value);

  useEffect(() => {
    const arc = arcRef.current;
    if (!arc) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      arc.style.transition = "none";
      arc.style.strokeDashoffset = String(target);
      return;
    }
    // Double rAF: paint the full-offset frame first, then transition in.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        arc.style.strokeDashoffset = String(target);
      }),
    );
  }, [target]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 132 132"
      role="img"
      aria-label={`Readiness ${Math.round(value)} von 100`}
      className="shrink-0"
    >
      {TICK_ELEMENTS.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="var(--ink-faint)"
          strokeWidth={t.long ? 1.4 : 0.8}
          opacity={t.long ? 0.7 : 0.35}
        />
      ))}
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke="var(--surface-2)"
        strokeWidth={7}
      />
      <circle
        ref={arcRef}
        className="ring-arc"
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke={accent}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={RING_CIRC}
        strokeDashoffset={RING_CIRC}
        transform={`rotate(-90 ${C} ${C})`}
        style={{
          transition:
            "stroke-dashoffset 1.1s cubic-bezier(.22,.9,.3,1) .25s",
        }}
      />
    </svg>
  );
}
