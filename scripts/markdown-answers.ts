import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { flashcards } from "../src/db/schema";
import { addBoldedTerms } from "../src/lib/markdown-bold";

async function run(): Promise<void> {
  const rows = await db.select().from(flashcards).all();
  let changed = 0;
  for (const row of rows) {
    const next = addBoldedTerms(row.back);
    if (next !== row.back) {
      await db.update(flashcards)
        .set({ back: next })
        .where(eq(flashcards.id, row.id))
        .run();
      changed++;
    }
  }
  console.log(`${changed} / ${rows.length} Antworten markdown-iert`);
}

run();
