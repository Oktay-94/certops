// Pure, testable quiz helpers — no React, no persistence, no progress.
// Direction: prompt shows the SERVICE NAME, options are DESCRIPTIONS.
import type { ServiceCard } from "@/lib/services-data";

export type QuizOption = {
  text: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  card: ServiceCard;
  options: QuizOption[];
};

function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// First sentence / first line of `core`, capped ~180 chars, cut at a sentence
// boundary so options read as complete thoughts.
export function shortText(card: Pick<ServiceCard, "core">): string {
  const firstLine = card.core.split("\n")[0].trim();
  const sentence = firstLine.match(/^.*?[.!?](?=\s|$)/);
  let text = sentence ? sentence[0] : firstLine;
  if (text.length > 180) {
    const slice = text.slice(0, 180);
    const cut = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
    );
    text = cut > 40 ? slice.slice(0, cut + 1) : `${slice.trimEnd()}…`;
  }
  return text.trim();
}

// hint excerpt for per-question feedback (~160 chars, soft-cut on whitespace).
export function hintExcerpt(card: Pick<ServiceCard, "hint">, max = 160): string {
  const h = card.hint.trim();
  if (h.length <= max) return h;
  const slice = h.slice(0, max);
  const sp = slice.lastIndexOf(" ");
  return `${(sp > 40 ? slice.slice(0, sp) : slice).trimEnd()}…`;
}

// 3 wrong descriptions, preferring the same domain first, then others; then all
// 4 options shuffled together. Dedupes against the correct text and itself.
export function buildOptions(
  card: ServiceCard,
  pool: readonly ServiceCard[],
): QuizOption[] {
  const correctText = shortText(card);
  const others = pool.filter((c) => c.num !== card.num);
  const sameDomain = shuffle(others.filter((c) => c.domain === card.domain));
  const otherDomain = shuffle(others.filter((c) => c.domain !== card.domain));

  const distractors: string[] = [];
  const seen = new Set<string>([correctText]);
  for (const c of [...sameDomain, ...otherDomain]) {
    const t = shortText(c);
    if (seen.has(t)) continue;
    seen.add(t);
    distractors.push(t);
    if (distractors.length === 3) break;
  }

  const options: QuizOption[] = [
    { text: correctText, isCorrect: true },
    ...distractors.map((text) => ({ text, isCorrect: false })),
  ];
  return shuffle(options);
}

// Build a quiz of `count` questions from the (optionally domain-filtered) pool.
export function buildQuiz(
  pool: readonly ServiceCard[],
  count: number,
): QuizQuestion[] {
  const picked = shuffle(pool).slice(0, count);
  return picked.map((card) => ({ card, options: buildOptions(card, pool) }));
}
