import { notFound } from "next/navigation";
import { EXAM_SLUGS, isExamSlug } from "@/lib/exam";

// Both exams are statically known; anything else (e.g. /foo/quiz) 404s via
// the isExamSlug guard below. No dynamicParams=false here — the segment
// config would be inherited by child dynamic segments (quiz/[id] has no
// generateStaticParams and must stay dynamic).
export function generateStaticParams() {
  return EXAM_SLUGS.map((exam) => ({ exam }));
}

// The data-exam wrapper is the render anchor for the exam token axis
// (globals.css). It lives here — not on <html> — because a child layout
// cannot attribute the root element and the root layout must stay static.
export default async function ExamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  if (!isExamSlug(exam)) notFound();

  return (
    <div data-exam={exam} className="flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}
