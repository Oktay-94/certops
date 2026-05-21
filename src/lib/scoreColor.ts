export function scoreColorClass(rate: number): string {
  if (rate >= 0.7) return "text-emerald-700";
  if (rate >= 0.6) return "text-amber-700";
  return "text-rose-700";
}
