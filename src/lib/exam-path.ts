import type { ExamSlug } from "./exam";

// Subpaths that exist identically in both tracks — the switcher maps them 1:1.
// Anything else (entity segments like /quiz/750, round-bound /quiz/done, or
// CLF-only routes like /skript/*) lands on the target exam's dashboard root.
const SHARED_STATIC_SUBPATHS = new Set(["", "/quiz", "/cards", "/stats"]);

/** Target path when switching exams from the given pathname. */
export function switchExamPath(pathname: string, target: ExamSlug): string {
  const match = pathname.match(/^\/(clf|saa)(\/.*)?$/);
  const sub = match?.[2] ?? "";
  return SHARED_STATIC_SUBPATHS.has(sub) ? `/${target}${sub}` : `/${target}`;
}
