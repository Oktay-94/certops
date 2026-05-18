import { redirect } from "next/navigation";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";

export default function QuizPage() {
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

  redirect(`/quiz/${questions[0].id}`);
}
