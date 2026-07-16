"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ExamSlug } from "@/lib/exam";
import { switchExamPath } from "@/lib/exam-path";

// Pill labels per mockup header: the CLF pill carries the passed badge
// (statically — the header must stay cookie-free so SSG routes stay static).
// shortLabel is the <sm variant so the header row fits a 360px viewport.
const PILLS: { slug: ExamSlug; label: string; shortLabel: string }[] = [
  { slug: "clf", label: "CLF-C02 ✓", shortLabel: "CLF ✓" },
  { slug: "saa", label: "SAA-C03", shortLabel: "SAA" },
];

export function ExamSwitcher({ exam }: { exam: ExamSlug }) {
  const router = useRouter();
  const pathname = usePathname();

  function onSwitch(target: ExamSlug) {
    if (target === exam) return;
    const href = switchExamPath(pathname, target);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // View transition per mockup (.45s on ::view-transition in globals.css);
    // without browser support or with reduced motion it is a plain navigation.
    if (document.startViewTransition && !reduced) {
      document.startViewTransition(() => {
        router.push(href);
      });
    } else {
      router.push(href);
    }
  }

  return (
    <div
      role="group"
      aria-label="Exam wechseln"
      className="flex items-center gap-1 rounded-full border border-line bg-surface-2 p-0.5"
    >
      {PILLS.map(({ slug, label, shortLabel }) => {
        const active = slug === exam;
        return (
          <button
            key={slug}
            type="button"
            aria-pressed={active}
            aria-label={label}
            onClick={() => onSwitch(slug)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
              active
                ? "bg-surface text-accent shadow-[inset_0_0_0_1px_var(--accent)]"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
