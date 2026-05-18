import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";
import { QuestionCard } from "./QuestionCard";

export default function QuizPage() {
  // HACK / Phase-1 trade-off:
  // We hand the full question record — including `correct` and `explanation` —
  // to the client component. That means the right answers are inspectable
  // in the browser before the user submits.
  //
  // Acceptable now because:
  //   - Single-user learning mode (only Oktay), no score that "counts".
  //   - No persistence of attempts, so nothing to game.
  //
  // MUST be revisited before:
  //   - Multi-user support lands.
  //   - `question_attempts` is persisted and scoring/streaks matter.
  // Migration path: convert this page into a Server Action / API route that
  // returns the question WITHOUT `correct` + `explanation`, submit answer
  // server-side, return result + explanation only after grading.
  const questions = getQuestionsByCert(db, "CLF-C02");
  const question = questions[0];

  if (!question) {
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

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      <QuestionCard question={question} />
    </main>
  );
}
