// seed_key backfill — PR 1 (foundation). Pure, DB-handle-taking functions so
// they can be exercised against :memory: SQLite in tests. The destructive seed
// path in seed.ts is untouched; this only fills the new seed_key column on
// rows that predate it, matching by the unique natural bridge (prompt / front).
//
// Idempotent: only rows WHERE seed_key IS NULL are updated, so re-running never
// overwrites an already-assigned key.
import { and, eq, isNull } from "drizzle-orm";
import type { DB } from "./index";
import { flashcards, questions } from "./schema";
import type { NewFlashcard, NewQuestion } from "./schema";

export type SeedKeySources = {
  questions: NewQuestion[];
  cards: NewFlashcard[];
};

export type BackfillResult = {
  questionsUpdated: number;
  cardsUpdated: number;
};

/**
 * Assign seed_key to existing rows by exact-string match on the stable natural
 * bridge: questions.prompt (264/264 distinct) and flashcards.front (150/150
 * distinct). Only NULL seed_key rows are touched. Never deletes, never updates
 * any other column, never touches question_attempts / flashcard_views.
 */
export async function backfillSeedKeys(
  db: DB,
  sources: SeedKeySources,
): Promise<BackfillResult> {
  let questionsUpdated = 0;
  for (const q of sources.questions) {
    if (!q.seedKey) continue;
    const res = await db
      .update(questions)
      .set({ seedKey: q.seedKey })
      .where(and(eq(questions.prompt, q.prompt), isNull(questions.seedKey)))
      .run();
    questionsUpdated += res.rowsAffected;
  }

  let cardsUpdated = 0;
  for (const c of sources.cards) {
    if (!c.seedKey) continue;
    const res = await db
      .update(flashcards)
      .set({ seedKey: c.seedKey })
      .where(and(eq(flashcards.front, c.front), isNull(flashcards.seedKey)))
      .run();
    cardsUpdated += res.rowsAffected;
  }

  return { questionsUpdated, cardsUpdated };
}

export type UnmatchedRow = { id: number; text: string };

export type DuplicateLiveRows = { ids: number[]; text: string };

export type TableSeedKeyReport = {
  /** live row count */
  total: number;
  /** live rows that already carry a seed_key (skipped by backfill) */
  alreadyKeyed: number;
  /** NULL rows whose text matches a seed entry — would be updated */
  matchable: number;
  /** NULL rows with no matching seed entry — would fail the completeness gate */
  drift: UnmatchedRow[];
  /** seed entries (by seedKey) with no live row — become INSERTs on reseed */
  missingLive: string[];
  /** live rows sharing the same bridge text — backfill would hit the unique index */
  dupLive: DuplicateLiveRows[];
};

export type SeedKeyStateReport = {
  questions: TableSeedKeyReport;
  cards: TableSeedKeyReport;
};

type LiveRow = { id: number; text: string; seedKey: string | null };
type SourceEntry = { text: string; seedKey: string };

function buildTableReport(
  rows: LiveRow[],
  sources: SourceEntry[],
): TableSeedKeyReport {
  const sourceTexts = new Set(sources.map((s) => s.text));
  const liveTexts = new Set(rows.map((r) => r.text));

  const idsByText = new Map<string, number[]>();
  for (const r of rows) {
    const ids = idsByText.get(r.text) ?? [];
    ids.push(r.id);
    idsByText.set(r.text, ids);
  }

  const nullRows = rows.filter((r) => r.seedKey === null);
  return {
    total: rows.length,
    alreadyKeyed: rows.length - nullRows.length,
    matchable: nullRows.filter((r) => sourceTexts.has(r.text)).length,
    drift: nullRows
      .filter((r) => !sourceTexts.has(r.text))
      .map((r) => ({ id: r.id, text: clip(r.text) })),
    missingLive: sources
      .filter((s) => !liveTexts.has(s.text))
      .map((s) => s.seedKey),
    dupLive: [...idsByText.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([text, ids]) => ({ ids, text: clip(text) })),
  };
}

/**
 * Read-only dry-run report: compares live rows against the seed sources
 * WITHOUT writing anything. drift > 0 or dupLive > 0 are stop criteria —
 * running the real backfill would then either fail the completeness gate
 * (drift) or abort on the unique seed_key index (dupLive).
 */
export async function reportSeedKeyState(
  db: DB,
  sources: SeedKeySources,
): Promise<SeedKeyStateReport> {
  const toEntry = (o: { seedKey?: string | null }, text: string) =>
    o.seedKey ? [{ text, seedKey: o.seedKey }] : [];

  const qRows = await db
    .select({ id: questions.id, text: questions.prompt, seedKey: questions.seedKey })
    .from(questions)
    .all();
  const cRows = await db
    .select({ id: flashcards.id, text: flashcards.front, seedKey: flashcards.seedKey })
    .from(flashcards)
    .all();

  return {
    questions: buildTableReport(
      qRows,
      sources.questions.flatMap((q) => toEntry(q, q.prompt)),
    ),
    cards: buildTableReport(
      cRows,
      sources.cards.flatMap((c) => toEntry(c, c.front)),
    ),
  };
}

export type CompletenessReport = {
  ok: boolean;
  unmatchedQuestions: UnmatchedRow[];
  unmatchedCards: UnmatchedRow[];
};

const TRUNCATE = 80;
const clip = (s: string) => (s.length > TRUNCATE ? `${s.slice(0, TRUNCATE)}…` : s);

/**
 * Mandatory pre-cutover gate. ok=true only when NO row on either content table
 * still has a NULL seed_key. Otherwise the offending rows are listed (id +
 * clipped prompt/front) so a drifted/unmatched row can be investigated — never
 * silently cut over.
 */
export async function checkSeedKeyCompleteness(
  db: DB,
): Promise<CompletenessReport> {
  const qRows = await db
    .select({ id: questions.id, text: questions.prompt })
    .from(questions)
    .where(isNull(questions.seedKey))
    .all();
  const cRows = await db
    .select({ id: flashcards.id, text: flashcards.front })
    .from(flashcards)
    .where(isNull(flashcards.seedKey))
    .all();

  const unmatchedQuestions = qRows.map((r) => ({ id: r.id, text: clip(r.text) }));
  const unmatchedCards = cRows.map((r) => ({ id: r.id, text: clip(r.text) }));

  return {
    ok: unmatchedQuestions.length === 0 && unmatchedCards.length === 0,
    unmatchedQuestions,
    unmatchedCards,
  };
}
