import { eq, desc, and, or, sql, count, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  picks,
  chatMessages,
  rounds,
  wallyMemories,
  familyDrops,
  morningBriefingCache,
  analyticsEvents,
  InsertPick,
  InsertChatMessage,
  InsertRound,
  InsertWallyMemory,
  InsertFamilyDrop,
  InsertAnalyticsEvent,
} from "../drizzle/schema";
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

// ── Picks ─────────────────────────────────────────────────────────────────────

export async function createPick(pick: InsertPick) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(picks).values(pick);
}

/** Find existing pick by guestId OR userId (whichever is set) */
export async function getPickByUserAndTournament(
  userId: number,
  guestId: string,
  tournamentId: string
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(picks)
    .where(
      and(
        or(
          guestId ? eq(picks.guestId, guestId) : undefined,
          userId > 0 ? eq(picks.userId, userId) : undefined
        ),
        eq(picks.tournamentId, tournamentId)
      )
    )
    .limit(1);
  return result[0] ?? undefined;
}

export async function getUserPicks(userId: number, guestId: string) {
  const db = await getDb();
  if (!db) return [];
  const condition = guestId
    ? or(eq(picks.guestId, guestId), userId > 0 ? eq(picks.userId, userId) : undefined)
    : eq(picks.userId, userId);
  return db.select().from(picks).where(condition).orderBy(desc(picks.createdAt));
}

export async function getAllPicks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(picks).orderBy(desc(picks.createdAt));
}

/** Update Jamie's pick before tee-off (only if not locked) */
export async function updatePick(
  id: number,
  userId: number,
  guestId: string,
  updates: { playerName?: string; playerId?: string; jamieReasoning?: string; isLocked?: boolean }
) {
  const db = await getDb();
  if (!db) return;
  const condition = guestId
    ? and(eq(picks.id, id), or(eq(picks.guestId, guestId), userId > 0 ? eq(picks.userId, userId) : undefined))
    : and(eq(picks.id, id), eq(picks.userId, userId));
  await db.update(picks).set(updates).where(condition);
}

// ── Chat Messages ─────────────────────────────────────────────────────────────

export async function saveChatMessage(msg: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values(msg);
}

export async function getChatHistory(userId: number, guestId: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const condition = guestId
    ? or(eq(chatMessages.guestId, guestId), userId > 0 ? eq(chatMessages.userId, userId) : undefined)
    : eq(chatMessages.userId, userId);
  const rows = await db
    .select()
    .from(chatMessages)
    .where(condition)
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  return rows.reverse();
}

// ── Rounds ────────────────────────────────────────────────────────────────────

export async function createRound(round: InsertRound) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rounds).values(round);
  return (result as any)[0]?.insertId ?? null;
}

export async function getUserRounds(userId: number, guestId: string) {
  const db = await getDb();
  if (!db) return [];
  const condition = guestId
    ? or(eq(rounds.guestId, guestId), userId > 0 ? eq(rounds.userId, userId) : undefined)
    : eq(rounds.userId, userId);
  return db.select().from(rounds).where(condition).orderBy(desc(rounds.createdAt));
}

// ── Wally Memories ────────────────────────────────────────────────────────────

export async function createMemory(memory: InsertWallyMemory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(wallyMemories).values(memory);
  return (result as any)[0]?.insertId ?? null;
}

export async function getUserMemories(userId: number, guestId: string) {
  const db = await getDb();
  if (!db) return [];
  const condition = guestId
    ? or(eq(wallyMemories.guestId, guestId), userId > 0 ? eq(wallyMemories.userId, userId) : undefined)
    : eq(wallyMemories.userId, userId);
  return db.select().from(wallyMemories).where(condition).orderBy(desc(wallyMemories.createdAt));
}

export async function deleteMemory(id: number, userId: number, guestId: string) {
  const db = await getDb();
  if (!db) return;
  const condition = guestId
    ? and(eq(wallyMemories.id, id), or(eq(wallyMemories.guestId, guestId), userId > 0 ? eq(wallyMemories.userId, userId) : undefined))
    : and(eq(wallyMemories.id, id), eq(wallyMemories.userId, userId));
  await db.delete(wallyMemories).where(condition);
}

// ── Family Drops ─────────────────────────────────────────────────────────────

export async function createFamilyDrop(drop: InsertFamilyDrop) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(familyDrops).values(drop);
}

export async function getUnreadFamilyDrops() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(familyDrops).where(eq(familyDrops.isRead, false)).orderBy(desc(familyDrops.createdAt));
}

export async function getAllFamilyDrops() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(familyDrops).orderBy(desc(familyDrops.createdAt));
}

export async function markFamilyDropRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(familyDrops).set({ isRead: true }).where(eq(familyDrops.id, id));
}

// ── Morning Briefing Cache ────────────────────────────────────────────────────

/** Returns cached briefing for today's date key, or null if not cached yet */
export async function getCachedBriefing(dateKey: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(morningBriefingCache).where(eq(morningBriefingCache.dateKey, dateKey)).limit(1);
  return rows[0]?.content ?? null;
}

/** Store today's briefing in cache */
export async function cacheBriefing(dateKey: string, content: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(morningBriefingCache).values({ dateKey, content });
  } catch {
    // Unique constraint violation means it was already cached — ignore
  }
}

// ── Analytics Events ──────────────────────────────────────────────────────────

/** Fire-and-forget event logging — never throws */
export async function logAnalyticsEvent(event: InsertAnalyticsEvent): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(analyticsEvents).values(event);
  } catch { /* non-critical — never block the user */ }
}

/** Get all analytics events for the dashboard */
export async function getAnalyticsEvents(since?: Date) {
  const db = await getDb();
  if (!db) return [];
  if (since) {
    return db.select().from(analyticsEvents).where(gte(analyticsEvents.createdAt, since)).orderBy(desc(analyticsEvents.createdAt));
  }
  return db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt));
}

/** Get event counts grouped by event name */
export async function getEventCounts(since?: Date) {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({ event: analyticsEvents.event, total: count() })
    .from(analyticsEvents)
    .groupBy(analyticsEvents.event)
    .orderBy(desc(count()));
  return query;
}

/** Get top phrase labels for Voice Aid */
export async function getTopPhrases(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ label: analyticsEvents.label, total: count() })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.event, "voice_aid_phrase_tap"))
    .groupBy(analyticsEvents.label)
    .orderBy(desc(count()))
    .limit(limit);
}

/** Get hourly activity distribution */
export async function getHourlyActivity() {
  const db = await getDb();
  if (!db) return [];
  return db.execute(sql`
    SELECT HOUR(createdAt) as hour, COUNT(*) as total
    FROM analytics_events
    GROUP BY HOUR(createdAt)
    ORDER BY hour
  `);
}
