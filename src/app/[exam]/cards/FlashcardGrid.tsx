"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { renderInline } from "@/lib/inline-markup";
import {
  ArrowLeft,
  Lightbulb,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Search,
  Shuffle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkFlexibleMarkers from "remark-flexible-markers";
import { getDomainColor } from "@/lib/domain-colors";
import { markFlashcardSeen, resetFlashcardViews } from "./actions";
import type { ExamSlug } from "@/lib/exam";
import type { FlashcardBackStructured } from "@/lib/flashcard-back";

// Domain emoji = fallback when no topic keyword matches. 80/150 cards live in
// "Cloud Technology and Services", so the domain emoji alone made almost every
// card the same 🧰 — the topic map below differentiates by card content first.
const DOMAIN_EMOJI: Record<string, string> = {
  "Cloud Concepts": "☁️",
  "Security and Compliance": "🔒",
  "Cloud Technology and Services": "🧰",
  "Billing, Pricing, and Support": "💵",
};

// Topic → emoji, matched against the card front (first hit wins, so order =
// specificity). Keeps the emoji tied to what the card is actually about.
const TOPIC_EMOJI: Array<[RegExp, string]> = [
  [/\b(ec2|instanz|instance|compute|virtuelle server)\b/i, "🖥️"],
  [/\b(lambda|serverless)\b/i, "⚡"],
  [/\b(container|ecs|eks|fargate|docker|kubernetes)\b/i, "📦"],
  [/\b(s3|bucket|objektspeicher|object storage)\b/i, "🪣"],
  [/\b(ebs|efs|fsx|storage gateway|volume|block storage)\b/i, "🗄️"],
  [/\b(rds|aurora|dynamodb|datenbank|database|redshift|sql)\b/i, "🗃️"],
  [/\b(vpc|subnet|netzwerk|network|peering|transit gateway)\b/i, "🌐"],
  [/\b(route ?53|dns)\b/i, "🧭"],
  [/\b(cloudfront|cdn|edge)\b/i, "📡"],
  [/\b(load balancer|elb|alb|nlb|auto ?scaling|skalier)\b/i, "⚖️"],
  [/\b(sns|sqs|eventbridge|queue|messaging|nachricht)\b/i, "📨"],
  [/\b(api gateway|rest api)\b/i, "🔌"],
  [/\b(cloudwatch|monitoring|logs|metrik|metric|x-ray)\b/i, "📊"],
  [/\b(athena|kinesis|glue|quicksight|emr|analytics|analyse)\b/i, "📈"],
  [/\b(sagemaker|rekognition|comprehend|machine learning|\bki\b|\bml\b|\bai\b)\b/i, "🤖"],
  [/\b(migration|snowball|snowcone|dms|transfer)\b/i, "🚚"],
  [/\b(backup|disaster recovery|\bdr\b|wiederherstellung)\b/i, "💾"],
  [/\b(iam|kms|encryption|verschlüssel|cognito|secrets|waf|shield|guardduty)\b/i, "🔒"],
  [/\b(compliance|audit|governance|artifact|config|control tower|organizations)\b/i, "📋"],
  [/\b(shared responsibility|geteilte verantwortung)\b/i, "🤝"],
  [/\b(billing|cost|kosten|pricing|preis|budget|savings plan|reserved)\b/i, "💵"],
  [/\b(support|basic|developer|business|enterprise)\b.*\bplan\b/i, "🛟"],
  [/\b(well[- ]architected|architektur|architecture|design principle)\b/i, "🏛️"],
  [/\b(region|availability zone|verfügbarkeitszone|\baz\b|global)\b/i, "🗺️"],
];

function cardEmoji(front: string, domain: string): string {
  for (const [re, emoji] of TOPIC_EMOJI) {
    if (re.test(front)) return emoji;
  }
  return DOMAIN_EMOJI[domain] ?? "📇";
}

const MARKDOWN_COMPONENTS = {
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-4" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-4" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-surface-2 px-1 text-[13px]" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-ink-soft" {...props} />
  ),
  // mark stays bg-orange-100 (== highlight signal, test-locked).
  mark: ({
    className: _ignored,
    ...rest
  }: React.HTMLAttributes<HTMLElement>) => (
    <mark
      {...rest}
      className="rounded bg-orange-100 px-1 text-orange-900"
    />
  ),
};

