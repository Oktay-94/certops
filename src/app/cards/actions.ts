"use server";

import { db } from "@/db";
import {
  markFlashcardSeen as repoMarkFlashcardSeen,
  resetFlashcardViews as repoResetFlashcardViews,
} from "@/db/repository";

export async function markFlashcardSeen(id: number): Promise<void> {
  repoMarkFlashcardSeen(db, id);
}

export async function resetFlashcardViews(): Promise<void> {
  repoResetFlashcardViews(db, "CLF-C02");
}
