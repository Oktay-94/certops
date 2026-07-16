"use server";

import { cookies } from "next/headers";
import { db } from "@/db";
import { getQuestionById, insertAttempt } from "@/db/repository";
import { getActiveProfileId } from "@/lib/profile-cookie";

const SESSION_COOKIE = "certops_session_id";
const ROUND_COOKIE = "certops_round_id";

export type SubmitAnswerResult = {
  correct: boolean;
  explanation: string;
  correctIds: string[];
};

export async function submitAnswer(input: {
  questionId: number;
  selected: string[];
}): Promise<SubmitAnswerResult> {
  const { questionId, selected } = input;

  if (!Number.isInteger(questionId) || questionId <= 0) {
    throw new Error("Invalid questionId");
  }
  if (!Array.isArray(selected) || selected.some((s) => typeof s !== "string")) {
    throw new Error("Invalid selected");
  }

  const userId = await getActiveProfileId();
  if (!userId) throw new Error("Kein Profil gewählt");

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) throw new Error("Missing session cookie");
  const roundId = cookieStore.get(ROUND_COOKIE)?.value ?? null;

  const question = await getQuestionById(db, questionId);
  if (!question) throw new Error(`Question ${questionId} not found`);

  const correctSet = new Set(question.correct);
  const selectedSet = new Set(selected);
  const isCorrect =
    correctSet.size === selectedSet.size &&
    [...selectedSet].every((id) => correctSet.has(id));

  await insertAttempt(db, {
    questionId: question.id,
    selected,
    correct: isCorrect,
    userId,
    sessionId,
    roundId,
  });

  return {
    correct: isCorrect,
    explanation: question.explanation,
    correctIds: question.correct,
  };
}
