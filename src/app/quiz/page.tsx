import Link from "next/link";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";
import { QuizConfigForm } from "./QuizConfigForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function QuizPage({ searchParams }: Props) {
  const questions = await getQuestionsByCert(db, "CLF-C02");
  const { error } = await searchParams;

  if (questions.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
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
    <main className="max-w-4xl mx-auto px-6 py-6 sm:py-8">
      <Link
        href="/"
        className="inline-block rounded-xl border border-zinc-300 px-6 py-3 text-center text-zinc-900 transition hover:bg-zinc-100"
      >
        Zurück zum Dashboard
      </Link>

      {error === "empty" && (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Für diese Auswahl wurden keine Fragen gefunden. Bitte Bereich oder
          Anzahl anpassen.
        </p>
      )}

      <QuizConfigForm />
    </main>
  );
}