const MARKDOWN_ALLOWED = [
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "code",
  "mark",
];

const REMARK_PLUGINS = [remarkFlexibleMarkers];

export type FlashcardItem = {
  id: number;
  cert: string;
  domain: string;
  front: string;
  back: string;
  // Shape-guarded server-side (page.tsx); null → plain `back` fallback.
  backStructured: FlashcardBackStructured | null;
  iconSlugs: string[] | null;
};

// Fixed section order on the structured back; missing/empty sections are
// simply skipped. Labels are the product wording (see flashcard-back.ts).
const BACK_SECTIONS: Array<{
  key: keyof Omit<FlashcardBackStructured, "keywords">;
  label: string;
}> = [
  { key: "summary", label: "Kurz gesagt" },
  { key: "why", label: "Warum so?" },
  { key: "example", label: "Beispiel" },
  { key: "examTrap", label: "⚠ Prüfungs-Knackpunkt" },
  { key: "mnemonic", label: "Merksatz" },
];

function StructuredBack({ data }: { data: FlashcardBackStructured }) {
  const keywords = (data.keywords ?? []).filter((k) => k.trim() !== "");
  return (
    <div className="space-y-3.5">
      {BACK_SECTIONS.map(({ key, label }) => {
        const text = data[key];
        if (!text || text.trim() === "") return null;
        return (
          <section key={key}>
            <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              {label}
            </h4>
            <p className="mt-1 whitespace-pre-wrap text-ink-soft">
              {renderInline(text)}
            </p>
          </section>
        );
      })}
      {keywords.length > 0 && (
        <section>
          <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Stichworte
          </h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span
                key={k}
                className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-soft"
              >
                {k}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Search must also hit the structured sections, not just the legacy back.
function backSearchText(c: FlashcardItem): string {
  if (!c.backStructured) return c.back;
  const s = c.backStructured;
  return [
    c.back,
    s.summary,
    s.why,
    s.example,
    s.examTrap,
    s.mnemonic,
    ...(s.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

type Props = {
  cards: FlashcardItem[];
  domains: string[];
  exam: ExamSlug;
};

function shuffleInPlace<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function FlashcardGrid({ cards, domains, exam }: Props) {
  const homeHref = `/${exam}`;
  const initialOrder = useMemo(() => cards.map((c) => c.id), [cards]);
  const byId = useMemo(() => {
    const m = new Map<number, FlashcardItem>();
    for (const c of cards) m.set(c.id, c);
    return m;
  }, [cards]);
  const displayNumberById = useMemo(() => {
    const m = new Map<number, number>();
    cards.forEach((c, i) => m.set(c.id, i + 1));
    return m;
  }, [cards]);

  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("all");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [order, setOrder] = useState<number[]>(initialOrder);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return order
      .map((id) => byId.get(id))
      .filter((c): c is FlashcardItem => !!c)
      .filter((c) => (domain === "all" ? true : c.domain === domain))
      .filter((c) =>
        q === ""
          ? true
          : (c.front + " " + backSearchText(c)).toLowerCase().includes(q),
      );
  }, [order, byId, domain, query]);

  const flippedVisibleCount = useMemo(
    () => visible.reduce((n, c) => n + (flipped.has(c.id) ? 1 : 0), 0),
    [visible, flipped],
  );

  function onShuffle() {
    setOrder((prev) => shuffleInPlace(prev));
  }

  function onFlipAll() {
    setFlipped((prev) => {
      const next = new Set(prev);
      const anyOpen = visible.some((c) => next.has(c.id));
      if (anyOpen) {
        for (const c of visible) next.delete(c.id);
      } else {
        for (const c of visible) next.add(c.id);
      }
      return next;
    });
  }

  function onReset() {
    setQuery("");
    setDomain("all");
    setFlipped(new Set());
    setOrder(initialOrder);
    void resetFlashcardViews(exam).catch(() => {});
  }

  function toggleCard(id: number) {
    const wasUnflipped = !flipped.has(id);
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (wasUnflipped) {
      void markFlashcardSeen(id).catch(() => {});
    }
  }

  // Uniform token buttons (dark-safe); icon + label distinguish the actions.
  const btn =
    "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1 sm:flex-none">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Karten durchsuchen …"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">Alle Bereiche</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <button type="button" onClick={onShuffle} className={btn}>
          <Shuffle className="h-4 w-4 text-ink-faint" aria-hidden />
          Mischen
        </button>
        <button type="button" onClick={onFlipAll} className={btn}>
          <RefreshCw className="h-4 w-4 text-ink-faint" aria-hidden />
          Alle umdrehen
        </button>
        <button type="button" onClick={onReset} className={btn}>
          <RotateCcw className="h-4 w-4 text-ink-faint" aria-hidden />
          Reset
        </button>
        <Link href={homeHref} className={btn}>
          <ArrowLeft className="h-4 w-4 text-ink-faint" aria-hidden />
          Zum Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-ink">
          <span>
            Karten gesamt: <span>{cards.length}</span>
          </span>
          <span>
            Angezeigt:{" "}
            <span className="text-accent">{visible.length}</span>
          </span>
          <span>
            Umgedreht:{" "}
            <span style={{ color: "var(--success)" }}>
              {flippedVisibleCount}
            </span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-faint">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden />
          Vorderseite = Frage · Rückseite = Antwort
        </span>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-ink-faint">
          Keine Karten gefunden.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => {
            const isFlipped = flipped.has(c.id);
            const color = getDomainColor(c.domain);
            const emoji = cardEmoji(c.front, c.domain);
            const stripe = (
              <div
                className="w-[5px] shrink-0"
                style={{ background: color.solid }}
                aria-hidden
              />
            );
            return (
              // Whole card flips in 3D (button = perspective scene).
              <button
                key={c.id}
                type="button"
                data-testid="flashcard"
                onClick={() => toggleCard(c.id)}
                className="flip-scene relative h-[27rem] text-left"
              >
                <div
                  className={`flip-inner rounded-xl shadow-[0_22px_46px_-18px_rgba(24,24,27,0.24)] dark:shadow-none ${
                    isFlipped ? "flipped" : ""
                  }`}
                >
                  {/* FRONT — neutral surface */}
                  <div className="flip-face flex overflow-hidden rounded-xl border border-line bg-surface">
                    {stripe}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex min-w-0 shrink-0 items-center px-5 pb-3 pt-4">
                        <span
                          className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium"
                          style={{
                            color: color.solid,
                            borderColor: `color-mix(in srgb, ${color.solid} 35%, transparent)`,
                            background: `color-mix(in srgb, ${color.solid} 12%, transparent)`,
                          }}
                        >
                          <span className="shrink-0 font-bold">
                            {displayNumberById.get(c.id)}.
                          </span>
                          <span className="min-w-0 truncate">{c.domain}</span>
                        </span>
                      </div>
                      <div className="mx-5 shrink-0 border-t border-line" />
                      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5">
                        <span
                          className="text-[30px] leading-none [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.12))]"
                          aria-hidden
                        >
                          {emoji}
                        </span>
                        <p className="whitespace-pre-wrap text-center text-[15px] font-semibold leading-relaxed text-ink">
                          {renderInline(c.front)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center justify-center gap-1 py-4 text-[11px] text-ink-faint">
                        <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                        Klicken für Antwort
                      </div>
                    </div>
                  </div>

                  {/* BACK — neutral surface like the front; the stripe + "Antwort"
                      label mark the answer side (no tinted background) */}
                  <div className="flip-face flip-back flex overflow-hidden rounded-xl border border-line bg-surface">
                    {stripe}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex min-w-0 shrink-0 items-center gap-2 px-5 pb-3 pt-4">
                        <span
                          className="shrink-0 rounded-full px-2 py-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.1em]"
                          style={{
                            color: color.solid,
                            background: `color-mix(in srgb, ${color.solid} 18%, transparent)`,
                          }}
                        >
                          Antwort
                        </span>
                        <span className="min-w-0 truncate text-[12px] font-medium text-ink-soft">
                          {c.domain}
                        </span>
                      </div>
                      <div className="mx-5 shrink-0 border-t border-line" />
                      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pr-4 text-sm leading-relaxed text-ink-soft">
                        {c.backStructured ? (
                          <StructuredBack data={c.backStructured} />
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={REMARK_PLUGINS}
                            allowedElements={MARKDOWN_ALLOWED}
                            unwrapDisallowed
                            components={MARKDOWN_COMPONENTS}
                          >
                            {c.back}
                          </ReactMarkdown>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center justify-center gap-1 py-4 text-[11px] text-ink-faint">
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        Klicken zum Umdrehen
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
