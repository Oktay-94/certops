"use server";

import { db } from "@/db";
import {
  markFlashcardSeen as repoMarkFlashcardSeen,
  resetFlashcardViews as repoResetFlashcardViews,
} from "@/db/repository";
import { getActiveProfileId } from "@/lib/profile-cookie";

export async function markFlashcardSeen(id: number): Promise<void> {
  const userId = await getActiveProfileId();
  if (!userId) return; // no profile chosen yet — nothing to track
  await repoMarkFlashcardSeen(db, id, userId);
}

export async function resetFlashcardViews(): Promise<void> {
  const userId = await getActiveProfileId();
  if (!userId) return;
  await repoResetFlashcardViews(db, "CLF-C02", userId);
}
