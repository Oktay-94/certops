import Link from "next/link";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { QuizConfigForm } from "./QuizConfigForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function QuizPage({ searchParams }: Props) {
  const questions = await getQuestionsByCert(db, "CLF-C02");
  const { error } = await searchParams;

  if (questions.length === 0) {
    return (
      <main className="relative mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <ScrollBackground />
        <h1 className="text-xl font-semibold text-ink">
          Keine Fragen vorhanden
        </h1>
        <p className="mt-3 text-ink-soft">
          Bitte einmal{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-sm">
            pnpm db:seed
          </code>{" "}
          ausführen.
        </p>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-4xl px-6 py-8 sm:py-10">
      <ScrollBackground />
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-line-strong"
      >
        ← Zurück zum Dashboard
      </Link>

      {error === "empty" && (
        <p
          className="mt-6 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--danger)",
            background: "var(--danger-soft)",
            color: "var(--danger)",
          }}
        >
          Für diese Auswahl wurden keine Fragen gefunden. Bitte Bereich oder
          Anzahl anpassen.
        </p>
      )}

      <QuizConfigForm questionCount={questions.length} />
    </main>
  );
}
