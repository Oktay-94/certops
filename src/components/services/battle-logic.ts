// Pure, testable Battle-Cards logic — no React, no persistence, no progress.
// Separate from quiz-logic.ts (the existing generative quiz stays untouched).
//
// Direction: prompt shows the SERVICE, the 4 options are DESCRIPTIONS; exactly
// one is correct (the service's own explanation). The 3 distractors depend on
// the chosen difficulty. All option texts are shortened to ~first sentence so
// the correct (often long) explanation can't be spotted by length alone.
import type { ServiceCard } from "@/lib/services-data";
import { AWS_SERVICES } from "@/lib/aws-services";

// 1/2/3 = four-option modes; "extreme" = two-option duel (correct vs. the
// single closest neighbour).
export type Difficulty = 1 | 2 | 3 | "extreme";

export type BattleOption = { text: string; isCorrect: boolean };

export type BattleQuestion = {
  card: ServiceCard;
  difficulty: Difficulty;
  options: BattleOption[];
};

// One played question's outcome. timedOut counts as wrong; timeSec is the
// seconds the learner spent (full 60 on timeout).
export type BattleResult = {
  card: ServiceCard;
  correct: boolean;
  timedOut: boolean;
  timeSec: number;
};

export type BattleSummary = {
  total: number;
  correct: number;
  wrong: number;
  accuracyPct: number;
  avgTimeSec: number;
};

// Provenance is exposed so tests can assert per-difficulty distractor sourcing.
export type DistractorKind = "explanation" | "curated";
export type Distractor = {
  text: string;
  sourceNum: number | null; // service the explanation came from; null = curated
  kind: DistractorKind;
};

export const QUESTIONS_PER_ROUND = 50;
const OPTION_MAX = 180;

function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// First sentence / first line, capped ~180 chars at a sentence boundary so all
// four options read as complete, comparable-length thoughts.
export function shortExplanation(text: string): string {
  const firstLine = text.split("\n")[0].trim();
  const sentence = firstLine.match(/^.*?[.!?](?=\s|$)/);
  let out = sentence ? sentence[0] : firstLine;
  if (out.length > OPTION_MAX) {
    const slice = out.slice(0, OPTION_MAX);
    const cut = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
    );
    out = cut > 40 ? slice.slice(0, cut + 1) : `${slice.trimEnd()}…`;
  }
  return out.trim();
}

// Name variants for matching a service inside free text: its title, the
// prefix-stripped short form (Amazon EC2 → EC2), plus the curated aliases from
// the icon registry where available. Filtered to length >= 2.
export function serviceAliases(card: ServiceCard): string[] {
  const names = new Set<string>();
  names.add(card.title);
  names.add(card.title.replace(/^(Amazon|AWS)\s+/, ""));
  const reg = AWS_SERVICES.find((s) => s.displayName === card.title);
  if (reg) for (const a of reg.aliases) names.add(a);
  return [...names].filter((a) => a.length >= 2);
}

// Sibling services named in card.note (mapped to .hint). Matching is
// case-sensitive and word-bounded (\bALIAS\b) so short aliases like "S3"/"EC2"
// only hit whole tokens — never a substring inside another word.
export function noteSiblings(
  card: ServiceCard,
  all: readonly ServiceCard[],
): ServiceCard[] {
  const note = card.hint;
  if (!note) return [];
  const out: ServiceCard[] = [];
  for (const other of all) {
    if (other.num === card.num) continue;
    const hit = serviceAliases(other).some((a) =>
      new RegExp(`\\b${escapeRegex(a)}\\b`).test(note),
    );
    if (hit) out.push(other);
  }
  return out;
}

// The sibling mentioned EARLIEST in card.note — the "primary" closest neighbour.
// Ordered by first alias-match position in the note text (not pool order).
export function primaryNoteSibling(
  card: ServiceCard,
  all: readonly ServiceCard[],
): ServiceCard | null {
  const note = card.hint;
  if (!note) return null;
  let best: ServiceCard | null = null;
  let bestPos = Infinity;
  for (const other of all) {
    if (other.num === card.num) continue;
    for (const a of serviceAliases(other)) {
      const m = note.match(new RegExp(`\\b${escapeRegex(a)}\\b`));
      if (m && m.index !== undefined && m.index < bestPos) {
        bestPos = m.index;
        best = other;
      }
    }
  }
  return best;
}

