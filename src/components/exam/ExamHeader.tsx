import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { ExamSlug } from "@/lib/exam";
import { ExamSwitcher } from "./ExamSwitcher";
import { HeaderProfile } from "./HeaderProfile";

// Crumb text per mockup (statistik-v3 #exam-name).
const CRUMB: Record<ExamSlug, { code: string; label: string }> = {
  clf: { code: "CLF-C02", label: "Bestanden" },
  saa: { code: "SAA-C03", label: "Solutions Architect" },
};

// Sticky header 1:1 from the mockups: translucent canvas + blur, hairline
// border, wordmark + crumb left, controls right. Server component, no
// cookies — SSG routes underneath stay static.
export function ExamHeader({ exam }: { exam: ExamSlug }) {
  const crumb = CRUMB[exam];
  return (
    <header
      className="sticky top-0 z-40 border-b border-line backdrop-blur-[14px]"
      style={{ background: "color-mix(in srgb, var(--canvas) 82%, transparent)" }}
    >
      <div className="mx-auto flex max-w-[1120px] items-center gap-3.5 px-6 py-3">
        <span className="flex items-center gap-2 text-base font-bold tracking-[-0.02em] text-ink">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "var(--orange-bright)" }}
            aria-hidden
          />
          CertOps
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint sm:inline">
          {crumb.code} · <b className="font-medium text-ink-soft">{crumb.label}</b>
        </span>
        <div className="ml-auto flex items-center gap-2.5">
          <HeaderProfile />
          <ExamSwitcher exam={exam} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
