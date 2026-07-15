import "./load-env-turso";
import { db } from "./index";
import { clfC02Questions } from "./seed/index";
import { clfC02QuestionsBatch2 } from "./seed/questions/index";
import { clfC02QuestionsBatch3 } from "./seed/questions/index-batch3";
import { clfC02Flashcards } from "./seed/cards/index";
import { saaC03Questions, saaC03Flashcards } from "./seed/saa/index";
import { assertWritableTarget } from "./prod-guard";
import { runSeed } from "./seed-core";

// CLF-C02 domains (AWS Exam Guide):
//   1. Cloud Concepts
//   2. Security and Compliance
//   3. Cloud Technology and Services
//   4. Billing, Pricing, and Support

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }
  assertWritableTarget("seed");

  const all = [
    ...clfC02Questions,
    ...clfC02QuestionsBatch2,
    ...clfC02QuestionsBatch3,
    ...saaC03Questions,
  ];
  if (all.length === 0) {
    console.log("No seed data defined yet — skipping insert.");
    return;
  }

  const result = await runSeed(db, {
    questions: all,
    cards: [...clfC02Flashcards, ...saaC03Flashcards],
  });
  console.log(
    `Upserted ${result.questions} question(s), ${result.cards} flashcard(s).`,
  );
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
