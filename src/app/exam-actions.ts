"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { getExamStatus, upsertExamStatus } from "@/db/repository";
import { getActiveProfileId } from "@/lib/profile-cookie";
import { isExpired, resolveExamStatus } from "@/lib/exam-status";
import { isCert, type Cert } from "@/lib/exam";

// Record the real exam outcome. Only legal while the current status is
// pending with an elapsed date (the decision moment) or failed (re-decide).
// Identity always comes from the cookie — never from client input; the cert
// arrives from the client and is whitelist-validated.
export async function setExamResult(
  result: "passed" | "failed",
  cert: Cert,
): Promise<void> {
  if (result !== "passed" && result !== "failed") {
    throw new Error(`Invalid exam result: ${result}`);
  }
  if (!isCert(cert)) throw new Error(`Invalid cert: ${cert}`);
  const userId = await getActiveProfileId();
  if (!userId) throw new Error("No active profile");

  const status = resolveExamStatus(await getExamStatus(db, userId, cert), userId);
  const decidable =
    (status.result === "pending" && isExpired(status.examDate, new Date())) ||
    status.result === "failed";
  if (!decidable) {
    throw new Error("Exam result can only be set after the exam date");
  }

  await upsertExamStatus(db, {
    userId,
    cert,
    examDate: status.examDate,
    result,
  });
  revalidatePath("/", "layout");
}

// Set a new exam date (after a failed attempt or to adjust the countdown).
// Resets result to pending; updatedAt (= countdown anchor) restarts via upsert.
export async function setExamDate(isoDate: string, cert: Cert): Promise<void> {
  if (!isCert(cert)) throw new Error(`Invalid cert: ${cert}`);
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
    cert,
    examDate,
    result: "pending",
  });
  revalidatePath("/", "layout");
}
