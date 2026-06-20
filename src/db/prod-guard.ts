// Shared write-target guard for DB-mutating CLI scripts (seed, backfill).
//
// These scripts default to the local file: DB. A non-file: (libsql://) target —
// i.e. remote Turso — is refused unless BOTH ALLOW_PROD_SEED=1 and --confirm are
// set, so a mutating run can never hit production by accident. Single source of
// truth so seed.ts and backfill-seed-key.ts cannot drift apart.

/**
 * Aborts the process (exit 1) when the configured DATABASE_URL points at a
 * remote DB and the explicit dual confirmation is missing. No-op for file: URLs.
 *
 * @param operation human-readable label used in the warning/error message.
 */
export function assertWritableTarget(operation: string): void {
  const url = process.env.DATABASE_URL ?? "file:./data/certops.db";
  const isRemote = !url.startsWith("file:");
  if (!isRemote) return;

  const confirmed =
    process.env.ALLOW_PROD_SEED === "1" && process.argv.includes("--confirm");
  if (!confirmed) {
    console.error(
      `Refusing to ${operation} a remote (non-file:) DB without explicit confirm.\n` +
        "Set ALLOW_PROD_SEED=1 and pass --confirm to run against remote.\n" +
        `Target was: ${url}`,
    );
    process.exit(1);
  }
  console.warn(`⚠️  ${operation}: REMOTE DB ${url}`);
}
