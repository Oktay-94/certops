import Link from "next/link";
import type { ReactNode } from "react";

// Six area tiles (mockup .areas, extended from 4 to 6 — decision 2026-07-12).
// Quiz/Karten/Skript carry CSS-only hover mini-previews with STATIC content
// (no live data by design); Dienste/Statistik/Übersicht stay text-only.
// GETEILT pill marks exam-independent areas (Skript, Übersicht).

function AreaTile({
  href,
  glyph,
  title,
  desc,
  shared = false,
  preview,
}: {
  href: string;
  glyph: string;
  title: string;
  desc: string;
  shared?: boolean;
  preview?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="area-tile relative block rounded-xl border border-line bg-surface p-5"
    >
      {shared && (
        <span className="absolute right-3.5 top-3.5 rounded-full border border-line px-[7px] py-[2px] font-mono text-[8.5px] tracking-[0.12em] text-ink-faint">
          GETEILT
        </span>
      )}
      <h3 className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
        <span className="font-mono text-accent">{glyph}</span>
        {title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{desc}</p>
      {preview && <div className="mt-3.5">{preview}</div>}
    </Link>
  );
}

function QuizPreview() {
  return (
    <div aria-hidden className="space-y-1.5">
      {[
        { label: "Verfügbarkeit", correct: false },
        { label: "Elastizität", correct: true },
        { label: "Agilität", correct: false },
      ].map((opt) => (
        <div
          key={opt.label}
          className={`pv-opt px-2.5 py-1.5 text-[11px] text-ink-soft ${
            opt.correct ? "pv-opt-correct" : ""
          }`}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}

function CardPreview() {
  return (
    <div aria-hidden className="pv-card-scene">
      <div className="pv-card h-[64px]">
        <div className="pv-card-face flex h-full items-center justify-center rounded-lg border border-line bg-surface-2 px-3 text-center text-[11px] font-medium text-ink">
          Was ist Amazon S3?
        </div>
        <div className="pv-card-back flex items-center justify-center rounded-lg border border-line px-3 text-center text-[10.5px] leading-snug text-ink">
          Objektspeicher mit 11×9 Haltbarkeit
        </div>
      </div>
    </div>
  );
}

function SkriptPreview() {
  return (
    <div
      aria-hidden
      className="h-[64px] overflow-hidden rounded-lg border border-line bg-surface-2 px-3 py-2"
    >
      <div className="pv-scroll space-y-1 text-[10px] leading-relaxed text-ink-soft">
        <p className="font-semibold text-ink">☁️ Grundlagen der Cloud</p>
        <p>Cloud Computing ist die On-Demand-Bereitstellung von IT-Ressourcen…</p>
        <p>Statt eigener Rechenzentren mietest du Kapazität nach Bedarf.</p>
        <p className="font-semibold text-ink">Sechs Vorteile</p>
        <p>Agilität, Elastizität, Kostenvorteile, globale Reichweite…</p>
      </div>
    </div>
  );
}

export function AreaTiles() {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      <AreaTile
        href="/quiz"
        glyph="◈"
        title="Szenario-Quiz"
        desc="264 Fragen in Runden, schwächste zuerst."
        preview={<QuizPreview />}
      />
      <AreaTile
        href="/cards"
        glyph="▤"
        title="Karteikarten"
        desc="150 Karten mit Eselsbrücken und Icons."
        preview={<CardPreview />}
      />
      <AreaTile
        href="/skript"
        glyph="☰"
        title="Skript"
        desc="13 Kapitel, vorlesbar, mit Deep-Links."
        shared
        preview={<SkriptPreview />}
      />
      <AreaTile
        href="/services"
        glyph="⬡"
        title="Dienste"
        desc="172 AWS-Dienste frei üben: Flip, Battle, Puzzle."
      />
      <AreaTile
        href="/stats"
        glyph="∿"
        title="Statistik"
        desc="Trends, Schwachstellen, Verlauf pro Runde."
      />
      <AreaTile
        href="/uebersicht"
        glyph="⌕"
        title="Übersicht"
        desc="Alle Dienste alphabetisch, mit Suche."
        shared
      />
    </div>
  );
}
