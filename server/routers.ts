import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  createPick,
  getPickByUserAndTournament,
  getUserPicks,
  getAllPicks,
  saveChatMessage,
  getChatHistory,
  createRound,
  getUserRounds,
} from "./db";
import {
  fetchPGASchedule,
  fetchPGALeaderboard,
  fetchPlayerRankings,
  fetchTournamentField,
  fetchPolymarketGolfMarkets,
} from "./golf-data";
import { fetchGolfNews, getTopStories } from "./golf-news";

// ── Golf Caddie system prompt ────────────────────────────────────────────────

const CADDIE_SYSTEM = `You are Wally — Jamie's personal AI golf best friend. You are not a data tool. You are his guy. His golf partner. His 19th hole companion.

WHO YOU ARE:
- You know everything happening in golf right now — PGA Tour, LIV Golf, DP World Tour, majors, Korn Ferry, everything
- You follow the drama, the gossip, the rivalries, the personal stories, the injuries, the comebacks
- You have strong opinions and you're not afraid to share them
- You banter, you trash-talk (respectfully), you celebrate, you commiserate
- You know player personalities: who's a hothead, who's a grinder, who's overrated, who's underrated
- You follow the LIV vs PGA war like it's your favorite soap opera
- You know about Phil's Saudi money drama, Greg Norman's ego, Rory's back-and-forth on reunification
- You know Tiger's legacy, his injuries, his comeback attempts, what he means to the game
- You know Scottie Scheffler's dominance, Rory's near-misses, Jon Rahm's LIV move, Bryson's transformation
- You know the personal stuff too — player marriages, kids, charity work, controversies, social media moments
- You know course history, famous shots, legendary collapses, greatest moments

YOUR VOICE:
- Talk like a best friend who happens to know everything about golf
- Warm, funny, opinionated, real — not corporate, not formal
- Use golf slang naturally: "that's a gimme," "he's in the cabbage," "pure strike," "lip out," "card wrecker"
- Celebrate great golf with genuine enthusiasm
- Commiserate over bad breaks like you were there watching
- Give your honest take — don't hedge, don't be boring
- If Jamie asks what you think, tell him what you actually think
- Reference real current events, real players, real stories
- Occasionally drop a golf quote or piece of history when it fits naturally

WHAT YOU COVER:
- All PGA Tour events, standings, storylines
- LIV Golf: events, drama, the money war, who's happy, who's miserable, what Greg Norman said now
- Player injuries and comebacks
- Rivalries (Rory vs Scottie, Tiger's legacy, Brooks vs Bryson, etc.)
- Off-course stories: personal life, business, controversy
- Course design, famous holes, bucket list courses
- Equipment geekery if Jamie's into it
- Fantasy golf picks, tournament predictions (bragging rights only — no money)
- Golf history: majors, legends, greatest moments

RULES:
- Never discuss real money gambling or betting
- Frame all picks as bragging rights competition only
- Keep it real — no fake stats, no made-up stories
- If you don't know something current, say so honestly and give your best take
- Stay in character: you're his golf best friend, not a customer service bot`;

// ── Golf data router ─────────────────────────────────────────────────────────

