import type { RoundTrendPoint } from "@/db/repository";
import { LEARNING_TARGET, scoreColorHex } from "@/lib/scoreColor";
import { BRAND_ORANGE } from "@/lib/brand";

const W = 640;
const H = 140;
const PAD_L = 30;
const PAD_R = 24;
const PAD_T = 8;
const PAD_B = 22;

const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const LINE_COLOR = BRAND_ORANGE;
const AVG_COLOR = "#a1a1aa"; // zinc-400
const TARGET_COLOR = "#52525b"; // zinc-600

function yForRate(rate: number): number {
  return PAD_T + (1 - rate) * PLOT_H;
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

  const avg = trend.reduce((sum, p) => sum + p.rate, 0) / trend.length;
  const avgY = yForRate(avg);
  const targetY = yForRate(LEARNING_TARGET);

  const points = trend.map((p, i) => ({
    x: PAD_L + (i / (trend.length - 1)) * PLOT_W,
    y: yForRate(p.rate),
    rate: p.rate,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  const labelsOverlap = Math.abs(avg - LEARNING_TARGET) < 0.05;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
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
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
                stroke="#f4f4f5"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
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
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill="#a1a1aa"
          >
            R{i + 1}
          </text>
        ))}

        {/* Average reference line */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={avgY}
          y2={avgY}
          stroke={AVG_COLOR}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
        <text
          x={W - PAD_R + 2}
          y={avgY + (labelsOverlap ? -3 : 3)}
          fontSize={9}
          fill={AVG_COLOR}
        >
          Ø
        </text>

        {/* Learning target line */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={targetY}
          y2={targetY}
          stroke={TARGET_COLOR}
          strokeWidth={1}
          strokeDasharray="4 2"
        />
        <text
          x={W - PAD_R + 2}
          y={targetY + (labelsOverlap ? 9 : 3)}
          fontSize={9}
          fill={TARGET_COLOR}
        >
          70%
        </text>

        {/* Trend line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={2}
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
              r={isLast ? 4 : 2}
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
          fontSize={10}
          fontWeight={600}
          fill={scoreColorHex(last.rate)}
        >
          {Math.round(last.rate * 100)}%
        </text>
      </svg>

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
