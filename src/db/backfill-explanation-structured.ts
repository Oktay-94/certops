// CLI for the questions.explanation_structured backfill (shared runner, see
// structured-backfill-cli.ts).
//
// Usage:
//   local  : pnpm db:backfill-explanation-structured [path/to/batch.json]
//   dry-run: pnpm db:backfill-explanation-structured [--dry-run] [path]
//   remote : ALLOW_PROD_SEED=1 pnpm db:backfill-explanation-structured:remote --confirm [path]
import { QUESTION_EXPLANATIONS } from "./structured-backfill";
import { runBackfillCliAndExit } from "./structured-backfill-cli";

runBackfillCliAndExit(
  QUESTION_EXPLANATIONS,
  "src/db/seed/saa-question-explanations/batch1.json",
);
