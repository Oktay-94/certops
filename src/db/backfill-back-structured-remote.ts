// Remote entry point for the back_structured backfill: loads .env.turso FIRST
// (same pattern as backfill-seed-key-remote.ts), then runs the CLI. Separate
// file so the plain local entry stays safe-by-default on the file: DB.
//
// Usage:
//   dry-run: pnpm db:backfill-back-structured:remote --dry-run          (read-only)
//   write  : ALLOW_PROD_SEED=1 pnpm db:backfill-back-structured:remote --confirm
import "./load-env-turso";
import "./backfill-back-structured";
