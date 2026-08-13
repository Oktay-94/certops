import Link from "next/link";
import type { ReactNode } from "react";
import { EXAM_CERT, type ExamSlug } from "@/lib/exam";
import { SCENARIO_COUNT, SZENARIEN_GLYPH } from "@/lib/scenario-content";

// Seven area tiles (mockup .areas, extended from 4 to 6 — decision 2026-07-12;
// Nachschlagewerk added 2026-08-13). Since the 2b polish ALL carry a CSS-only
// hover mini-preview with STATIC content (no live data by design): Quiz option
// fills, Karten/Dienste flip, Skript scrolls (3s), Statistik sparkline draws
// itself, Übersicht chips light up staggered, Szenarien/Nachschlagewerk run an
// endless ticker. GETEILT pill marks exam-independent areas.

// Preview thumbnails. All five have a generated diagram — none is one of the
// ten cards still on a battle-card fallback (see docs/diagramm-specs-fehlend.md),
// so the tile always shows current artwork.
// Plain <img>, not next/image: these are SVGs, and the optimizer has nothing to
// do with them. It earned its place while these were 2400×1350 PNGs.
const PREVIEW_CARDS = [1, 12, 34, 60, 87] as const;

function previewSrc(nr: number): string {
  const dir = `card-${String(nr).padStart(2, "0")}`;
  return `/scenarios/${dir}/card-${String(nr).padStart(3, "0")}.web.svg`;
}

