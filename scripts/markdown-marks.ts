import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { flashcards } from "../src/db/schema";
import { addServiceMarkers } from "../src/lib/markdown-marks";

async function run(): Promise<void> {
  const rows = await db.select().from(flashcards).all();
  let changed = 0;
  for (const row of rows) {
    const next = addServiceMarkers(row.back);
    if (next !== row.back) {
      await db.update(flashcards)
        .set({ back: next })
        .where(eq(flashcards.id, row.id))
        .run();
      changed++;
    }
  }
  console.log(`${changed} / ${rows.length} Antworten mit Service-Markern versehen`);
}

run();
