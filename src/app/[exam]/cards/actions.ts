"use server";

import { db } from "@/db";
import {
  markFlashcardSeen as repoMarkFlashcardSeen,
  resetFlashcardViews as repoResetFlashcardViews,
} from "@/db/repository";
import { getActiveProfileId } from "@/lib/profile-cookie";
import { EXAM_CERT, isExamSlug, type ExamSlug } from "@/lib/exam";

export async function markFlashcardSeen(id: number): Promise<void> {
  const userId = await getActiveProfileId();
  if (!userId) return; // no profile chosen yet — nothing to track
  await repoMarkFlashcardSeen(db, id, userId);
}

export async function resetFlashcardViews(exam: ExamSlug): Promise<void> {
  // Whitelist-validated client input (actions cannot read route params).
  if (!isExamSlug(exam)) throw new Error("Invalid exam");
  const userId = await getActiveProfileId();
  if (!userId) return;
  await repoResetFlashcardViews(db, EXAM_CERT[exam], userId);
}