function AreaTile({
  href,
  glyph,
  title,
  desc,
  shared = false,
  badge,
  preview,
}: {
  /** Omit to render a non-interactive tile (no link, not focusable). */
  href?: string;
  glyph: string;
  title: string;
  desc: string;
  shared?: boolean;
  /** Corner label for tiles that exist but do not lead anywhere yet. */
  badge?: string;
  preview?: ReactNode;
}) {
  const body = (
    <>
      {shared && (
        <span className="absolute right-3.5 top-3.5 rounded-full border border-line px-[7px] py-[2px] font-mono text-[8.5px] tracking-[0.12em] text-ink-faint">
          GETEILT
        </span>
      )}
      {badge && (
        <span className="absolute right-3.5 top-3.5 rounded-full border border-line px-[7px] py-[2px] font-mono text-[8.5px] tracking-[0.12em] text-ink-faint">
          {badge}
        </span>
      )}
      <h3 className="flex items-center gap-2.5 text-[14.5px] font-semibold text-ink">
        <span className="area-glyph text-[30px] leading-none" aria-hidden>
          {glyph}
        </span>
        {title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{desc}</p>
      {preview && <div className="mt-3.5">{preview}</div>}
    </>
  );

  const shell = "area-tile relative block rounded-xl border border-line p-[18px]";

  // Dead-but-not-empty: still hovers and animates, but is neither a link nor a
  // tab stop. aria-disabled tells AT what the muted styling shows visually.
  if (!href) {
    return (
      <div aria-disabled className={`${shell} cursor-default bg-surface opacity-70`}>
        {body}
      </div>
    );
  }

  return (
    <Link href={href} className={`${shell} bg-surface`}>
      {body}
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

function DienstePreview() {
  return (
    <div aria-hidden className="pv-card-scene">
      <div className="pv-card h-[64px]">
        <div className="pv-card-face flex h-full flex-col items-center justify-center gap-0.5 rounded-lg border border-line bg-surface px-3 text-center">
          <span className="text-lg">🪣</span>
          <span className="text-[11px] font-semibold text-ink">Amazon S3</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-faint">
            Storage
          </span>
        </div>
        <div className="pv-card-back-surface flex items-center justify-center rounded-lg border border-line px-3 text-center text-[10.5px] leading-snug text-ink-soft">
          Der unendliche Eimer für Objekte jeder Größe.
        </div>
      </div>
    </div>
  );
}

function StatistikPreview() {
  // Static path (points from the statistik-v3 sparkline, 150×34 viewBox);
  // .pv-spark-path draws itself on tile hover via dashoffset → 0.
  return (
    <div aria-hidden className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <svg viewBox="0 0 150 34" className="block h-[44px] w-full">
        <line
          x1="0"
          y1="9.5"
          x2="150"
          y2="9.5"
          stroke="var(--border-strong)"
          strokeDasharray="3 3"
        />
        <path
          className="pv-spark-path"
          d="M2 17.6 L18.2 11.1 L34.4 14.4 L50.7 7.9 L66.9 22 L83.1 4.6 L99.3 8.9 L115.6 0.3 L131.8 10 L148 5.7"
          fill="none"
          stroke="var(--success)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function UebersichtPreview() {
  return (
    <div aria-hidden className="flex flex-wrap gap-1.5">
      {["EC2", "S3", "LAMBDA"].map((label) => (
        <span
          key={label}
          className="pv-chip bg-surface px-2.5 py-1 font-mono text-[9.5px] tracking-[0.06em] text-ink-soft"
        >
          {label}
        </span>
      ))}
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
        <p>Kein Rätselraten bei der Kapazität, Tempo und Innovation.</p>
        <p className="font-semibold text-ink">Well-Architected</p>
        <p>Sechs Säulen von Operational Excellence bis Sustainability.</p>
      </div>
    </div>
  );
}

// Endless vertical ticker (handoff B2/B3): paused at rest, running on hover and
// keyboard focus. The first item is duplicated at the end so the wrap is
// seamless — the keyframe travels exactly the height of the original list.
function SzenarienPreview() {
  const cards = [...PREVIEW_CARDS, PREVIEW_CARDS[0]];
  return (
    <div
      aria-hidden
      className="pv-ticker-mask h-[64px] overflow-hidden rounded-lg border border-line bg-surface-2"
    >
      <div className="pv-ticker">
        {cards.map((nr, i) => (
          <div
            key={`${nr}-${i}`}
            className="flex h-[64px] items-center justify-center px-2"
          >
            {/* Two things here are deliberate, both learned the hard way:
                - Fixed box, not w-auto: an unloaded image with auto width has a
                  0×0 rect. It also keeps the ticker from jumping as images land.
                - NO loading="lazy": these sit in a 64px overflow-hidden window,
                  and Chrome does not load lazy images clipped by an ancestor —
                  the tile stayed empty. Five SVGs, 117 KB raw and highly
                  compressible, so eager is the cheaper trade. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc(nr)}
              alt=""
              width={156}
              height={52}
              className="h-[52px] w-[156px] rounded-[3px] object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const NACHSCHLAGE_TERMS = [
  "Elastizität",
  "SLA",
  "IOPS",
  "RPO und RTO",
  "Shared Responsibility",
];

function NachschlagewerkPreview() {
  const terms = [...NACHSCHLAGE_TERMS, NACHSCHLAGE_TERMS[0]];
  return (
    <div
      aria-hidden
      className="pv-ticker-mask h-[64px] overflow-hidden rounded-lg border border-line bg-surface-2"
    >
      <div className="pv-ticker">
        {terms.map((term, i) => (
          <div
            key={`${term}-${i}`}
            className="flex h-[64px] items-center px-3 text-[11px] text-ink-soft"
          >
            {term}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AreaTiles({ exam }: { exam: ExamSlug }) {
  if (exam === "saa") {
    // SAA track: Quiz, Karten, Skript, Statistik plus Szenarien (battle
    // cards). Dienste and Übersicht are CLF-only and deliberately absent.
    return (
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <AreaTile
          href="/saa/quiz"
          glyph="🎯"
          title={`${EXAM_CERT[exam]} Prüfungsquiz`}
          desc="265 Fragen in Runden, schwächste zuerst."
          preview={<QuizPreview />}
        />
        <AreaTile
          href="/saa/cards"
          glyph="🗂️"
          title="Karteikarten"
          desc="207 Karten im Blueprint-Schema, D1–D4."
          preview={<CardPreview />}
        />
        <AreaTile
          href="/saa/skript"
          glyph="📖"
          title="Skript"
          desc="137 Dienst-Skripte: Recap, Vertiefung, Knackpunkte."
          preview={<SkriptPreview />}
        />
        <AreaTile
          href="/saa/stats"
          glyph="📊"
          title="Statistik"
          desc="Trends, Schwachstellen, Verlauf pro Runde."
          preview={<StatistikPreview />}
        />
        <AreaTile
          href="/saa/szenarien"
          glyph={SZENARIEN_GLYPH}
          title="Szenarien"
          desc={`${SCENARIO_COUNT} Battle Cards: Architektur-Diagramm, Signalwörter, Fallen.`}
          preview={<SzenarienPreview />}
        />
        <AreaTile
          glyph="📚"
          title="Nachschlagewerk"
          desc="Alles aus dem Skript in Kurzform zum Nachschlagen."
          badge="Bald"
          preview={<NachschlagewerkPreview />}
        />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      <AreaTile
        href={`/${exam}/quiz`}
        glyph="🎯"
        title={`${EXAM_CERT[exam]} Prüfungsquiz`}
        desc="264 Fragen in Runden, schwächste zuerst."
        preview={<QuizPreview />}
      />
      <AreaTile
        href={`/${exam}/cards`}
        glyph="🗂️"
        title="Karteikarten"
        desc="150 Karten mit Eselsbrücken und Icons."
        preview={<CardPreview />}
      />
      <AreaTile
        href={`/${exam}/skript`}
        glyph="📖"
        title="Skript"
        desc="13 Kapitel, vorlesbar, mit Deep-Links."
        shared
        preview={<SkriptPreview />}
      />
      <AreaTile
        href={`/${exam}/services`}
        glyph="🧩"
        title="Dienste"
        desc="172 AWS-Dienste frei üben: Flip, Battle, Puzzle."
        preview={<DienstePreview />}
      />
      <AreaTile
        href={`/${exam}/stats`}
        glyph="📊"
        title="Statistik"
        desc="Trends, Schwachstellen, Verlauf pro Runde."
        preview={<StatistikPreview />}
      />
      <AreaTile
        href={`/${exam}/uebersicht`}
        glyph="🔍"
        title="Übersicht"
        desc="Alle Dienste alphabetisch, mit Suche."
        shared
        preview={<UebersichtPreview />}
      />
    </div>
  );
}
