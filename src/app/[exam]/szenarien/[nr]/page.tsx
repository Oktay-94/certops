import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  SCENARIO_COUNT,
  getScenario,
  listScenarios,
  readNarrative,
  scenarioSlug,
  splitScenarioBody,
} from "@/lib/scenario-content";
import { domainColorVars, getDomainColor } from "@/lib/domain-colors";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { NarrativeSwitch } from "./NarrativeSwitch";
import { NarrativeView } from "./NarrativeView";

// Fully static: all SCENARIO_COUNT cards prerender at build time (fs + gray-matter);
// anything outside the enumerated slugs 404s via dynamicParams=false.
export function generateStaticParams() {
  return listScenarios().map((s) => ({ exam: "saa", nr: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exam: string; nr: string }>;
}) {
  const { nr } = await params;
  const scenario = getScenario(nr);
  return {
    title: scenario
      ? `${scenario.meta.title} — SAA-Szenarien`
      : "SAA-Szenarien",
  };
}

export default async function SzenarioDetailPage({
  params,
}: {
  params: Promise<{ exam: string; nr: string }>;
}) {
  const { exam, nr } = await params;
  if (exam !== "saa") notFound();
  const scenario = getScenario(nr);
  if (!scenario) notFound();

  const { meta, body } = scenario;
  // splitScenarioBody, not splitChapter — it drops the production-note sections.
  const { intro, sections } = splitScenarioBody(body);
  // null for every card without a narrative.md (40–100 today) — the switch is
  // then not rendered at all.
  const narrative = readNarrative(meta.nr);
  const prevNr = meta.nr > 1 ? meta.nr - 1 : undefined;
  const nextNr = meta.nr < SCENARIO_COUNT ? meta.nr + 1 : undefined;

  const shortView = (
    <>
      {intro && (
        <div className="mt-6 text-[16.5px] text-ink-soft">
          <SkriptMarkdown markdown={intro} />
        </div>
      )}

      {sections.map((s) => (
        <article
          key={s.slug}
          className="mt-6 rounded-2xl border border-line bg-surface px-6 py-7 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_-16px_rgba(24,24,27,0.10)] dark:shadow-none sm:px-9 sm:py-8"
        >
          <SkriptMarkdown markdown={s.markdown} anchorPrefix={meta.slug} />
        </article>
      ))}
    </>
  );

  return (
    <div
      lang="de"
      style={domainColorVars(meta.domains[0])}
      className="relative min-h-screen"
    >
      <ScrollBackground />
      {/* Sticky breadcrumb with blur — same shell as the readers. */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-[760px] items-center gap-2.5 px-6 py-3 text-[13.5px] text-ink-soft">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full bg-[color:var(--accent)]"
            aria-hidden
          />
          <Link
            href="/saa/szenarien"
            className="transition hover:text-[color:var(--accent)]"
          >
            Szenarien
          </Link>
          <span aria-hidden>›</span>
          <span className="truncate text-ink">
            #{meta.slug} · {meta.title}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-[760px] px-6 pb-24">
        <header className="pt-14">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {meta.domains.map((d, i) => (
              <span
                key={d}
                className={`inline-flex items-center rounded-full border px-3 py-[5px] text-[12px] font-semibold ${getDomainColor(d).tag} ${i > 0 ? "opacity-80" : ""}`}
              >
                {d}
              </span>
            ))}
          </div>
          <h1 className="text-[34px] font-bold leading-[1.12] tracking-[-0.021em] text-ink [overflow-wrap:anywhere] hyphens-auto">
            {meta.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {meta.signalwords.map((w) => (
              <span
                key={w}
                className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-[3px] font-mono text-[11.5px] text-ink-soft"
              >
                „{w}“
              </span>
            ))}
          </div>
          <a
            href={meta.pdfUrl}
            download
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition hover:border-[color:var(--accent)]"
          >
            ⬇ PDF herunterladen
          </a>
        </header>

        {/* Architecture diagram. Deliberately bg-white (not bg-surface): the
            SVGs are authored on a light canvas and must stay legible in dark
            mode. Plain <img> — next/image adds nothing for SVG. */}
        <div className="mt-8 rounded-2xl border border-line bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.svgUrl}
            alt={`Architekturdiagramm: ${meta.title}`}
            className="h-auto w-full"
          />
        </div>

        {/* Only the section area switches — header, diagram and pager are
            identical in both views, so the SVG stays in the DOM exactly once
            and the battle card sits above the narrative by construction.
            The <Suspense> boundary is mandatory: NarrativeSwitch calls
            useSearchParams(), and without a boundary Next.js opts the whole
            route into client-side rendering, losing all prerendered paths.
            The fallback is the short view, so the page reads fine in every
            state — including with JS off. */}
        {narrative ? (
          <Suspense fallback={shortView}>
            <NarrativeSwitch
              short={shortView}
              long={<NarrativeView narrative={narrative} />}
            />
          </Suspense>
        ) : (
          shortView
        )}

        {/* statusNote is deliberately not rendered: it carries the workshop
            log (qc.py counts, correction rounds, footer widths), which is not
            for the learner. The field stays parsed in scenario-content.ts so
            the history remains available in the repo. */}

        {/* Prev / next pager over the card numbers */}
        <div className="mt-11 flex gap-3.5">
          {prevNr ? (
            <Link
              href={`/saa/szenarien/${scenarioSlug(prevNr)}`}
              className="flex-1 rounded-2xl border border-line bg-surface px-[18px] py-4 transition hover:border-[color:var(--accent)]"
            >
              <div className="text-[12px] uppercase tracking-[0.04em] text-ink-faint">
                ‹ Vorher
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold text-ink">
                Karte #{scenarioSlug(prevNr)}
              </div>
            </Link>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
          {nextNr ? (
            <Link
              href={`/saa/szenarien/${scenarioSlug(nextNr)}`}
              className="flex-1 rounded-2xl border border-line bg-surface px-[18px] py-4 text-right transition hover:border-[color:var(--accent)]"
            >
              <div className="text-[12px] uppercase tracking-[0.04em] text-ink-faint">
                Weiter ›
              </div>
              <div className="mt-0.5 text-[15.5px] font-semibold text-ink">
                Karte #{scenarioSlug(nextNr)}
              </div>
            </Link>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
        </div>
      </main>
    </div>
  );
}
