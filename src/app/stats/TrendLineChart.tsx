import type { RoundTrendPoint } from "@/db/repository";
import { LEARNING_TARGET, scoreColorHex } from "@/lib/scoreColor";
import { BRAND_ORANGE } from "@/lib/brand";

const LINE_COLOR = BRAND_ORANGE;
const AVG_COLOR = "#a1a1aa"; // zinc-400
const TARGET_COLOR = "#52525b"; // zinc-600

type ChartConfig = {
  W: number;
  H: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  axisFontSize: number;
  labelFontSize: number;
  pointRadius: number;
  lastPointRadius: number;
  strokeWidth: number;
};

// Desktop: exakt die historischen Werte — pixelgleich zur vorherigen Version.
const DESKTOP: ChartConfig = {
  W: 640,
  H: 140,
  padL: 30,
  padR: 24,
  padT: 8,
  padB: 22,
  axisFontSize: 9,
  labelFontSize: 10,
  pointRadius: 2,
  lastPointRadius: 4,
  strokeWidth: 2,
};

// Mobile: höhere Plotfläche (~360x220 → ~1.6:1 statt 4.6:1), größere Labels/Punkte.
const MOBILE: ChartConfig = {
  W: 360,
  H: 220,
  padL: 34,
  padR: 30,
  padT: 14,
  padB: 30,
  axisFontSize: 12,
  labelFontSize: 13,
  pointRadius: 3,
  lastPointRadius: 6,
  strokeWidth: 2.5,
};

function ChartSvg({
  cfg,
  trend,
}: {
  cfg: ChartConfig;
  trend: RoundTrendPoint[];
}) {
  const plotW = cfg.W - cfg.padL - cfg.padR;
  const plotH = cfg.H - cfg.padT - cfg.padB;

  const yForRate = (rate: number) => cfg.padT + (1 - rate) * plotH;

  const avg = trend.reduce((sum, p) => sum + p.rate, 0) / trend.length;
  const avgY = yForRate(avg);
  const targetY = yForRate(LEARNING_TARGET);

  const points = trend.map((p, i) => ({
    x: cfg.padL + (i / (trend.length - 1)) * plotW,
    y: yForRate(p.rate),
    rate: p.rate,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  const labelsOverlap = Math.abs(avg - LEARNING_TARGET) < 0.05;

  return (
    <svg
      viewBox={`0 0 ${cfg.W} ${cfg.H}`}
      className="block w-full h-auto"
      role="img"
      aria-label="Trefferquote der letzten Runden"
    >
      {/* Y axis ticks */}
      {[0, 0.5, 1].map((tick) => {
        const y = yForRate(tick);
        return (
          <g key={tick}>
            <line
              x1={cfg.padL}
              x2={cfg.W - cfg.padR}
              y1={y}
              y2={y}
              stroke="#f4f4f5"
              strokeWidth={1}
            />
            <text
              x={cfg.padL - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={cfg.axisFontSize}
              fill="#a1a1aa"
            >
              {Math.round(tick * 100)}%
            </text>
          </g>
        );
      })}

      {/* X axis ticks */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={cfg.H - 6}
          textAnchor="middle"
          fontSize={cfg.axisFontSize}
          fill="#a1a1aa"
        >
          R{i + 1}
        </text>
      ))}

      {/* Average reference line */}
      <line
        x1={cfg.padL}
        x2={cfg.W - cfg.padR}
        y1={avgY}
        y2={avgY}
        stroke={AVG_COLOR}
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <text
        x={cfg.W - cfg.padR + 2}
        y={avgY + (labelsOverlap ? -3 : 3)}
        fontSize={cfg.axisFontSize}
        fill={AVG_COLOR}
      >
        Ø
      </text>

      {/* Learning target line */}
      <line
        x1={cfg.padL}
        x2={cfg.W - cfg.padR}
        y1={targetY}
        y2={targetY}
        stroke={TARGET_COLOR}
        strokeWidth={1}
        strokeDasharray="4 2"
      />
      <text
        x={cfg.W - cfg.padR + 2}
        y={targetY + (labelsOverlap ? 9 : 3)}
        fontSize={cfg.axisFontSize}
        fill={TARGET_COLOR}
      >
        70%
      </text>

      {/* Trend line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={cfg.strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Points */}
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={isLast ? cfg.lastPointRadius : cfg.pointRadius}
            fill={scoreColorHex(p.rate)}
            stroke={isLast ? "#ffffff" : "none"}
            strokeWidth={isLast ? 1.5 : 0}
          />
        );
      })}

      {/* Last point %-label */}
      <text
        x={last.x}
        y={last.y - 8}
        textAnchor="middle"
        fontSize={cfg.labelFontSize}
        fontWeight={600}
        fill={scoreColorHex(last.rate)}
      >
        {Math.round(last.rate * 100)}%
      </text>
    </svg>
  );
}

export function TrendLineChart({ trend }: { trend: RoundTrendPoint[] }) {
  if (trend.length < 2) {
    return (
      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-500">
        Mindestens 2 abgeschlossene Runden nötig — spiel noch ein paar Runden,
        dann wächst hier eine Linie.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      {/* Mobile: höhere Plotfläche, größere Labels/Punkte */}
      <div className="sm:hidden">
        <ChartSvg cfg={MOBILE} trend={trend} />
      </div>
      {/* Desktop: unverändert, pixelgleich */}
      <div className="hidden sm:block">
        <ChartSvg cfg={DESKTOP} trend={trend} />
      </div>

      <div className="mt-3 rounded-md bg-zinc-50 p-3 text-xs text-zinc-600">
        <p>
          R1–R{trend.length} = deine letzten Runden, R{trend.length} ist die
          aktuellste, Höhe = Trefferquote in %.
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <li className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4"
              style={{ background: LINE_COLOR }}
              aria-hidden
            />
            Trefferquote je Runde
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full bg-zinc-700"
              aria-hidden
            />
            letzte Runde
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4"
              style={{
                background: `repeating-linear-gradient(to right, ${AVG_COLOR} 0 2px, transparent 2px 4px)`,
              }}
              aria-hidden
            />
            Schnitt (Ø)
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4"
              style={{
                background: `repeating-linear-gradient(to right, ${TARGET_COLOR} 0 4px, transparent 4px 6px)`,
              }}
              aria-hidden
            />
            Lernziel 70%
          </li>
        </ul>
      </div>
    </div>
  );
}
