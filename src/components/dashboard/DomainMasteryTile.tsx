import { CLF_C02_DOMAINS, CLF_C02_DOMAIN_WEIGHTS } from "@/lib/domains";
import { BRAND_ORANGE } from "@/lib/brand";
import { scoreColorClass } from "@/lib/scoreColor";
import type { DomainOverview } from "@/db/repository";

// Four .dom-row rows (mockup Domain-Mastery tile): DOM code + exam-guide
// weight, name + thin bar, right-aligned value. Weakest practiced domain gets
// the orange "hot" bar (signal). Bars use --accent; values use performance
// colors (strictly separate from domain colors).
export function DomainMasteryTile({ stats }: { stats: DomainOverview[] }) {
  const byDomain = new Map(stats.map((s) => [s.domain, s]));
  const rates = CLF_C02_DOMAINS.map(
    (d) => byDomain.get(d)?.avgCorrectRate ?? null,
  );
  const practiced = rates.filter((r): r is number => r !== null);
  const weakest = practiced.length >= 2 ? Math.min(...practiced) : null;

  return (
    <div>
      {CLF_C02_DOMAINS.map((domain, i) => {
        const rate = rates[i];
        const pct = rate === null ? 0 : Math.round(rate * 100);
        const hot = weakest !== null && rate === weakest;
        return (
          <div
            key={domain}
            className={`grid grid-cols-[64px_1fr_34px] items-center gap-2.5 py-2 ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.06em] text-ink-faint">
                DOM-{String(i + 1).padStart(2, "0")}
              </div>
              <div className="font-mono text-[10px] text-ink-faint">
                {CLF_C02_DOMAIN_WEIGHTS[domain]}%
              </div>
            </div>
            <div>
              <div className="text-[12.5px] font-medium leading-tight text-ink">
                {domain}
              </div>
              <div className="relative mt-[5px] h-1 rounded-sm bg-surface-2">
                <i
                  className="absolute inset-y-0 left-0 rounded-sm"
                  style={{
                    width: `${pct}%`,
                    background: hot ? BRAND_ORANGE : "var(--accent)",
                  }}
                />
              </div>
            </div>
            <div
              className={`text-right font-mono text-[11px] ${
                rate === null ? "text-ink-faint" : scoreColorClass(rate)
              }`}
            >
              {rate === null ? "—" : pct}
            </div>
          </div>
        );
      })}
    </div>
  );
}
