import { db } from "./index";
import { questionAttempts, questions } from "./schema";
import { clfC02Questions } from "./seed/index";

// CLF-C02 domains (AWS Exam Guide):
//   1. Cloud Concepts
//   2. Security and Compliance
//   3. Cloud Technology and Services
//   4. Billing, Pricing, and Support

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }

  const all = [...clfC02Questions];
  if (all.length === 0) {
    console.log("No seed data defined yet — skipping insert.");
    return;
  }

  // FK (question_attempts.question_id -> questions.id, ON DELETE RESTRICT)
  // forces us to clear attempts before reseeding questions.
  db.delete(questionAttempts).run();
  db.delete(questions).run();
  db.insert(questions).values(all).run();
  console.log(`Seeded ${all.length} question(s).`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