/**
 * Pick the distractors for a question, per difficulty. Texts are shortened and
 * deduped against each other and the correct explanation. Four-option modes
 * return 3; "extreme" returns exactly 1.
 *
 * Stufe 1: explanations from OTHER categories (cross-domain).
 * Stufe 2: the curated distractor + 2 same-category explanations.
 * Stufe 3: explanations of note-named siblings; if too few, fall back to
 *          same-category, then (defensively) cross-category. Encapsulated so
 *          its question source can later swap to real detail-questions from
 *          note without touching the engine.
 * Extrem:  exactly ONE distractor — the single closest neighbour. Priority:
 *          primary note-sibling → curated distractor(X) → same-category.
 *
 * Every branch ends with a same/cross-category fill so it can never return
 * fewer than `limit` — even for IoT (only 4 services).
 */
export function pickDistractors(
  card: ServiceCard,
  difficulty: Difficulty,
  all: readonly ServiceCard[],
): Distractor[] {
  const limit = difficulty === "extreme" ? 1 : 3;
  const correctText = shortExplanation(card.core);
  const seen = new Set<string>([correctText]);
  const out: Distractor[] = [];

  const tryAdd = (text: string, sourceNum: number | null, kind: DistractorKind) => {
    if (out.length >= limit) return;
    const t = shortExplanation(text);
    if (seen.has(t)) return;
    seen.add(t);
    out.push({ text: t, sourceNum, kind });
  };

  const others = all.filter((c) => c.num !== card.num);
  const sameCat = () => shuffle(others.filter((c) => c.domain === card.domain));
  const crossCat = () => shuffle(others.filter((c) => c.domain !== card.domain));

  if (difficulty === 1) {
    for (const c of crossCat()) tryAdd(c.core, c.num, "explanation");
  } else if (difficulty === 2) {
    tryAdd(card.distractor, null, "curated");
    for (const c of sameCat()) tryAdd(c.core, c.num, "explanation");
  } else if (difficulty === 3) {
    for (const c of shuffle(noteSiblings(card, all)))
      tryAdd(c.core, c.num, "explanation");
    for (const c of sameCat()) tryAdd(c.core, c.num, "explanation");
  } else {
    // Extrem — the single closest neighbour, by priority.
    const primary = primaryNoteSibling(card, all);
    if (primary) tryAdd(primary.core, primary.num, "explanation");
    tryAdd(card.distractor, null, "curated");
    for (const c of sameCat()) tryAdd(c.core, c.num, "explanation");
  }

  // Defensive fill — guarantees `limit` even if dedup/curated shrank the pool.
  for (const c of crossCat()) tryAdd(c.core, c.num, "explanation");

  return out.slice(0, limit);
}

export function buildQuestion(
  card: ServiceCard,
  difficulty: Difficulty,
  all: readonly ServiceCard[],
): BattleQuestion {
  const correct: BattleOption = {
    text: shortExplanation(card.core),
    isCorrect: true,
  };
  const distractors = pickDistractors(card, difficulty, all).map((d) => ({
    text: d.text,
    isCorrect: false,
  }));
  return { card, difficulty, options: shuffle([correct, ...distractors]) };
}

export function buildBattle(
  pool: readonly ServiceCard[],
  difficulty: Difficulty,
  count = QUESTIONS_PER_ROUND,
): BattleQuestion[] {
  const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
  return picked.map((card) => buildQuestion(card, difficulty, pool));
}

export function summarize(results: readonly BattleResult[]): BattleSummary {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const wrong = total - correct;
  const accuracyPct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const avgTimeSec =
    total === 0
      ? 0
      : Math.round((results.reduce((s, r) => s + r.timeSec, 0) / total) * 10) /
        10;
  return { total, correct, wrong, accuracyPct, avgTimeSec };
}
