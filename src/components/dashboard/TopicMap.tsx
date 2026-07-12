import { BRAND_ORANGE } from "@/lib/brand";
import { CLF_C02_DOMAINS } from "@/lib/domains";
import { PERF_THRESHOLDS } from "@/lib/scoreColor";
import type { DomainOverview } from "@/db/repository";

// Passive topic map (mockup Topic-Map tile): node boxes with 2pt strokes,
// right-angle connectors with mid-x elbow, OPEN arrowheads (chevron), dashed
// group container. ChartSvg convention: ONE draw function, two configs,
// breakpoint visibility — no duplicated SVG markup.

export type NodeState = "m" | "c" | "o"; // mastered / in progress / open

/** Map a last-3 rate to the mockup node state (exported for tests). */
export function nodeState(rate: number | null): NodeState {
  if (rate === null) return "o";
  return rate >= PERF_THRESHOLDS.strong ? "m" : "c";
}

const SHORT_LABELS: Record<string, string> = {
  "Cloud Concepts": "CLOUD CONCEPTS",
  "Security and Compliance": "SECURITY",
  "Cloud Technology and Services": "TECHNOLOGY",
  "Billing, Pricing, and Support": "BILLING",
};

type MapConfig = {
  width: number;
  height: number;
  nodeW: number;
  nodeH: number;
  gap: number;
  fontSize: number;
};

const DESKTOP: MapConfig = {
  width: 1040,
  height: 150,
  nodeW: 190,
  nodeH: 44,
  gap: 62,
  fontSize: 11,
};

const MOBILE: MapConfig = {
  width: 560,
  height: 120,
  nodeW: 112,
  nodeH: 36,
  gap: 24,
  fontSize: 9,
};

const NODE_FILL: Record<NodeState, string> = {
  m: "var(--success-soft)",
  c: "var(--surface-2)",
  o: "var(--surface-2)",
};
const NODE_STROKE: Record<NodeState, string> = {
  m: "var(--success)",
  c: BRAND_ORANGE,
  o: "var(--border-strong)",
};

function MapSvg({
  cfg,
  states,
}: {
  cfg: MapConfig;
  states: NodeState[];
}) {
  const { width, height, nodeW, nodeH, gap, fontSize } = cfg;
  const totalW = 4 * nodeW + 3 * gap;
  const startX = (width - totalW) / 2;
  const y = (height - nodeH) / 2 + 8;

  const nodes = CLF_C02_DOMAINS.map((domain, i) => ({
    x: startX + i * (nodeW + gap),
    label: SHORT_LABELS[domain] ?? domain,
    state: states[i] ?? "o",
  }));

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 16}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Topic-Map der vier CLF-C02-Domains"
    >
      <rect
        x={8}
        y={8}
        width={width - 16}
        height={height}
        rx={10}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth={1.5}
        strokeDasharray="6 5"
      />
      <text
        x={24}
        y={28}
        fontFamily="var(--font-geist-mono)"
        fontSize={10}
        letterSpacing={2}
        fill="var(--ink-faint)"
      >
        CLF-C02 · EXAM GUIDE
      </text>
      {nodes.slice(0, -1).map((n, i) => {
        const x1 = n.x + nodeW;
        const x2 = nodes[i + 1]!.x;
        const cy = y + nodeH / 2;
        return (
          <g key={`e${i}`}>
            <path
              d={`M ${x1} ${cy} H ${x2 - 9}`}
              fill="none"
              stroke="var(--ink-faint)"
              strokeWidth={2}
            />
            <path
              d={`M ${x2 - 10} ${cy - 5} L ${x2 - 1} ${cy} L ${x2 - 10} ${cy + 5}`}
              fill="none"
              stroke="var(--ink-faint)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.label}>
          <rect
            x={n.x}
            y={y}
            width={nodeW}
            height={nodeH}
            rx={8}
            fill={NODE_FILL[n.state]}
            stroke={NODE_STROKE[n.state]}
            strokeWidth={2}
          />
          <text
            x={n.x + nodeW / 2}
            y={y + nodeH / 2 + fontSize / 3}
            textAnchor="middle"
            fontFamily="var(--font-geist-mono)"
            fontSize={fontSize}
            letterSpacing={1.5}
            fill="var(--ink)"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function TopicMap({ stats }: { stats: DomainOverview[] }) {
  const byDomain = new Map(stats.map((s) => [s.domain, s.avgCorrectRate]));
  const states = CLF_C02_DOMAINS.map((d) => nodeState(byDomain.get(d) ?? null));

  return (
    <div>
      <div className="hidden sm:block">
        <MapSvg cfg={DESKTOP} states={states} />
      </div>
      <div className="sm:hidden">
        <MapSvg cfg={MOBILE} states={states} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-4 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-faint">
        <span className="flex items-center gap-1.5">
          <i
            className="inline-block h-2.5 w-2.5 rounded-[3px] border-[1.5px]"
            style={{
              background: "var(--success-soft)",
              borderColor: "var(--success)",
            }}
          />
          Mastered
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="inline-block h-2.5 w-2.5 rounded-[3px] border-[1.5px]"
            style={{ borderColor: BRAND_ORANGE }}
          />
          In Arbeit
        </span>
        <span className="flex items-center gap-1.5">
          <i
            className="inline-block h-2.5 w-2.5 rounded-[3px] border-[1.5px]"
            style={{ borderColor: "var(--ink-faint)" }}
          />
          Offen
        </span>
      </div>
    </div>
  );
}
