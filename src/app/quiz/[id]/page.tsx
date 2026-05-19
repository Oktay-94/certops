import { notFound } from "next/navigation";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";
import type { QuestionDisplay } from "@/db/schema";
import { QuestionCard } from "../QuestionCard";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function QuizQuestionPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const all = getQuestionsByCert(db, "CLF-C02");
  const idx = all.findIndex((q) => q.id === id);
  if (idx === -1) notFound();

  const q = all[idx];
  const question: QuestionDisplay = {
    id: q.id,
    cert: q.cert,
    domain: q.domain,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices,
  };

  const isLast = idx + 1 >= all.length;
  const nextHref = isLast ? "/quiz/done" : `/quiz/${all[idx + 1].id}`;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <QuestionCard question={question} nextHref={nextHref} isLast={isLast} />
    </main>
  );
}
