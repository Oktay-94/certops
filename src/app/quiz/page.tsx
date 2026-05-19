import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";
import { seedFromString, shuffle } from "@/lib/shuffle";

const SESSION_COOKIE = "certops_session_id";
const ROUND_COOKIE = "certops_round_id";

export default async function QuizPage() {
  const questions = getQuestionsByCert(db, "CLF-C02");

  if (questions.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
        <h1 className="text-xl font-medium text-zinc-900">
          Keine Fragen vorhanden
        </h1>
        <p className="mt-3 text-zinc-600">
          Bitte einmal{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
            pnpm db:seed
          </code>{" "}
          ausführen.
        </p>
      </main>
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? "";
  const roundId = cookieStore.get(ROUND_COOKIE)?.value ?? "";
  const seed = seedFromString(`${sessionId}:${roundId}`);
  const ordered = shuffle(questions, seed);

  redirect(`/quiz/${ordered[0].id}`);
}
