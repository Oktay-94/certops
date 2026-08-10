import type { Narrative, NarrativeSectionKey } from "@/lib/scenario-content";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";

// Server component on purpose: SkriptMarkdown is one too, and the collapsing
// is native <details>, so this whole view needs no client JS.

/** Sections that start expanded — the entry point and the takeaway. */
const OPEN_BY_DEFAULT: readonly NarrativeSectionKey[] = [
  "Die Grundidee zuerst",
  "Wenn du dir eine Sache merkst",
];

/**
 * The `## ` line becomes the <summary>, so it must not be rendered a second
 * time inside the body. Everything below it is untouched — the h3 under
 * "Der Weg durch die Karte" stay in place and SkriptMarkdown renders them.
 */
function bodyWithoutHeading(markdown: string): string {
  return markdown.replace(/^## .*\n?/, "").trim();
}

export function NarrativeView({ narrative }: { narrative: Narrative }) {
  return (
    <div className="mt-6 space-y-3">
      {narrative.sections.map((s) => (
        <details
          key={s.slug}
          open={OPEN_BY_DEFAULT.includes(s.key)}
          className="group rounded-2xl border border-line bg-surface px-6 py-5 shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_-16px_rgba(24,24,27,0.10)] dark:shadow-none sm:px-9 sm:py-6"
        >
          <summary className="flex cursor-pointer list-none items-center gap-3 text-[19px] font-semibold leading-snug tracking-[-0.011em] text-ink [overflow-wrap:anywhere] marker:content-none [&::-webkit-details-marker]:hidden">
            <span
              className="shrink-0 text-[color:var(--accent)] transition-transform group-open:rotate-90"
              aria-hidden
            >
              ›
            </span>
            {s.text}
          </summary>
          <div className="mt-3">
            <SkriptMarkdown markdown={bodyWithoutHeading(s.markdown)} />
          </div>
        </details>
      ))}
    </div>
  );
}
