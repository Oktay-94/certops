"use server";

import { db } from "@/db";
import {
  markFlashcardSeen as repoMarkFlashcardSeen,
  resetFlashcardViews as repoResetFlashcardViews,
} from "@/db/repository";

export async function markFlashcardSeen(id: number): Promise<void> {
  await repoMarkFlashcardSeen(db, id);
}

export async function resetFlashcardViews(): Promise<void> {
  await repoResetFlashcardViews(db, "CLF-C02");
}
