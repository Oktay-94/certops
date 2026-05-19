import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";
import type { QuestionDisplay } from "@/db/schema";
import { seedFromString, shuffle } from "@/lib/shuffle";
import { QuestionCard } from "../QuestionCard";

const SESSION_COOKIE = "certops_session_id";
const ROUND_COOKIE = "certops_round_id";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function QuizQuestionPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const all = getQuestionsByCert(db, "CLF-C02");

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? "";
  const roundId = cookieStore.get(ROUND_COOKIE)?.value ?? "";
  const seed = seedFromString(`${sessionId}:${roundId}`);
  const ordered = shuffle(all, seed);

  const idx = ordered.findIndex((q) => q.id === id);
  if (idx === -1) notFound();

  const q = ordered[idx];
  const question: QuestionDisplay = {
    id: q.id,
    cert: q.cert,
    domain: q.domain,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices,
  };

  const isLast = idx + 1 >= ordered.length;
  const nextHref = isLast ? "/quiz/done" : `/quiz/${ordered[idx + 1].id}`;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <QuestionCard question={question} nextHref={nextHref} isLast={isLast} />
    </main>
  );
}
