"use server";

import { cookies } from "next/headers";
import { db } from "@/db";
import { getQuestionById, insertAttempt } from "@/db/repository";

const SESSION_COOKIE = "certops_session_id";

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

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) throw new Error("Missing session cookie");

  const question = getQuestionById(db, questionId);
  if (!question) throw new Error(`Question ${questionId} not found`);

  const correctSet = new Set(question.correct);
  const selectedSet = new Set(selected);
  const isCorrect =
    correctSet.size === selectedSet.size &&
    [...selectedSet].every((id) => correctSet.has(id));

  insertAttempt(db, {
    questionId: question.id,
    selected,
    correct: isCorrect,
    sessionId,
  });

  return {
    correct: isCorrect,
    explanation: question.explanation,
    correctIds: question.correct,
  };
}
