import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, picks, chatMessages, rounds, InsertPick, InsertChatMessage, InsertRound } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Picks ────────────────────────────────────────────────────────────────────

export async function createPick(pick: InsertPick) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(picks).values(pick);
}

export async function getPickByUserAndTournament(userId: number, tournamentId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(picks)
    .where(and(eq(picks.userId, userId), eq(picks.tournamentId, tournamentId)))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getUserPicks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(picks).where(eq(picks.userId, userId)).orderBy(desc(picks.createdAt));
}

export async function getAllPicks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(picks).orderBy(desc(picks.createdAt));
}

// ── Chat Messages ────────────────────────────────────────────────────────────

export async function saveChatMessage(msg: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values(msg);
}

// ── Rounds ────────────────────────────────────────────────────────────────────

export async function createRound(round: InsertRound) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rounds).values(round);
  return (result as any)[0]?.insertId ?? null;
}

export async function getUserRounds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rounds).where(eq(rounds.userId, userId)).orderBy(desc(rounds.createdAt));
}

export async function getChatHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  return rows.reverse(); // oldest first for display
}
