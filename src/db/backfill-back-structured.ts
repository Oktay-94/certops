// CLI wrapper around the back_structured backfill (see back-structured-backfill.ts).
//
// Safety: same dual gate as seed/backfill-seed-key — default target is the
// local file DB; a remote (libsql://) target needs ALLOW_PROD_SEED=1 AND
// --confirm. Live run stays Oktay's manual step.
//
// Usage:
//   local  : pnpm db:backfill-back-structured [path/to/batch.json]
//   dry-run: pnpm db:backfill-back-structured [--dry-run] [path]
//   remote : ALLOW_PROD_SEED=1 pnpm db:backfill-back-structured:remote --confirm [path]
import { readFileSync } from "node:fs";
import { db } from "./index";
import {
  applyBackStructuredBackfill,
  parseBackfillBatch,
} from "./back-structured-backfill";
import { assertWritableTarget } from "./prod-guard";

// Batches live with the other SAA seed content; future batches land here too.
const DEFAULT_BATCH = "src/db/seed/saa-card-backs/batch1.json";

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== "--confirm");
  const dryRun = args.includes("--dry-run");
  const path = args.find((a) => !a.startsWith("--")) ?? DEFAULT_BATCH;

  if (!dryRun) assertWritableTarget("backfill back_structured on");

  const entries = parseBackfillBatch(JSON.parse(readFileSync(path, "utf8")));
  console.log(`${path}: ${entries.length} valid entries`);

  const report = await applyBackStructuredBackfill(db, entries, { dryRun });
  console.log(
    `${dryRun ? "[dry-run] would update" : "updated"}: ${report.updated.length}`,
  );
  for (const key of report.missing) {
    console.log(`  missing (no live row, skipped): ${key}`);
  }
  if (report.missing.length > 0) process.exitCode = 2;
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
