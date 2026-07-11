// Remote entry point for the seed_key backfill: loads .env.turso FIRST (same
// pattern as seed.ts), then runs the CLI. Kept as a separate file so the plain
// local entry (backfill-seed-key.ts) stays safe-by-default on the file: DB.
//
// Usage:
//   dry-run: pnpm db:backfill-seed-key:remote --dry-run          (read-only)
//   write  : ALLOW_PROD_SEED=1 pnpm db:backfill-seed-key:remote --confirm
import "./load-env-turso";
import "./backfill-seed-key";
