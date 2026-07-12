import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/db";
import { getQuestionsByCert } from "@/db/repository";
import type { Question, QuestionDisplay } from "@/db/schema";
import { seedFromString, shuffle } from "@/lib/shuffle";
import { BRAND_ORANGE } from "@/lib/brand";
import { ScrollBackground } from "@/components/dashboard/ScrollBackground";
import { QuestionCard } from "../QuestionCard";

const SESSION_COOKIE = "certops_session_id";
const ROUND_COOKIE = "certops_round_id";
const ROUND_QUESTIONS_COOKIE = "certops_round_questions";

type Props = {
  params: Promise<{ id: string }>;
};

function parseRoundIds(raw: string | undefined): number[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const ids = parsed.filter(
      (v): v is number => typeof v === "number" && Number.isInteger(v) && v > 0,
    );
    return ids.length === parsed.length ? ids : null;
  } catch {
    return null;
  }
}

export default async function QuizQuestionPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const all = await getQuestionsByCert(db, "CLF-C02");
  const byId = new Map<number, Question>(all.map((q) => [q.id, q]));

  const cookieStore = await cookies();
  const roundIdsRaw = cookieStore.get(ROUND_QUESTIONS_COOKIE)?.value;
  const roundIds = parseRoundIds(roundIdsRaw);

  let ordered: Question[];
  if (roundIds) {
    ordered = roundIds
      .map((rid) => byId.get(rid))
      .filter((q): q is Question => q !== undefined);
    if (ordered.length === 0) notFound();
  } else {
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value ?? "";
    const roundId = cookieStore.get(ROUND_COOKIE)?.value ?? "";
    const seed = seedFromString(`${sessionId}:${roundId}`);
    ordered = shuffle(all, seed);
  }

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

  const position = idx + 1;
  const total = ordered.length;
  const percent = Math.round((position / total) * 100);

  return (
    <main className="relative mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <ScrollBackground />
      <div className="mb-6">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          <span>
            Frage {position} von {total}
          </span>
          <span className="tabular-nums text-ink-soft">{percent}%</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(.22,.9,.3,1)]"
            style={{ width: `${percent}%`, background: BRAND_ORANGE }}
            aria-hidden
          />
        </div>
      </div>
      <QuestionCard question={question} nextHref={nextHref} isLast={isLast} />
    </main>
  );
}
