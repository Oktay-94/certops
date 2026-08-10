"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Both views are server-rendered into the HTML and stay in the DOM; this
// component only flips which one is visible. Reading the view from
// searchParams in the page instead would make the route dynamic and cost all
// SCENARIO_COUNT prerendered paths — hence the client hook plus the <Suspense>
// boundary the page wraps this in.

const LANG = "lang";

export function NarrativeSwitch({
  short,
  long,
}: {
  short: ReactNode;
  long: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // ?v=lang and nothing else opens the long view — any other value, and a
  // missing parameter, mean short. The URL is the only state.
  const isLang = useSearchParams().get("v") === LANG;

  function show(lang: boolean) {
    if (lang === isLang) return;
    // replace, not push: switching views should not pile up history entries.
    // scroll: false keeps the reading position.
    router.replace(lang ? `${pathname}?v=${LANG}` : pathname, {
      scroll: false,
    });
  }

  return (
    <>
      <div
        role="group"
        aria-label="Fassung wechseln"
        className="mt-8 flex w-fit items-center gap-1 rounded-full border border-line bg-surface-2 p-0.5 text-[13.5px]"
      >
        <button
          type="button"
          aria-pressed={!isLang}
          onClick={() => show(false)}
          className={`rounded-full px-3.5 py-1.5 font-medium transition ${
            !isLang
              ? "bg-surface text-ink shadow-[0_1px_2px_rgba(24,24,27,0.06)]"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Kurz
        </button>
        <button
          type="button"
          aria-pressed={isLang}
          onClick={() => show(true)}
          className={`rounded-full px-3.5 py-1.5 font-medium transition ${
            isLang
              ? "bg-surface text-ink shadow-[0_1px_2px_rgba(24,24,27,0.06)]"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Ausführlich
        </button>
      </div>
      <div hidden={isLang}>{short}</div>
      <div hidden={!isLang}>{long}</div>
    </>
  );
}
