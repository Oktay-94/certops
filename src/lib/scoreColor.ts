export const PERF_THRESHOLDS = { strong: 0.75, weak: 0.5 } as const;
export const LEARNING_TARGET = 0.7 as const;

export function scoreColorClass(rate: number): string {
  if (rate >= PERF_THRESHOLDS.strong) return "text-emerald-700";
  if (rate >= PERF_THRESHOLDS.weak) return "text-amber-700";
  return "text-red-700";
}

export function scoreColorHex(rate: number): string {
  if (rate >= PERF_THRESHOLDS.strong) return "#047857";
  if (rate >= PERF_THRESHOLDS.weak) return "#b45309";
  return "#b91c1c";
}
