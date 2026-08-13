import Link from "next/link";
import { notFound } from "next/navigation";
import { SZENARIEN_GLYPH, listScenarios } from "@/lib/scenario-content";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { ScenarioGrid } from "./ScenarioGrid";

export const metadata = {
  title: "Szenarien — SAA Battle Cards — CertOps",
};

// SAA-only: die Battle Cards gehören zum SAA-Track — /clf/szenarien 404t.
export default async function SzenarienPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  if ((await params).exam !== "saa") notFound();

  // Build-time data (fs + gray-matter); the client component only filters.
  const scenarios = listScenarios();

  return (
    <main className="relative mx-auto w-full max-w-[1120px] px-6 py-10 sm:py-12">
      <ScrollBackground />
      {/* Same back link the neighbouring index pages carry — markup, position
          and text copied verbatim from /[exam]/quiz (top of page, after the
          background). Deliberately not extracted into a shared component: that
          would refactor four working pages for no gain here. */}
      <Link
        href="/saa"
        className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-line-strong"
      >
        ← Zurück zum Dashboard
      </Link>
      <div className="mb-3.5 mt-6 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        <span className="h-px w-8 bg-line-strong" aria-hidden />
        {SZENARIEN_GLYPH} Szenarien
      </div>
      <h1 className="text-[clamp(26px,4vw,40px)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
        Architektur-Battle-Cards
      </h1>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
        {scenarios.length} Szenarien: Diagramm, Signalwörter, Klassiker-Fallen ·
        D1–D4
      </p>

      <ScenarioGrid
        scenarios={scenarios.map((s) => ({
          nr: s.nr,
          slug: s.slug,
          title: s.title,
          services: s.services,
          domains: s.domains,
        }))}
      />
    </main>
  );
}
