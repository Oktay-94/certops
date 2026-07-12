"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Stagger-reveal for bento tiles — the ONLY use of `motion` in the app
// (LazyMotion + m keeps the initial bundle at ~4.6 KB). Total stagger stays
// ≤ ~0.3s (mockup .rise timing); reduced motion renders a plain static div.
// Always renders a real element so it can carry grid col-span classes.
export function StaggerReveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className={className}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.55,
          delay: 0.03 + index * 0.05,
          ease: [0.22, 0.9, 0.3, 1],
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
