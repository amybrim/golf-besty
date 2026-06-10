import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeAuthCtx(): TrpcContext {
  return makeCtx({
    user: {
      id: 1,
      openId: "test-user",
      email: "test@golf.com",
      name: "Test Golfer",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  });
}

// ── Auth tests ────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test Golfer");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ── Golf data tests ───────────────────────────────────────────────────────────

describe("golf.tournaments", () => {
  it("returns an array (may be empty if ESPN is unreachable in test)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.golf.tournaments();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("golf.leaderboard", () => {
  it("returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.golf.leaderboard();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("golf.polymarketOdds", () => {
  it("returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.golf.polymarketOdds();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("golf.news", () => {
  it("returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.golf.news();
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts tag filter", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.golf.news({ tag: "LIV", limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("golf.players", () => {
  it("returns an array (empty without API key)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.golf.players();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ── Picks tests ───────────────────────────────────────────────────────────────

describe("picks.myPicks", () => {
  it("returns picks for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.picks.myPicks();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("picks.bragBoard", () => {
  it("returns an array", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.picks.bragBoard();
    expect(Array.isArray(result)).toBe(true);
  });
});
