// Exam route axis — single source for the /[exam]/ segment. The slug is the
// URL form ("clf"/"saa"), Cert the DB value ("CLF-C02"/"SAA-C03").
import type { Question } from "@/db/schema";

export type ExamSlug = "clf" | "saa";
export type Cert = Question["cert"];

export const EXAM_SLUGS = ["clf", "saa"] as const satisfies readonly ExamSlug[];

export const EXAM_CERT: Record<ExamSlug, Cert> = {
  clf: "CLF-C02",
  saa: "SAA-C03",
};

export function isExamSlug(value: string): value is ExamSlug {
  return (EXAM_SLUGS as readonly string[]).includes(value);
}
