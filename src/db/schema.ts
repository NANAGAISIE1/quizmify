import {
  pgTable,
  text,
  timestamp,
  boolean,
  json,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

// Enum equivalent
export const GameType = {
  mcq: "mcq",
  open_ended: "open_ended",
} as const;

export type GameType = (typeof GameType)[keyof typeof GameType];

// Game table
export const games = pgTable("game", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  timeStarted: timestamp("time_started").notNull(),
  topic: text("topic").notNull(),
  timeEnded: timestamp("time_ended"),
  gameType: text("game_type").notNull().$type<GameType>(),
});

// Game relations
export const gamesRelations = relations(games, ({ many, one }) => ({
  questions: many(questions),
  user: one(user, {
    fields: [games.userId],
    references: [user.id],
  }),
}));

// Topic count table
export const topicCounts = pgTable("topic_count", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  topic: text("topic").unique().notNull(),
  count: integer("count").notNull(),
});

// Question table
export const questions = pgTable("question", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  gameId: text("game_id").notNull(),
  options: json("options"),
  percentageCorrect: real("percentage_correct"),
  isCorrect: boolean("is_correct"),
  questionType: text("question_type").notNull().$type<GameType>(),
  userAnswer: text("user_answer"),
});

// Question relations
export const questionsRelations = relations(questions, ({ one }) => ({
  game: one(games, {
    fields: [questions.gameId],
    references: [games.id],
  }),
}));

// Indexes
export const gameUserIdIndex = sql`CREATE INDEX IF NOT EXISTS game_user_id_idx ON game (user_id)`;
export const questionGameIdIndex = sql`CREATE INDEX IF NOT EXISTS question_game_id_idx ON question (game_id)`;
