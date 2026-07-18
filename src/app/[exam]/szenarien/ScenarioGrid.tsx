"use client";

// Client grid for the Szenarien list — server page passes plain rows, the
// client only filters (same model as FlashcardGrid / UebersichtBrowser).
import { useMemo, useState } from "react";
import Link from "next/link";
import { SAA_C03_DOMAINS } from "@/lib/domains";
import { getDomainColor } from "@/lib/domain-colors";

export type ScenarioRow = {
  nr: number;
  slug: string;
  title: string;
  services: string[];
  /** Canonical domain names; [0] = primary. */
  domains: string[];
};

/** Chip label without the Amazon/AWS prefix ("Amazon EFS" → "EFS"). */
function shortLabel(text: string): string {
  return text.replace(/^(Amazon|AWS)\s+/, "");
}

export function ScenarioGrid({ scenarios }: { scenarios: ScenarioRow[] }) {
  const [domain, setDomain] = useState<string>("all");

  // Battle cards are deliberately multi-domain — a card also shows up under
  // its secondary domains, not just the primary one.
  const visible = useMemo(
    () =>
      domain === "all"
        ? scenarios
        : scenarios.filter((s) => s.domains.includes(domain)),
    [scenarios, domain],
  );

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          aria-label="Nach Prüfungs-Domäne filtern"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">Alle Bereiche</option>
          {SAA_C03_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span className="text-sm text-ink-faint">
          {visible.length} von {scenarios.length} Karten
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-faint">
          Keine Szenarien gefunden.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => {
            const primary = getDomainColor(s.domains[0]);
            return (
              <Link
                key={s.slug}
                href={`/saa/szenarien/${s.slug}`}
                className="flex overflow-hidden rounded-xl border border-line bg-surface transition hover:-translate-y-px hover:border-line-strong"
              >
                <div
                  className="w-[5px] shrink-0"
                  style={{ background: primary.solid }}
                  aria-hidden
                />
                <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
                  <div className="font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-faint">
                    #{s.slug}
                  </div>
                  <h2 className="text-[15px] font-semibold leading-snug text-ink">
                    {s.title}
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {s.services.map((svc) => (
                      <span
                        key={svc}
                        className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-[3px] text-[11.5px] font-medium text-ink-soft"
                      >
                        {shortLabel(svc)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {s.domains.map((d, i) => (
                      <span
                        key={d}
                        className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${getDomainColor(d).tag} ${i > 0 ? "opacity-80" : ""}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
