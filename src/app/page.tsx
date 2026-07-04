import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  BookOpen,
  Boxes,
  Calendar,
  ClipboardCheck,
  Layers,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { BRAND_ORANGE } from "@/lib/brand";
import { db } from "@/db";
import {
  countSeenFlashcards,
  getFlashcards,
  getOverallAvgLast3,
} from "@/db/repository";
import { EXAM_DATE, daysUntil } from "@/lib/config";
import { getActiveProfileId } from "@/lib/profile-cookie";
import { getProfileBranding } from "@/lib/profile-branding";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";

export default async function Home() {
  const userId = await getActiveProfileId();
  const branding = getProfileBranding(userId);

  const cardsTotal = (await getFlashcards(db, "CLF-C02")).length;
  const seenCount = userId
    ? await countSeenFlashcards(db, "CLF-C02", userId)
    : 0;
  const avgLast3 = userId
    ? await getOverallAvgLast3(db, userId, "CLF-C02")
    : null;

  const now = new Date();
  const examPassed = EXAM_DATE.getTime() < now.getTime();
  const daysLeft = daysUntil(EXAM_DATE, now);

  const avgPct =
    avgLast3 === null ? "—" : `${Math.round(avgLast3 * 100)}%`;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          {branding ? (
            // Logo already contains the "AWS-Zertifikats-Vorbereitung" subtitle.
            <Image
              src={branding.logoSrc}
              alt="CertOps"
              width={1200}
              height={428}
              priority
              className="h-auto w-full max-w-[200px] sm:max-w-[260px]"
            />
          ) : (
            // Fallback: no active profile — keep the plain text header.
            <>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
                CertOps
              </h1>
              <p className="mt-3 text-zinc-600">AWS-Zertifikats-Vorbereitung</p>
            </>
          )}
        </div>
        {userId && <ProfileSwitcher activeProfileId={userId} />}
      </div>

      {!userId && (
        <div className="mt-8">
          <ProfileSwitcher activeProfileId={null} />
        </div>
      )}

      <section className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <StatCard
          label="Ø Trefferquote"
          value={avgPct}
          valueClass="text-emerald-700"
          hint="letzte 3 Runden"
          squareBg="bg-emerald-50"
          icon={TrendingUp}
          iconClass="text-emerald-500"
        />
        <StatCard
          label="Karteikarten"
          value={
            <>
              {seenCount}
              <span className="ml-1 text-base font-medium text-zinc-500">
                / {cardsTotal}
              </span>
            </>
          }
          valueClass="text-zinc-900"
          hint="gesehen"
          squareBg="bg-zinc-100"
          icon={Layers}
          iconClass="text-zinc-600"
        />
        <StatCard
          label="CLF-C02-Prüfung"
          value={`${daysLeft} Tage`}
          valueClass="text-amber-700"
          hint={examPassed ? "verstrichen" : "bis zur Prüfung"}
          squareBg="bg-amber-100"
          icon={Calendar}
          iconClass="text-amber-500"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <NavCard
          href="/quiz"
          title="Quiz"
          subtitle="Übungsmodus — Umfang & Fokus wählbar"
          squareBg="bg-emerald-500"
          icon={ClipboardCheck}
        />
        <NavCard
          href="/stats"
          title="Statistik"
          subtitle="Trefferquoten und Schwachstellen"
          squareBg="bg-indigo-600"
          icon={BarChart3}
        />
        <NavCard
          href="/cards"
          title="Karteikarten"
          subtitle={`${cardsTotal} Karten — Begriffe trainieren`}
          squareBg="bg-amber-500"
          icon={BookOpen}
        />
      </section>

      {/* Separated block: standalone free-practice islands — no progress tracking */}
      <section className="mt-10 flex flex-col gap-4 border-t border-zinc-200 pt-8">
        <Link
          href="/services"
          className="flex flex-col gap-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-5 transition hover:border-zinc-400 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]"
              style={{ backgroundColor: BRAND_ORANGE }}
              aria-hidden
            >
              <Boxes size={20} className="text-white" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                AWS Dienste (Karteikarten &amp; Quiz)
              </h2>
              <p className="mt-1 text-[12.5px] text-zinc-500">
                152 Service-Karten + generatives Quiz — freies Üben, kein
                gespeicherter Fortschritt.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
            freies Üben
          </span>
        </Link>

        <Link
          href="/skript"
          className="flex flex-col gap-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-5 transition hover:border-zinc-400 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]"
              style={{ backgroundColor: BRAND_ORANGE }}
              aria-hidden
            >
              <BookOpen size={20} className="text-white" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                AWS-Lernskript
              </h2>
              <p className="mt-1 text-[12.5px] text-zinc-500">
                13 Kapitel, 172 Dienste als Lesestoff — mit Sprungzielen aus
                den Service-Karten.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
            freies Lesen
          </span>
        </Link>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  valueClass,
  hint,
  squareBg,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass: string;
  hint: string;
  squareBg: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-col">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className={`mt-1 text-2xl font-bold ${valueClass}`}>
          {value}
        </span>
        <span className="mt-1 text-xs text-zinc-500">{hint}</span>
      </div>
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] ${squareBg}`}
        aria-hidden
      >
        <Icon size={16} className={iconClass} />
      </span>
    </div>
  );
}

function NavCard({
  href,
  title,
  subtitle,
  squareBg,
  icon: Icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  squareBg: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-zinc-200 bg-white p-[18px] transition hover:border-zinc-400 hover:shadow-sm"
    >
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-[5px] ${squareBg}`}
        aria-hidden
      >
        <Icon size={20} className="text-white" />
      </span>
      <h2 className="mt-3 text-base font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 text-[12.5px] text-zinc-500">{subtitle}</p>
    </Link>
  );
}
