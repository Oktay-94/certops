import {
  integer,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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

    // Stable, content-independent upsert key (PR: seed_key foundation).
    // Distinct from source_ref, which is a non-unique citation field. Values
    // are fixed literals in the seed files (clf-c02-q-NNN), never derived at
    // runtime. Nullable for now; uniqueness via idx_questions_seed_key, NULL-
    // freeness enforced by the backfill completeness gate + guard tests.
    seedKey: text("seed_key"),

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
    // Migration B (cutover): conflict target for the PR-2 upsert. UNIQUE allows
    // multiple NULLs in SQLite, so it is safe to apply before the backfill has
    // filled every row — duplicates only become possible once values exist, and
    // the seed keys are unique by construction (guard-tested).
    uniqueIndex("idx_questions_seed_key").on(t.seedKey),
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

    // Identity for progress separation. user_id is the sole filter key for all
    // stats/round reads; session_id stays written (notNull) purely as a
    // gerätelokaler forensic breadcrumb, never filtered on.
    userId: text("user_id"),
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
    index("idx_question_attempts_user").on(t.userId),
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

    // Stable, content-independent upsert key (PR: seed_key foundation).
    // See questions.seedKey. Values are fixed literals (clf-c02-card-NNN).
    seedKey: text("seed_key"),

    iconSlugs: text("icon_slugs", { mode: "json" }).$type<string[]>(),

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
    // Migration B (cutover): see questions.idx_questions_seed_key.
    uniqueIndex("idx_flashcards_seed_key").on(t.seedKey),
  ],
);

export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;

// Per-user "seen" tracking. Was a global flashcards.last_seen_at column, which
// two learners would overwrite for each other — so it moves into its own table
// keyed by (card_id, user_id). seen_at is upserted on each view.
export const flashcardViews = sqliteTable(
  "flashcard_views",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    cardId: integer("card_id")
      .notNull()
      .references(() => flashcards.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),

    seenAt: integer("seen_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("idx_flashcard_views_card_user").on(t.cardId, t.userId),
    index("idx_flashcard_views_user").on(t.userId),
  ],
);

export type FlashcardView = typeof flashcardViews.$inferSelect;
export type NewFlashcardView = typeof flashcardViews.$inferInsert;
