"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { selectRoundQuestions } from "@/db/repository";
import {
  CLF_C02_DOMAINS,
  QUIZ_COUNT_OPTIONS,
  QUIZ_MODES,
  type ClfC02Domain,
  type QuizCount,
  type QuizMode,
} from "@/lib/domains";
import { seedFromString } from "@/lib/shuffle";

const SESSION_COOKIE = "certops_session_id";
const ROUND_COOKIE = "certops_round_id";
const ROUND_QUESTIONS_COOKIE = "certops_round_questions";

export type StartRoundInput = {
  count: QuizCount;
  domain: ClfC02Domain | "all";
  mode: QuizMode;
};

export async function startRound(input: StartRoundInput): Promise<void> {
  if (!QUIZ_COUNT_OPTIONS.includes(input.count)) {
    throw new Error("Invalid count");
  }
  if (input.domain !== "all" && !CLF_C02_DOMAINS.includes(input.domain)) {
    throw new Error("Invalid domain");
  }
  if (!QUIZ_MODES.includes(input.mode)) {
    throw new Error("Invalid mode");
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? "";
  const roundId = cookieStore.get(ROUND_COOKIE)?.value ?? "";
  const seed = seedFromString(`${sessionId}:${roundId}`);

  const ids = await selectRoundQuestions(db, {
    cert: "CLF-C02",
    sessionId,
    domain: input.domain === "all" ? undefined : input.domain,
    count: input.count,
    mode: input.mode,
    seed,
  });

  if (ids.length === 0) {
    redirect("/quiz?error=empty");
  }

  cookieStore.set({
    name: ROUND_QUESTIONS_COOKIE,
    value: JSON.stringify(ids),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect(`/quiz/${ids[0]}`);
}
