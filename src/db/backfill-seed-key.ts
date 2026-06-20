// CLI wrapper around the seed_key backfill + completeness gate.
//
// Safety: writes UPDATEs, so it must never hit a remote (Turso) DB by accident.
// Default target is the local file DB. A non-file: (libsql://) URL is refused
// unless BOTH ALLOW_PROD_SEED=1 and --confirm are set — the same dual gate the
// PR-2 seed refactor will use. Live run stays Oktay's manual step.
//
// Usage:
//   local : DATABASE_URL='file:./data/certops.db' tsx src/db/backfill-seed-key.ts
//   remote: ALLOW_PROD_SEED=1 DATABASE_URL='libsql://…' tsx src/db/backfill-seed-key.ts --confirm
import { db } from "./index";
import { clfC02Questions } from "./seed/index";
import { clfC02QuestionsBatch2 } from "./seed/questions/index";
import { clfC02QuestionsBatch3 } from "./seed/questions/index-batch3";
import { clfC02Flashcards } from "./seed/cards/index";
import {
  backfillSeedKeys,
  checkSeedKeyCompleteness,
} from "./seed-key-backfill";
import { assertWritableTarget } from "./prod-guard";

async function main(): Promise<void> {
  assertWritableTarget("backfill");

  const allQuestions = [
    ...clfC02Questions,
    ...clfC02QuestionsBatch2,
    ...clfC02QuestionsBatch3,
  ];

  const result = await backfillSeedKeys(db, {
    questions: allQuestions,
    cards: clfC02Flashcards,
  });
  console.log(
    `Backfill: ${result.questionsUpdated} question row(s), ` +
      `${result.cardsUpdated} card row(s) updated.`,
  );

  const gate = await checkSeedKeyCompleteness(db);
  if (gate.ok) {
    console.log("✅ Completeness gate PASSED — every row has a seed_key.");
    return;
  }

  console.error(
    `❌ Completeness gate FAILED — ${gate.unmatchedQuestions.length} question(s) ` +
      `and ${gate.unmatchedCards.length} card(s) without seed_key. Do NOT cut over.`,
  );
  for (const r of gate.unmatchedQuestions) {
    console.error(`  question #${r.id}: ${r.text}`);
  }
  for (const r of gate.unmatchedCards) {
    console.error(`  card #${r.id}: ${r.text}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
