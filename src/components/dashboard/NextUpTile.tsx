import Link from "next/link";
import { BRAND_ORANGE } from "@/lib/brand";
import type { DomainOverview } from "@/db/repository";

// "Next up" CTA tile: points at the weakest practiced domain (or generic
// start). Orange strictly as signal on the single CTA (mockup .btn-cta).
export function NextUpTile({ stats }: { stats: DomainOverview[] }) {
  const practiced = stats.filter((s) => s.avgCorrectRate !== null);
  const weakest =
    practiced.length > 0
      ? practiced.reduce((min, s) =>
          s.avgCorrectRate! < min.avgCorrectRate! ? s : min,
        )
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="text-base font-semibold tracking-[-0.01em] text-ink">
        {weakest ? weakest.domain : "Erste Runde starten"}
      </div>
      <p className="mb-4 mt-1.5 flex-1 text-[12.5px] leading-relaxed text-ink-soft">
        {weakest
          ? `Deine schwächste Domain (${Math.round(
              (weakest.avgCorrectRate ?? 0) * 100,
            )} %). Eine fokussierte Runde bringt hier am meisten.`
          : "Noch keine Daten — starte eine erste Quiz-Runde, um Readiness und Mastery zu füllen."}
      </p>
      <div>
        <Link
          href="/quiz"
          className="inline-block rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-px"
          style={{ background: BRAND_ORANGE, color: "var(--cta-ink)" }}
        >
          Quiz starten
        </Link>
      </div>
    </div>
  );
}
