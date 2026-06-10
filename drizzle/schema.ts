import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Wally vs Jamie showdown picks — one per user per tournament.
 * No money involved. Purely bragging rights.
 */
export const picks = mysqlTable("picks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tournamentId: varchar("tournamentId", { length: 128 }).notNull(),
  tournamentName: varchar("tournamentName", { length: 256 }).notNull(),
  playerName: varchar("playerName", { length: 128 }).notNull(),
  playerId: varchar("playerId", { length: 64 }),
  aiPickPlayerName: varchar("aiPickPlayerName", { length: 128 }),
  jamieReasoning: text("jamieReasoning"),
  aiReasoning: text("aiReasoning"),
  isCorrect: boolean("isCorrect").default(false),
  aiIsCorrect: boolean("aiIsCorrect").default(false),
  isResolved: boolean("isResolved").default(false),
  actualWinner: varchar("actualWinner", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pick = typeof picks.$inferSelect;
export type InsertPick = typeof picks.$inferInsert;

/**
 * Chat messages for Wally — Jamie's golf best friend.
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Jamie's personal golf rounds — logged by him, reacted to by Wally.
 */
export const rounds = mysqlTable("rounds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseName: varchar("courseName", { length: 256 }).notNull(),
  score: int("score").notNull(),
  par: int("par").notNull().default(72),
  tees: varchar("tees", { length: 64 }),
  notes: text("notes"),
  wallyReaction: text("wallyReaction"),
  playedAt: varchar("playedAt", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Round = typeof rounds.$inferSelect;
export type InsertRound = typeof rounds.$inferInsert;

/**
 * Wally Memory — things Jamie tells Wally to remember:
 * favorite courses, golf moments, personal notes, bucket list holes.
 */
export const wallyMemories = mysqlTable("wally_memories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", ["course", "moment", "player", "note", "bucket_list"]).notNull().default("note"),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WallyMemory = typeof wallyMemories.$inferSelect;
export type InsertWallyMemory = typeof wallyMemories.$inferInsert;

/**
 * Family Drops — messages Amy and family leave for Jamie inside Wally.
 * Jamie sees them when he opens the app. Love letters disguised as a golf app.
 */
export const familyDrops = mysqlTable("family_drops", {
  id: int("id").autoincrement().primaryKey(),
  fromName: varchar("fromName", { length: 128 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FamilyDrop = typeof familyDrops.$inferSelect;
export type InsertFamilyDrop = typeof familyDrops.$inferInsert;
