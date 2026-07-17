// CLI for the flashcards.back_structured backfill (shared runner, see
// structured-backfill-cli.ts).
//
// Usage:
//   local  : pnpm db:backfill-back-structured [path/to/batch.json]
//   dry-run: pnpm db:backfill-back-structured [--dry-run] [path]
//   remote : ALLOW_PROD_SEED=1 pnpm db:backfill-back-structured:remote --confirm [path]
import { FLASHCARD_BACKS } from "./structured-backfill";
import { runBackfillCliAndExit } from "./structured-backfill-cli";

runBackfillCliAndExit(FLASHCARD_BACKS, "src/db/seed/saa-card-backs/batch1.json");
