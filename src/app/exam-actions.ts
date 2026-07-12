"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { getExamStatus, upsertExamStatus } from "@/db/repository";
import { getActiveProfileId } from "@/lib/profile-cookie";
import { isExpired, resolveExamStatus } from "@/lib/exam-status";

const CERT = "CLF-C02" as const;

// Record the real exam outcome. Only legal while the current status is
// pending with an elapsed date (the decision moment) or failed (re-decide).
// Identity always comes from the cookie — never from client input.
export async function setExamResult(result: "passed" | "failed"): Promise<void> {
  if (result !== "passed" && result !== "failed") {
    throw new Error(`Invalid exam result: ${result}`);
  }
  const userId = await getActiveProfileId();
  if (!userId) throw new Error("No active profile");

  const status = resolveExamStatus(await getExamStatus(db, userId, CERT), userId);
  const decidable =
    (status.result === "pending" && isExpired(status.examDate, new Date())) ||
    status.result === "failed";
  if (!decidable) {
    throw new Error("Exam result can only be set after the exam date");
  }

  await upsertExamStatus(db, {
    userId,
    cert: CERT,
    examDate: status.examDate,
    result,
  });
  revalidatePath("/");
}

// Set a new exam date (after a failed attempt or to adjust the countdown).
// Resets result to pending; updatedAt (= countdown anchor) restarts via upsert.
export async function setExamDate(isoDate: string): Promise<void> {
  const userId = await getActiveProfileId();
  if (!userId) throw new Error("No active profile");

  const examDate = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(examDate.getTime())) {
    throw new Error(`Invalid exam date: ${isoDate}`);
  }
  if (examDate.getTime() <= Date.now()) {
    throw new Error("Exam date must be in the future");
  }

  await upsertExamStatus(db, {
    userId,
    cert: CERT,
    examDate,
    result: "pending",
  });
  revalidatePath("/");
}
