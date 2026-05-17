import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export type Choice = { id: string; text: string };

export const questions = sqliteTable(
  "questions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    cert: text("cert", { enum: ["CLF-C02", "SAA-C03"] }).notNull(),
    domain: text("domain").notNull(),

    type: text("type", { enum: ["single", "multiple"] }).notNull(),
    prompt: text("prompt").notNull(),
    choices: text("choices", { mode: "json" }).$type<Choice[]>().notNull(),
    correct: text("correct", { mode: "json" }).$type<string[]>().notNull(),
    explanation: text("explanation").notNull(),

    difficulty: integer("difficulty"),
    sourceRef: text("source_ref"),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("idx_questions_cert").on(t.cert),
    index("idx_questions_cert_domain").on(t.cert, t.domain),
  ],
);

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
