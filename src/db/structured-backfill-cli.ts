// Shared CLI runner for the structured-content backfills (see
// structured-backfill.ts). Safety: same dual gate as seed/backfill-seed-key —
// default target is the local file DB; a remote (libsql://) target needs
// ALLOW_PROD_SEED=1 AND --confirm. Live runs stay Oktays manual step.
import { readFileSync } from "node:fs";
import { db } from "./index";
import {
  applyStructuredBackfill,
  parseBackfillBatch,
  type BackfillTarget,
} from "./structured-backfill";
import { assertWritableTarget } from "./prod-guard";

export async function runBackfillCli(
  target: BackfillTarget,
  defaultBatch: string,
): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== "--confirm");
  const dryRun = args.includes("--dry-run");
  const path = args.find((a) => !a.startsWith("--")) ?? defaultBatch;

  if (!dryRun) {
    assertWritableTarget(`backfill ${target.column} on`);
  }

  const entries = parseBackfillBatch(
    JSON.parse(readFileSync(path, "utf8")),
    target,
  );
  console.log(`${path}: ${entries.length} valid entries`);

  const report = await applyStructuredBackfill(db, entries, target, { dryRun });
  console.log(
    `${dryRun ? "[dry-run] would update" : "updated"}: ${report.updated.length}`,
  );
  for (const key of report.missing) {
    console.log(`  missing (no live row, skipped): ${key}`);
  }
  if (report.missing.length > 0) process.exitCode = 2;
}

export function runBackfillCliAndExit(
  target: BackfillTarget,
  defaultBatch: string,
): void {
  runBackfillCli(target, defaultBatch).then(
    () => process.exit(process.exitCode ?? 0),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
