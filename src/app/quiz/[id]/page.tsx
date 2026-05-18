import { notFound } from "next/navigation";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";
import { QuestionCard } from "../QuestionCard";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function QuizQuestionPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();

  // HACK / Phase-1 trade-off:
  // The full question record — including `correct` and `explanation` —
  // is handed to the client component. See note in src/app/quiz/page.tsx
  // (now this page's redirect target). Same trade-off applies here.
  // Must move grading server-side before multi-user or scored attempts.
  const all = getQuestionsByCert(db, "CLF-C02");
  const idx = all.findIndex((q) => q.id === id);
  if (idx === -1) notFound();

  const question = all[idx];
  const isLast = idx + 1 >= all.length;
  const nextHref = isLast ? "/quiz/done" : `/quiz/${all[idx + 1].id}`;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <QuestionCard question={question} nextHref={nextHref} isLast={isLast} />
    </main>
  );
}