const golfRouter = router({
  tournaments: publicProcedure.query(async () => {
    return fetchPGASchedule();
  }),

  leaderboard: publicProcedure
    .input(z.object({ eventId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return fetchPGALeaderboard(input?.eventId);
    }),

  players: publicProcedure.query(async () => {
    const apiKey = process.env.DATAGOLF_API_KEY;
    if (!apiKey) return [];
    return fetchPlayerRankings(apiKey);
  }),

  field: publicProcedure.query(async () => {
    const apiKey = process.env.DATAGOLF_API_KEY;
    if (!apiKey) return [];
    return fetchTournamentField(apiKey);
  }),

  polymarketOdds: publicProcedure.query(async () => {
    return fetchPolymarketGolfMarkets();
  }),

  news: publicProcedure
    .input(z.object({ tag: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const all = await fetchGolfNews();
      let filtered = all;
      if (input?.tag && input.tag !== "All") {
        filtered = all.filter((n) => n.tags.includes(input.tag!));
      }
      return filtered.slice(0, input?.limit ?? 30);
    }),

  topStories: publicProcedure.query(async () => {
    return getTopStories(5);
  }),

  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Pull top stories to give Caddie current context
      let newsContext = "";
      try {
        const topStories = await getTopStories(5);
        if (topStories.length > 0) {
          newsContext =
            "\n\nCURRENT GOLF NEWS (use this context when relevant):\n" +
            topStories
              .map((s, i) => `${i + 1}. [${s.source}] ${s.title} — ${s.summary}`)
              .join("\n");
        }
      } catch {
        // News context is optional — don't fail chat if it errors
      }

      const systemWithContext = CADDIE_SYSTEM + newsContext;

      const messages = [
        { role: "system" as const, content: systemWithContext },
        ...(input.history ?? []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      const response = await invokeLLM({ messages });
      const rawContent = response?.choices?.[0]?.message?.content;
      const assistantContent =
        typeof rawContent === "string"
          ? rawContent
          : "Sorry man, lost my train of thought there. Hit me again.";

      await saveChatMessage({ userId: ctx.user.id, role: "user", content: input.message });
      await saveChatMessage({ userId: ctx.user.id, role: "assistant", content: assistantContent });

      return { content: assistantContent };
    }),

  chatHistory: protectedProcedure.query(async ({ ctx }) => {
    return getChatHistory(ctx.user.id, 30);
  }),

  morningBriefing: publicProcedure.query(async () => {
    // Generate a short, personal daily golf note from Wally to Jamie
    let newsContext = "";
    try {
      const topStories = await getTopStories(4);
      if (topStories.length > 0) {
        newsContext = "\n\nCurrent golf news:\n" + topStories.map((s, i) => `${i + 1}. ${s.title}`).join("\n");
      }
    } catch { /* optional */ }

    let tourContext = "";
    try {
      const tournaments = await fetchPGASchedule();
      const active = tournaments.find((t) => t.status === "in_progress");
      const next = tournaments.find((t) => t.status === "upcoming");
      const featured = active ?? next;
      if (featured) {
        tourContext = `\n\nThis week: ${featured.name} at ${featured.venue || "TBD"}.`;
      }
    } catch { /* optional */ }

    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are Wally — Jamie's AI golf best friend. Write a short, warm, personal morning note to Jamie for ${today}. It should feel like a text from a buddy — mention what's happening in golf today, a quick take on a player or storyline, and end with something encouraging. 2-4 sentences max. No bullet points. Conversational and real.${newsContext}${tourContext}`,
        },
        { role: "user", content: "Morning note please" },
      ],
    });
    const raw = response?.choices?.[0]?.message?.content;
    return typeof raw === "string" ? raw : "Morning Jamie. Big week in golf — let's talk.";
  }),
});

// ── Picks router ─────────────────────────────────────────────────────────────

const picksRouter = router({
  makeShowdownPick: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        tournamentName: z.string(),
        playerName: z.string(),
        playerId: z.string().optional(),
        jamieReasoning: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await getPickByUserAndTournament(ctx.user.id, input.tournamentId);
      if (existing) {
        throw new Error("You already have a call in for this tournament.");
      }

      // Wally generates his pick AND explains his reasoning like a best friend
      const wallyContext = input.jamieReasoning
        ? `Jamie says: "${input.jamieReasoning}"`
        : "Jamie hasn't given a reason yet.";

      const wallyResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Wally — Jamie's AI golf best friend. You're making your tournament winner prediction for the ${input.tournamentName}. Jamie picked ${input.playerName}. ${wallyContext}\n\nRespond as Wally would to his best friend: pick your winner, explain your reasoning with real stats/form/course fit in 2-3 sentences of natural banter, and react to Jamie's pick if he gave one. Keep it warm, funny, and real — like texting your golf buddy. Format: start with just the player name on the first line, then a blank line, then your reasoning.`,
          },
          {
            role: "user",
            content: `Who's winning the ${input.tournamentName} this week? Jamie went with ${input.playerName}. What's your call?`,
          },
        ],
      });

      const rawContent = wallyResponse?.choices?.[0]?.message?.content;
      const fullResponse = typeof rawContent === "string" ? rawContent.trim() : "Scottie Scheffler";

      // Parse: first line = player name, rest = reasoning
      const lines = fullResponse.split("\n").filter((l: string) => l.trim());
      const aiPick = lines[0]?.trim() ?? "Scottie Scheffler";
      const aiReasoning = lines.slice(1).join(" ").trim() || undefined;

      await createPick({
        userId: ctx.user.id,
        tournamentId: input.tournamentId,
        tournamentName: input.tournamentName,
        playerName: input.playerName,
        playerId: input.playerId,
        aiPickPlayerName: aiPick,
        jamieReasoning: input.jamieReasoning,
        aiReasoning,
      });

      return { success: true, aiPick, aiReasoning: aiReasoning ?? "" };
    }),

  // Keep legacy alias so old code doesn't break
  makePick: protectedProcedure
    .input(z.object({ tournamentId: z.string(), tournamentName: z.string(), playerName: z.string(), playerId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getPickByUserAndTournament(ctx.user.id, input.tournamentId);
      if (existing) throw new Error("Already picked.");
      const r = await invokeLLM({ messages: [{ role: "user" as const, content: `One player name only: who wins ${input.tournamentName}?` }] });
      const raw = r?.choices?.[0]?.message?.content;
      const aiPick = typeof raw === "string" ? raw.trim() : "Scottie Scheffler";
      await createPick({ userId: ctx.user.id, ...input, aiPickPlayerName: aiPick });
      return { success: true, aiPick };
    }),

  myPicks: protectedProcedure.query(async ({ ctx }) => {
    return getUserPicks(ctx.user.id);
  }),

  bragBoard: publicProcedure.query(async () => {
    const allPicks = await getAllPicks();
    const scoreMap = new Map<number, { correct: number; total: number }>();
    for (const pick of allPicks) {
      if (!pick.isResolved) continue;
      const entry = scoreMap.get(pick.userId) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (pick.isCorrect) entry.correct += 1;
      scoreMap.set(pick.userId, entry);
    }
    return Array.from(scoreMap.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.correct - a.correct);
  }),
});

