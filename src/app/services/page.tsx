import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SERVICES } from "@/lib/services-data";
import { ServiceCardGrid } from "@/components/services/ServiceCardGrid";
import { ServiceQuiz } from "@/components/services/ServiceQuiz";

export default function ServicesPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
            AWS Dienste
          </h1>
          <p className="mt-3 text-zinc-600">
            {SERVICES.length} Service-Karteikarten · freies Üben, kein Fortschritt
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition hover:border-zinc-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Zum Dashboard
        </Link>
      </div>

      {/* Quiz entry — pure client island, full-screen overlay */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Dienste-Quiz</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Dienst-Name gezeigt — wähle die passende Beschreibung. Zufällige
          Auswahl, kein gespeicherter Fortschritt.
        </p>
        <ServiceQuiz />
      </div>

      <ServiceCardGrid />
    </main>
  );
}
