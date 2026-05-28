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

export type QuestionDisplay = Pick<
  Question,
  "id" | "cert" | "domain" | "type" | "prompt" | "choices"
>;

export const questionAttempts = sqliteTable(
  "question_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),

    selected: text("selected", { mode: "json" }).$type<string[]>().notNull(),
    correct: integer("correct", { mode: "boolean" }).notNull(),

    sessionId: text("session_id").notNull(),
    roundId: text("round_id"),
    timeTakenMs: integer("time_taken_ms"),

    answeredAt: integer("answered_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_question_attempts_session").on(t.sessionId),
    index("idx_question_attempts_question").on(t.questionId),
    index("idx_question_attempts_round").on(t.roundId),
  ],
);

export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type NewQuestionAttempt = typeof questionAttempts.$inferInsert;

export const flashcards = sqliteTable(
  "flashcards",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    cert: text("cert", { enum: ["CLF-C02", "SAA-C03"] }).notNull(),
    domain: text("domain").notNull(),

    front: text("front").notNull(),
    back: text("back").notNull(),

    difficulty: integer("difficulty"),
    sourceRef: text("source_ref"),

    iconSlugs: text("icon_slugs", { mode: "json" }).$type<string[]>(),

    lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("idx_flashcards_cert").on(t.cert),
    index("idx_flashcards_cert_domain").on(t.cert, t.domain),
  ],
);

export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;
