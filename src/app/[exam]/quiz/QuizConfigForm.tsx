"use client";

import { useState, useTransition } from "react";
import {
  Cloud,
  DollarSign,
  LayoutGrid,
  Server,
  Shield,
  Shuffle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import {
  DOMAINS_BY_CERT,
  QUIZ_COUNT_OPTIONS,
  type ExamDomain,
  type QuizCount,
  type QuizMode,
} from "@/lib/domains";
import { EXAM_CERT } from "@/lib/exam";
import {
  getDomainColor,
  type FallbackIconName,
} from "@/lib/domain-colors";
import { BRAND_ORANGE } from "@/lib/brand";
import { startRound } from "./actions";
import type { ExamSlug } from "@/lib/exam";

const COUNT_LABEL: Record<string, string> = {
  "10": "Schneller Durchlauf",
  "20": "Kurze Übungsrunde",
  "50": "Solides Training",
  "64": "Wie in der echten Prüfung",
  "100": "Großer Durchgang",
  all: "Alle verfügbaren Fragen am Stück",
};

type DomainChoice = ExamDomain | "all";

const DOMAIN_ICONS: Record<FallbackIconName, LucideIcon> = {
  Cloud,
  Shield,
  Server,
  DollarSign,
};

function countChipLabel(c: QuizCount): string {
  return c === "all" ? "Alle" : String(c);
}

function previewSentence(
  count: QuizCount,
  domain: DomainChoice,
  mode: QuizMode,
): string {
  const cText = count === "all" ? "alle Fragen" : `${count} Fragen`;
  const dText = domain === "all" ? "aus allen Bereichen" : `aus ${domain}`;
  const mText = mode === "random" ? "zufällig" : "schwache zuerst";
  return `Du startest: ${cText} ${dText}, ${mText}.`;
}

// Solid hex for the preview panel's left accent (dark-safe, single source).
function selectionAccentHex(domain: DomainChoice): string {
  if (domain === "all") return "var(--accent)";
  return getDomainColor(domain).solid;
}

export function QuizConfigForm({
  exam,
  questionCount,
}: {
  exam: ExamSlug;
  questionCount: number;
}) {
  const cert = EXAM_CERT[exam];
  const specificDomains = DOMAINS_BY_CERT[cert];
  const [count, setCount] = useState<QuizCount>(20);
  const [domain, setDomain] = useState<DomainChoice>("all");
  const [mode, setMode] = useState<QuizMode>("random");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDomainChange(next: DomainChoice) {
    setDomain(next);
    // Wechsel zu einer einzelnen Domain: Anzahl auf "Alle" springen, weil
    // einzelne Bereiche meist weniger Fragen als z.B. 100 enthalten.
    if (next !== "all") setCount("all");
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await startRound({ exam, count, domain, mode });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      }
    });
  }

  // Selected = accent (mockup convention); inactive = line + hover strong.
  function chipClass(active: boolean): string {
    const base =
      "rounded-lg border-[1.5px] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors disabled:cursor-not-allowed disabled:opacity-50";
    return active
      ? `${base} border-accent bg-accent-soft text-accent`
      : `${base} border-line-strong text-ink-soft hover:border-accent`;
  }

  function rowClass(active: boolean): string {
    const base =
      "flex w-full items-center gap-3 rounded-lg border-[1.5px] px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";
    return active
      ? `${base} border-accent bg-accent-soft text-ink`
      : `${base} border-line text-ink hover:border-line-strong`;
  }

  function modeClass(active: boolean): string {
    const base =
      "flex flex-1 flex-col items-start gap-1 rounded-lg border-[1.5px] px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";
    return active
      ? `${base} border-accent bg-accent-soft text-ink`
      : `${base} border-line text-ink hover:border-line-strong`;
  }

  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface p-6">
      <header className="flex items-center gap-3">
        <span className="text-[30px] leading-none" aria-hidden>
          🎯
        </span>
        <div>
          <h2 className="text-xl font-semibold text-ink sm:text-2xl">
            Quiz konfigurieren
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {questionCount} {cert}-Fragen verfügbar — Umfang und Fokus wählen
          </p>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-5">
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Anzahl Fragen
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUIZ_COUNT_OPTIONS.map((c) => (
              <button
                key={String(c)}
                type="button"
                onClick={() => setCount(c)}
                disabled={isPending}
                aria-pressed={count === c}
                className={chipClass(count === c)}
              >
                {countChipLabel(c)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-faint">{COUNT_LABEL[String(count)]}</p>
        </section>

        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Bereich
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onDomainChange("all")}
              disabled={isPending}
              aria-pressed={domain === "all"}
              className={rowClass(domain === "all")}
            >
              <LayoutGrid
                className={`h-4 w-4 shrink-0 ${
                  domain === "all" ? "text-accent" : "text-ink-faint"
                }`}
                aria-hidden
              />
              <span>Alle Bereiche</span>
            </button>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {specificDomains.map((value) => {
                const label = value;
                const color = getDomainColor(value);
                const Icon = DOMAIN_ICONS[color.fallbackIconName];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onDomainChange(value)}
                    disabled={isPending}
                    aria-pressed={domain === value}
                    className={rowClass(domain === value)}
                  >
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px]"
                      style={{ background: color.solid }}
                      aria-hidden
                    >
                      <Icon size={16} className="text-white" />
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Modus
            </h3>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("random")}
                disabled={isPending}
                aria-pressed={mode === "random"}
                className={modeClass(mode === "random")}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Shuffle
                    className={`h-4 w-4 ${mode === "random" ? "text-accent" : "text-ink-faint"}`}
                    aria-hidden
                  />
                  Zufällig
                </span>
                <span className="text-xs text-ink-soft">
                  Zufällige Auswahl aus dem Pool
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode("weakest-first")}
                disabled={isPending}
                aria-pressed={mode === "weakest-first"}
                className={modeClass(mode === "weakest-first")}
              >
                <span className="flex items-center gap-2 font-medium">
                  <TriangleAlert className="h-4 w-4 text-amber-500" aria-hidden />
                  Schwache zuerst
                </span>
                <span className="text-xs text-ink-soft">
                  Priorisiert Karten mit niedriger Trefferquote
                </span>
              </button>
            </div>
          </section>

          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Auswahl
            </h3>
            <div
              className="mt-3 flex min-h-[5.5rem] items-center rounded-lg border-l-[3px] bg-surface-2 px-3 py-2 text-sm text-ink-soft"
              style={{ borderLeftColor: selectionAccentHex(domain) }}
            >
              {previewSentence(count, domain, mode)}
            </div>
          </section>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="rounded-lg px-6 py-3 text-[13px] font-semibold transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: BRAND_ORANGE, color: "var(--cta-ink)" }}
        >
          {isPending ? "Starte …" : "Quiz starten"}
        </button>

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            Fehler: {error}
          </p>
        )}
      </div>
    </div>
  );
}