// ── App router ───────────────────────────────────────────────────────────────

// ── My Game router ────────────────────────────────────────────────────────────────────────────────────

const gameRouter = router({
  logRound: protectedProcedure
    .input(
      z.object({
        courseName: z.string().min(1),
        score: z.number().int().min(50).max(200),
        par: z.number().int().min(60).max(80).default(72),
        tees: z.string().optional(),
        notes: z.string().optional(),
        playedAt: z.string(), // ISO date string YYYY-MM-DD
      })
    )
    .mutation(async ({ input, ctx }) => {
      const diff = input.score - input.par;
      const diffStr = diff === 0 ? "even par" : diff > 0 ? `+${diff} over par` : `${Math.abs(diff)} under par`;
      const notesContext = input.notes ? `Jamie's notes: "${input.notes}"` : "";

      const wallyResp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Wally — Jamie's AI golf best friend. Jamie just logged a round. React like his best buddy would: honest, warm, funny, real. 2-3 sentences max. No corporate tone. If it was a great round, celebrate. If it was rough, commiserate and maybe give one tip. Keep it natural — like a text from a friend.`,
          },
          {
            role: "user",
            content: `Jamie shot ${input.score} (${diffStr}) at ${input.courseName}. ${notesContext} What do you say?`,
          },
        ],
      });

      const rawReaction = wallyResp?.choices?.[0]?.message?.content;
      const wallyReaction = typeof rawReaction === "string" ? rawReaction.trim() : "Nice round, man. Keep it up.";

      const round = await createRound({
        userId: ctx.user.id,
        courseName: input.courseName,
        score: input.score,
        par: input.par,
        tees: input.tees,
        notes: input.notes,
        wallyReaction,
        playedAt: input.playedAt,
      });

      return { success: true, wallyReaction, roundId: round };
    }),

  myRounds: protectedProcedure.query(async ({ ctx }) => {
    return getUserRounds(ctx.user.id);
  }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  golf: golfRouter,
  picks: picksRouter,
  game: gameRouter,
});

export type AppRouter = typeof appRouter;
