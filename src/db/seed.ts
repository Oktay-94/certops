import "./load-env-turso";
import { db } from "./index";
import { flashcards, questionAttempts, questions } from "./schema";
import { clfC02Questions } from "./seed/index";
import { clfC02QuestionsBatch2 } from "./seed/questions/index";
import { clfC02Flashcards } from "./seed/cards/index";
import { addBoldedTerms } from "../lib/markdown-bold";
import { addServiceMarkers } from "../lib/markdown-marks";

// CLF-C02 domains (AWS Exam Guide):
//   1. Cloud Concepts
//   2. Security and Compliance
//   3. Cloud Technology and Services
//   4. Billing, Pricing, and Support

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }

  const all = [...clfC02Questions, ...clfC02QuestionsBatch2];
  if (all.length === 0) {
    console.log("No seed data defined yet — skipping insert.");
    return;
  }

  // FK (question_attempts.question_id -> questions.id, ON DELETE RESTRICT)
  // forces us to clear attempts before reseeding questions.
  await db.delete(questionAttempts).run();
  await db.delete(questions).run();
  await db.delete(flashcards).run();
  await db.insert(questions).values(all).run();
  const markdownCards = clfC02Flashcards.map((c) => ({
    ...c,
    back: addServiceMarkers(addBoldedTerms(c.back)),
  }));
  await db.insert(flashcards).values(markdownCards).run();
  console.log(
    `Seeded ${all.length} question(s), ${clfC02Flashcards.length} flashcard(s).`,
  );
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
