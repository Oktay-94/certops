// Remote entry point for the explanation_structured backfill: loads .env.turso
// FIRST (same pattern as backfill-back-structured-remote.ts), then runs the CLI.
//
// Usage:
//   dry-run: pnpm db:backfill-explanation-structured:remote --dry-run          (read-only)
//   write  : ALLOW_PROD_SEED=1 pnpm db:backfill-explanation-structured:remote --confirm
import "./load-env-turso";
import "./backfill-explanation-structured";
