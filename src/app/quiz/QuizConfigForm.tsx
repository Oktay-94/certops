"use client";

import { useState, useTransition } from "react";
import {
  Cloud,
  GraduationCap,
  LayoutGrid,
  Receipt,
  Server,
  Shield,
  Shuffle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import {
  CLF_C02_DOMAINS,
  QUIZ_COUNT_OPTIONS,
  type ClfC02Domain,
  type QuizCount,
  type QuizMode,
} from "@/lib/domains";
import { startRound } from "./actions";

const COUNT_LABEL: Record<string, string> = {
  "10": "Schneller Durchlauf",
  "20": "Kurze Übungsrunde",
  "50": "Solides Training",
  "64": "Wie in der echten Prüfung",
  "100": "Großer Durchgang",
  all: "Alle verfügbaren Fragen am Stück",
};

type DomainChoice = ClfC02Domain | "all";

const DOMAIN_LIST: { value: DomainChoice; label: string; icon: LucideIcon }[] = [
  { value: "all", label: "Alle Bereiche", icon: LayoutGrid },
  { value: "Cloud Concepts", label: "Cloud Concepts", icon: Cloud },
  { value: "Security and Compliance", label: "Security and Compliance", icon: Shield },
  { value: "Cloud Technology and Services", label: "Cloud Technology and Services", icon: Server },
  { value: "Billing, Pricing, and Support", label: "Billing, Pricing, and Support", icon: Receipt },
];

// satisfy unused-import linter while keeping CLF_C02_DOMAINS as source of truth
void CLF_C02_DOMAINS;

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

export function QuizConfigForm() {
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
        await startRound({ count, domain, mode });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      }
    });
  }

  function chipClass(active: boolean): string {
    const base =
      "rounded-xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50";
    return active
      ? `${base} border-zinc-200 bg-zinc-100 text-zinc-900 ring-2 ring-emerald-500`
      : `${base} border-zinc-200 text-zinc-900 hover:border-zinc-400`;
  }

  function rowClass(active: boolean): string {
    const base =
      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50";
    return active
      ? `${base} border-zinc-200 bg-zinc-100 text-zinc-900 ring-2 ring-emerald-500`
      : `${base} border-zinc-200 text-zinc-900 hover:border-zinc-400`;
  }

  function modeClass(active: boolean): string {
    const base =
      "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50";
    return active
      ? `${base} border-zinc-200 bg-zinc-100 text-zinc-900 ring-2 ring-emerald-500`
      : `${base} border-zinc-200 text-zinc-900 hover:border-zinc-400`;
  }

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
          <GraduationCap className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-medium text-zinc-900">
            Quiz konfigurieren
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            164 CLF-C02-Fragen verfügbar — Umfang und Fokus wählen
          </p>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-5">
        <section>
          <h3 className="text-sm font-medium text-zinc-900">Anzahl Fragen</h3>
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
          <p className="mt-2 text-xs text-zinc-500">{COUNT_LABEL[String(count)]}</p>
        </section>

        <section>
          <h3 className="text-sm font-medium text-zinc-900">Bereich</h3>
          {(() => {
            const [allOption, ...specificDomains] = DOMAIN_LIST;
            const AllIcon = allOption.icon;
            return (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  key={allOption.value}
                  type="button"
                  onClick={() => onDomainChange(allOption.value)}
                  disabled={isPending}
                  aria-pressed={domain === allOption.value}
                  className={rowClass(domain === allOption.value)}
                >
                  <AllIcon
                    className={`h-4 w-4 shrink-0 ${
                      domain === allOption.value ? "text-emerald-600" : ""
                    }`}
                    aria-hidden
                  />
                  <span>{allOption.label}</span>
                </button>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {specificDomains.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onDomainChange(value)}
                      disabled={isPending}
                      aria-pressed={domain === value}
                      className={rowClass(domain === value)}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          domain === value ? "text-emerald-600" : ""
                        }`}
                        aria-hidden
                      />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section>
            <h3 className="text-sm font-medium text-zinc-900">Modus</h3>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("random")}
                disabled={isPending}
                aria-pressed={mode === "random"}
                className={modeClass(mode === "random")}
              >
                <Shuffle
                  className={`h-4 w-4 ${mode === "random" ? "text-emerald-600" : ""}`}
                  aria-hidden
                />
                Zufällig
              </button>
              <button
                type="button"
                onClick={() => setMode("weakest-first")}
                disabled={isPending}
                aria-pressed={mode === "weakest-first"}
                className={modeClass(mode === "weakest-first")}
              >
                <TriangleAlert className="h-4 w-4 text-amber-500" aria-hidden />
                Schwache zuerst
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-zinc-900">Auswahl</h3>
            <div className="mt-3 flex min-h-[4.5rem] items-center rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {previewSentence(count, domain, mode)}
            </div>
          </section>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isPending ? "Starte …" : "Quiz starten"}
        </button>

        {error && <p className="text-sm text-rose-700">Fehler: {error}</p>}
      </div>
    </div>
  );
}
