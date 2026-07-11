// CLI wrapper around the seed_key backfill + completeness gate.
//
// Safety: writes UPDATEs, so it must never hit a remote (Turso) DB by accident.
// Default target is the local file DB. A non-file: (libsql://) URL is refused
// unless BOTH ALLOW_PROD_SEED=1 and --confirm are set — the same dual gate the
// PR-2 seed refactor will use. Live run stays Oktay's manual step.
//
// Usage:
//   dry-run (read-only, no writes — allowed against remote without --confirm):
//           pnpm db:backfill-seed-key:remote --dry-run
//   local : DATABASE_URL='file:./data/certops.db' tsx src/db/backfill-seed-key.ts
//   remote: ALLOW_PROD_SEED=1 pnpm db:backfill-seed-key:remote --confirm
import { db } from "./index";
import { clfC02Questions } from "./seed/index";
import { clfC02QuestionsBatch2 } from "./seed/questions/index";
import { clfC02QuestionsBatch3 } from "./seed/questions/index-batch3";
import { clfC02Flashcards } from "./seed/cards/index";
import {
  backfillSeedKeys,
  checkSeedKeyCompleteness,
  reportSeedKeyState,
} from "./seed-key-backfill";
import type { SeedKeySources, TableSeedKeyReport } from "./seed-key-backfill";
import { assertWritableTarget } from "./prod-guard";

function printTableReport(label: string, r: TableSeedKeyReport): void {
  console.log(
    `${label}: total=${r.total} alreadyKeyed=${r.alreadyKeyed} ` +
      `matchable=${r.matchable} drift=${r.drift.length} ` +
      `dupLive=${r.dupLive.length} missingLive=${r.missingLive.length}`,
  );
  for (const d of r.drift) console.log(`  drift #${d.id}: ${d.text}`);
  for (const d of r.dupLive) {
    console.log(`  dupLive ids=[${d.ids.join(", ")}]: ${d.text}`);
  }
  for (const key of r.missingLive) {
    console.log(`  missingLive (INSERT on reseed): ${key}`);
  }
}

async function dryRun(sources: SeedKeySources): Promise<void> {
  const url = process.env.DATABASE_URL ?? "file:./data/certops.db";
  if (!url.startsWith("file:")) {
    console.warn(`⚠️  dry-run: REMOTE DB (read-only) ${url}`);
  }

  const report = await reportSeedKeyState(db, sources);
  printTableReport("questions ", report.questions);
  printTableReport("flashcards", report.cards);

  const stop =
    report.questions.drift.length > 0 ||
    report.questions.dupLive.length > 0 ||
    report.cards.drift.length > 0 ||
    report.cards.dupLive.length > 0;
  if (stop) {
    console.error("❌ STOP criteria hit (drift/dupLive > 0) — do NOT write.");
    process.exit(1);
  }
  console.log("✅ Dry-run clean — no drift, no duplicate live rows.");
}

async function main(): Promise<void> {
  const sources: SeedKeySources = {
    questions: [
      ...clfC02Questions,
      ...clfC02QuestionsBatch2,
      ...clfC02QuestionsBatch3,
    ],
    cards: clfC02Flashcards,
  };

  if (process.argv.includes("--dry-run")) {
    await dryRun(sources);
    return;
  }

  assertWritableTarget("backfill");

  const result = await backfillSeedKeys(db, sources);
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
