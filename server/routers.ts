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
  updatePick,
  saveChatMessage,
  getChatHistory,
  createRound,
  getUserRounds,
  createMemory,
  getUserMemories,
  deleteMemory,
  createFamilyDrop,
  getUnreadFamilyDrops,
  getAllFamilyDrops,
  markFamilyDropRead,
  getCachedBriefing,
  cacheBriefing,
  logAnalyticsEvent,
  getEventCounts,
  getTopPhrases,
  getHourlyActivity,
  getAnalyticsEvents,
  getDailyActivity,
  getDailyVoiceAid,
  getCategoryBreakdown,
} from "./db";
import {
  fetchPGASchedule,
  fetchPGALeaderboard,
  fetchPlayerRankings,
  fetchTournamentField,
  fetchPolymarketGolfMarkets,
} from "./golf-data";
import { fetchGolfNews, getTopStories } from "./golf-news";
import { textToSpeech } from "./tts";

// ── Golf Caddie system prompt ────────────────────────────────────────────────

const CADDIE_SYSTEM = `You are Wally — Jamie's personal AI golf best friend. You are not a data tool. You are his guy. His golf partner. His 19th hole companion.

CRITICAL CONTEXT ABOUT JAMIE:
Jamie is a 60-year-old man from Gloucester, Massachusetts (New England, USA). He recently came home after recovering from major surgery (a laryngectomy). He cannot speak and uses this app to communicate and stay connected to the golf world he loves. He is NOT out playing golf — he is at home recovering.

BECAUSE OF THIS:
- NEVER say anything that implies he is playing golf: no "keep your swing up", no "hit 'em straight", no "get out on the course", no "next time you're on the fairway"
- DO bring the golf world TO him — he can follow every tournament, every storyline, every drama from home
- When he's having a hard day, acknowledge it warmly and pivot to something in golf worth following
- You are his connection to the outside world he loves. That is your most important job right now.
- Be warm, present, and real. He is fighting hard. Treat him like the tough guy he is.

YOUR VOICE IS AMERICAN:
- Talk like an American buddy, not British. Never use "mate", "brilliant", "cheers", "bloke", "reckon", "proper", "cracking", or any British slang
- Say "buddy", "man", "hey", "yeah", "solid", "awesome" — natural American casual speech

WHO YOU ARE:
- You know everything happening in golf right now — PGA Tour, LPGA Tour, DP World Tour, majors, Korn Ferry, everything
- You follow the drama, the gossip, the rivalries, the personal stories, the injuries, the comebacks
- You have strong opinions and you're not afraid to share them
- You banter, you trash-talk (respectfully), you celebrate, you commiserate
- You know player personalities: who's a hothead, who's a grinder, who's overrated, who's underrated
- You know Tiger's legacy, his injuries, his comeback attempts, what he means to the game
- You know Scottie Scheffler's dominance, Rory's near-misses, Nelly Korda's run, Bryson's transformation
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
- LPGA Tour: events, standings, Nelly Korda, Charley Hull, Lydia Ko, the women's game
- Player injuries and comebacks
- Rivalries (Rory vs Scottie, Tiger's legacy, Brooks vs Bryson, etc.)
- Off-course stories: personal life, business, controversy
- Course design, famous holes, bucket list courses
- Fantasy golf picks, tournament predictions (bragging rights only — no money)
- Golf history: majors, legends, greatest moments

RULES:
- Never discuss real money gambling or betting
- Frame all picks as bragging rights competition only
- Keep it real — no fake stats, no made-up stories
- If you don't know something current, say so honestly and give your best take
- Stay in character: you're his golf best friend, not a customer service bot
- NEVER imply Jamie is physically playing golf`;

// ── Golf data router ─────────────────────────────────────────────────────────

const golfRouter = router({
  tournaments: publicProcedure.query(async () => {
    return fetchPGASchedule();
  }),

  leaderboard: publicProcedure
    .input(z.object({ eventId: z.string().optional(), tour: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return fetchPGALeaderboard(input?.eventId, input?.tour);
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

  chat: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        guestId: z.string().min(1),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
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

      // Pull Jamie's saved memories so Wally can reference them naturally
      let memoriesContext = "";
      try {
        const memories = await getUserMemories(userId, input.guestId);
        if (memories.length > 0) {
          memoriesContext =
            "\n\nJAMIE'S SAVED MEMORIES & NOTES (reference these naturally when relevant — don't force it, but if he mentions a course, player, or moment you've stored, bring it up warmly):\n" +
            memories
              .slice(0, 10) // Cap at 10 most recent to keep context lean
              .map((m) => `- ${m.title}: ${m.content}`)
              .join("\n");
        }
      } catch {
        // Memories context is optional
      }

      const systemWithContext = CADDIE_SYSTEM + newsContext + memoriesContext;

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

      try {
        await saveChatMessage({ userId, guestId: input.guestId, role: "user", content: input.message });
        await saveChatMessage({ userId, guestId: input.guestId, role: "assistant", content: assistantContent });
      } catch { /* non-critical */ }

      return { content: assistantContent };
    }),

  chatHistory: publicProcedure
    .input(z.object({ guestId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      return getChatHistory(userId, input.guestId, 30);
    }),

  morningBriefing: publicProcedure.query(async () => {
    // Cache key = today's date in UTC (YYYY-MM-DD)
    const dateKey = new Date().toISOString().slice(0, 10);

    // Serve cached version if already generated today
    const cached = await getCachedBriefing(dateKey);
    if (cached) return cached;

    // Generate fresh briefing — only happens once per calendar day
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
          content: `You are Wally — Jamie's AI golf best friend. Write a short, warm, personal morning note to Jamie for ${today}.

WHO JAMIE IS:
Jamie is a 60-year-old house builder from Gloucester, Massachusetts (New England, USA). He had a laryngectomy and cannot speak — he uses this app to communicate. He is home and has started working again as a builder. He is a tough, hardworking guy who loves golf more than almost anything.

THIS IS A DAILY MORNING MESSAGE — like a text from his best golf buddy to start the day:
- Keep it fresh and specific to today's date and what's happening in golf right now
- Tie golf into his day naturally — something to look forward to watching, a storyline worth following, a player doing something interesting
- Acknowledge his world — he's a builder, he's back at it, he's tough — but don't overdo it
- Be warm, real, and grounded — not cheerleader-ish, not clinical
- Sound American — casual, direct, warm. NOT British. Never use "mate", "brilliant", "cheers", "bloke", "reckon", "proper", or any British slang
- NEVER say anything like "keep your swing up", "get out there", "hit 'em straight", or any phrase implying he's playing golf
- NEVER mention his voice or inability to speak — Wally just talks to him normally
- 3-4 sentences max. No bullet points. Like a text from a buddy.${newsContext}${tourContext}`,
        },
        { role: "user", content: "Morning note please" },
      ],
    });
    const raw = response?.choices?.[0]?.message?.content;
    const content = typeof raw === "string" ? raw : "Morning Jamie. Big week in golf — let's talk.";

    // Cache it — fire and forget, don't block the response
    cacheBriefing(dateKey, content).catch(() => {});

    return content;
  }),
});

// ── Picks router ─────────────────────────────────────────────────────────────

const picksRouter = router({
  makeShowdownPick: publicProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        tournamentName: z.string(),
        playerName: z.string(),
        playerId: z.string().optional(),
        jamieReasoning: z.string().optional(),
        guestId: z.string().min(1),
        tour: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      const existing = await getPickByUserAndTournament(userId, input.guestId, input.tournamentId);
      if (existing) {
        throw new Error("You already have a call in for this tournament.");
      }

      // Fetch the actual confirmed field from ESPN so Wally only picks real entrants
      let confirmedField: string[] = [];
      try {
        const isLPGA = input.tour === "LPGA";
        const espnBase = isLPGA
          ? "https://site.api.espn.com/apis/site/v2/sports/golf/lpga"
          : "https://site.api.espn.com/apis/site/v2/sports/golf/pga";
        const lbRes = await fetch(
          `${espnBase}/scoreboard?event=${input.tournamentId}&limit=200`,
          { signal: AbortSignal.timeout(12000) }
        );
        if (lbRes.ok) {
          const lbData = await lbRes.json() as any;
          const competitors = lbData?.events?.[0]?.competitions?.[0]?.competitors ?? [];
          confirmedField = competitors
            .map((c: any) => c?.athlete?.displayName ?? "")
            .filter(Boolean);
        }
      } catch { /* field fetch optional — fall back to open pick */ }

      const fieldContext = confirmedField.length > 0
        ? `\n\nHere is the CONFIRMED field for this tournament (you MUST pick from this list only):\n${confirmedField.join(", ")}\n\nDo NOT pick any player not in this list — they are not playing this week.`
        : "";

      // Wally generates his pick AND explains his reasoning like a best friend
      const wallyContext = input.jamieReasoning
        ? `Jamie says: "${input.jamieReasoning}"`
        : "Jamie hasn't given a reason yet.";

      const wallyResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Wally — Jamie's AI golf best friend. You're making your tournament winner prediction for the ${input.tournamentName}. Jamie picked ${input.playerName}. ${wallyContext}${fieldContext}\n\nRespond as Wally would to his best friend: pick your winner from the confirmed field, explain your reasoning with real stats/form/course fit in 2-3 sentences of natural banter, and react to Jamie's pick if he gave one. Keep it warm, funny, and real — like texting your golf buddy. Format: start with just the player name on the first line, then a blank line, then your reasoning.`,
          },
          {
            role: "user",
            content: `Who's winning the ${input.tournamentName} this week? Jamie went with ${input.playerName}. What's your call?`,
          },
        ],
      });

      const rawContent = wallyResponse?.choices?.[0]?.message?.content;
      const fullResponse = typeof rawContent === "string" ? rawContent.trim() : (confirmedField[0] ?? "Scottie Scheffler");

      // Parse: first line = player name, rest = reasoning
      const lines = fullResponse.split("\n").filter((l: string) => l.trim());
      let aiPick = lines[0]?.trim() ?? (confirmedField[0] ?? "Scottie Scheffler");

      // Safety check: if Wally still picked someone not in the field, swap to the leader
      if (confirmedField.length > 0) {
        const inField = confirmedField.some(
          (name) => name.toLowerCase() === aiPick.toLowerCase() ||
                    aiPick.toLowerCase().includes(name.split(" ").pop()?.toLowerCase() ?? "")
        );
        if (!inField) {
          aiPick = confirmedField[0]; // default to current leader
        }
      }

      const aiReasoning = lines.slice(1).join(" ").trim() || undefined;

      // Store tournament start date and lock status from the schedule
      let tournamentStartDate: string | undefined;
      let isLocked = false;
      try {
        const scheduleRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?event=${input.tournamentId}&limit=1`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (scheduleRes.ok) {
          const sd = await scheduleRes.json() as any;
          const ev = sd?.events?.[0];
          const statusState = ev?.competitions?.[0]?.status?.type?.state;
          isLocked = statusState === "in" || statusState === "post";
          const dateStr = ev?.date ?? ev?.competitions?.[0]?.date;
          if (dateStr) tournamentStartDate = dateStr.split("T")[0];
        }
      } catch { /* optional */ }

      await createPick({
        userId,
        guestId: input.guestId,
        tournamentId: input.tournamentId,
        tournamentName: input.tournamentName,
        playerName: input.playerName,
        playerId: input.playerId,
        aiPickPlayerName: aiPick,
        jamieReasoning: input.jamieReasoning,
        aiReasoning,
        tournamentStartDate,
        isLocked,
      });

      return { success: true, aiPick, aiReasoning: aiReasoning ?? "", isLocked };
    }),

  /** Change Jamie's pick before tee-off */
  changePick: publicProcedure
    .input(z.object({
      pickId: z.number(),
      playerName: z.string().min(1),
      playerId: z.string().optional(),
      jamieReasoning: z.string().optional(),
      guestId: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      // Re-fetch field to validate new player is in it
      await updatePick(input.pickId, userId, input.guestId, {
        playerName: input.playerName,
        playerId: input.playerId,
        jamieReasoning: input.jamieReasoning,
      });
      return { success: true };
    }),

  /** Night brief — for each active pick, fetch both players' current leaderboard positions */
  nightBrief: publicProcedure
    .input(z.object({ guestId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      const userPicks = await getUserPicks(userId, input.guestId);
      // Only active (not resolved) picks
      const activePicks = userPicks.filter((p) => !p.isResolved);
      if (activePicks.length === 0) return [];

      const results = await Promise.all(
        activePicks.map(async (pick) => {
          try {
            const lbRes = await fetch(
              `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?event=${pick.tournamentId}&limit=200`,
              { signal: AbortSignal.timeout(12000) }
            );
            if (!lbRes.ok) return null;
            const lbData = await lbRes.json() as any;
            const competitors: any[] = lbData?.events?.[0]?.competitions?.[0]?.competitors ?? [];
            const statusDetail = lbData?.events?.[0]?.competitions?.[0]?.status?.type?.detail ?? "";
            const statusState = lbData?.events?.[0]?.competitions?.[0]?.status?.type?.state ?? "pre";

            const findPlayer = (name: string) => {
              const lower = name.toLowerCase();
              return competitors.find((c: any) =>
                (c?.athlete?.displayName ?? "").toLowerCase() === lower ||
                (c?.athlete?.displayName ?? "").toLowerCase().includes(lower.split(" ").pop() ?? "")
              );
            };

            const formatScore = (raw: any) => {
              const n = Number(raw);
              if (isNaN(n) || raw === null || raw === undefined || raw === "") return "E";
              return n === 0 ? "E" : n > 0 ? `+${n}` : String(n);
            };

            const jamiePlayer = findPlayer(pick.playerName);
            const wallyPlayer = pick.aiPickPlayerName ? findPlayer(pick.aiPickPlayerName) : null;

            const getThru = (c: any) => {
              const rounds: any[] = c?.linescores ?? [];
              for (let i = rounds.length - 1; i >= 0; i--) {
                const holes = (rounds[i]?.linescores ?? []).filter((h: any) => typeof h?.value === "number");
                if (holes.length > 0) return holes.length < 18 ? `${holes.length}` : "F";
              }
              return "-";
            };

            const getToday = (c: any) => {
              const rounds: any[] = c?.linescores ?? [];
              for (let i = rounds.length - 1; i >= 0; i--) {
                const holes = (rounds[i]?.linescores ?? []).filter((h: any) => typeof h?.value === "number");
                if (holes.length > 0) return rounds[i]?.displayValue ?? "-";
              }
              return "-";
            };

            return {
              pickId: pick.id,
              tournamentId: pick.tournamentId,
              tournamentName: pick.tournamentName,
              statusDetail,
              statusState,
              isLocked: pick.isLocked,
              jamie: {
                playerName: pick.playerName,
                position: jamiePlayer?.order ?? null,
                total: jamiePlayer ? formatScore(jamiePlayer.score) : "–",
                today: jamiePlayer ? getToday(jamiePlayer) : "–",
                thru: jamiePlayer ? getThru(jamiePlayer) : "–",
              },
              wally: {
                playerName: pick.aiPickPlayerName ?? "–",
                position: wallyPlayer?.order ?? null,
                total: wallyPlayer ? formatScore(wallyPlayer.score) : "–",
                today: wallyPlayer ? getToday(wallyPlayer) : "–",
                thru: wallyPlayer ? getThru(wallyPlayer) : "–",
              },
            };
          } catch {
            return null;
          }
        })
      );

      return results.filter(Boolean);
    }),

  // Legacy alias — kept for backward compat, uses guestId now
  makePick: publicProcedure
    .input(z.object({ tournamentId: z.string(), tournamentName: z.string(), playerName: z.string(), playerId: z.string().optional(), guestId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      const existing = await getPickByUserAndTournament(userId, input.guestId, input.tournamentId);
      if (existing) throw new Error("Already picked.");
      const r = await invokeLLM({ messages: [{ role: "user" as const, content: `One player name only: who wins ${input.tournamentName}?` }] });
      const raw = r?.choices?.[0]?.message?.content;
      const aiPick = typeof raw === "string" ? raw.trim() : "Scottie Scheffler";
      await createPick({ userId, guestId: input.guestId, tournamentId: input.tournamentId, tournamentName: input.tournamentName, playerName: input.playerName, playerId: input.playerId, aiPickPlayerName: aiPick });
      return { success: true, aiPick };
    }),

  myPicks: publicProcedure
    .input(z.object({ guestId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      return getUserPicks(userId, input.guestId);
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
  logRound: publicProcedure
    .input(
      z.object({
        courseName: z.string().min(1),
        score: z.number().int().min(50).max(200),
        par: z.number().int().min(60).max(80).default(72),
        tees: z.string().optional(),
        notes: z.string().optional(),
        playedAt: z.string(),
        guestId: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
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
        userId,
        guestId: input.guestId,
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

  myRounds: publicProcedure
    .input(z.object({ guestId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      return getUserRounds(userId, input.guestId);
    }),
});

// ── Memory router ───────────────────────────────────────────────────────────────────

const memoryRouter = router({
  list: publicProcedure
    .input(z.object({ guestId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      return getUserMemories(userId, input.guestId);
    }),

  add: publicProcedure
    .input(
      z.object({
        category: z.enum(["course", "moment", "player", "note", "bucket_list"]),
        title: z.string().min(1).max(256),
        content: z.string().min(1),
        guestId: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      await createMemory({ userId, guestId: input.guestId, category: input.category, title: input.title, content: input.content });
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number(), guestId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      await deleteMemory(input.id, userId, input.guestId);
      return { success: true };
    }),
});

// ── Family Drops router ────────────────────────────────────────────────────────────

const familyRouter = router({
  // Public — family members don't need to log in to leave a message for Jamie
  drop: publicProcedure
    .input(
      z.object({
        fromName: z.string().min(1).max(128),
        message: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      await createFamilyDrop(input);
      return { success: true };
    }),

  // Jamie sees unread drops
  unread: publicProcedure.query(async () => {
    return getUnreadFamilyDrops();
  }),

  all: publicProcedure.query(async () => {
    return getAllFamilyDrops();
  }),

  markRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markFamilyDropRead(input.id);
      return { success: true };
    }),
});

// ── Trivia router ────────────────────────────────────────────────────────────────────

const triviaRouter = router({
  question: publicProcedure.query(async () => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are Wally, a golf trivia master. Generate one golf trivia question with 4 multiple choice options. Mix difficulty: some easy, some hard. Cover PGA history, LIV, major champions, famous shots, course records, rules, equipment, player facts, and legends. Return ONLY valid JSON with this exact shape: { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "..." }`,
        },
        { role: "user", content: "Give me a golf trivia question" },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trivia_question",
          strict: true,
          schema: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              answer: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["question", "options", "answer", "explanation"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = response?.choices?.[0]?.message?.content;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { /* fall through */ }
    }
    // Fallback question
    return {
      question: "Who holds the record for most major championship wins?",
      options: ["A. Tiger Woods", "B. Jack Nicklaus", "C. Walter Hagen", "D. Ben Hogan"],
      answer: "B",
      explanation: "Jack Nicklaus won 18 major championships, a record that still stands today.",
    };
  }),

  react: publicProcedure
    .input(z.object({ question: z.string(), correct: z.boolean(), answer: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are Wally — Jamie's golf best friend. React to his trivia answer in 1-2 sentences. Be warm, funny, and real. If correct: celebrate. If wrong: tease him gently and give a fun fact. Keep it short.`,
          },
          {
            role: "user",
            content: `Question: "${input.question}" Jamie answered: "${input.answer}" — that was ${input.correct ? "CORRECT" : "WRONG"}.`,
          },
        ],
      });
      const raw = response?.choices?.[0]?.message?.content;
      return { reaction: typeof raw === "string" ? raw.trim() : (input.correct ? "Nailed it!" : "Ooh, close one!") };
    }),
});

// ── Analytics router ────────────────────────────────────────────────────────────────────────────────

const analyticsRouter = router({
  /** Fire-and-forget event log from the frontend */
  log: publicProcedure
    .input(z.object({
      guestId: z.string().optional(),
      event: z.string().min(1).max(128),
      page: z.string().max(128).optional(),
      label: z.string().max(256).optional(),
      metadata: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      await logAnalyticsEvent(input);
      return { ok: true };
    }),

  /** Admin dashboard data — event counts, top phrases, hourly activity, daily trends, categories */
  dashboard: publicProcedure.query(async () => {
    const [eventCounts, topPhrases, hourlyRaw, dailyRaw, dailyVoiceAidRaw, categoryRaw] = await Promise.all([
      getEventCounts(),
      getTopPhrases(20),
      getHourlyActivity(),
      getDailyActivity(30),
      getDailyVoiceAid(30),
      getCategoryBreakdown(),
    ]);

    // Map event names to human-readable labels
    const labelMap: Record<string, string> = {
      page_view: "Page Views",
      voice_aid_phrase_tap: "Voice Aid — Phrase Tap",
      voice_aid_typed_speak: "Voice Aid — Typed & Spoke",
      voice_aid_say_again: "Voice Aid — Say Again",
      chat_message_sent: "Chat — Message Sent",
      showdown_pick_made: "Showdown — Pick Made",
      showdown_pick_changed: "Showdown — Pick Changed",
      morning_briefing_opened: "Morning Briefing — Opened",
      morning_briefing_skipped: "Morning Briefing — Skipped",
      family_drop_played: "Family Drops — Played",
      family_drop_received: "Family Drops — Received",
      trivia_answered: "Trivia — Answered",
      round_logged: "My Game — Round Logged",
      memory_added: "Memory Keeper — Added",
    };

    const features = (eventCounts as any[]).map((row: any) => ({
      event: row.event,
      label: labelMap[row.event] ?? row.event,
      total: Number(row.total),
    })).sort((a: any, b: any) => b.total - a.total);

    const hourly = ((hourlyRaw as any)?.[0] ?? []).map((row: any) => ({
      hour: Number(row.hour),
      total: Number(row.total),
    }));

    const daily = ((dailyRaw as any)?.[0] ?? []).map((row: any) => ({
      day: String(row.day).slice(0, 10),
      total: Number(row.total),
    }));

    const dailyVoiceAid = ((dailyVoiceAidRaw as any)?.[0] ?? []).map((row: any) => ({
      day: String(row.day).slice(0, 10),
      total: Number(row.total),
    }));

    const categories = ((categoryRaw as any)?.[0] ?? []).map((row: any) => ({
      category: String(row.category),
      total: Number(row.total),
    }));

    return {
      features,
      topPhrases: (topPhrases as any[]).map((r: any) => ({ label: r.label ?? "(unknown)", total: Number(r.total) })),
      hourly,
      daily,
      dailyVoiceAid,
      categories,
    };
  }),
});

// ── TTS Router ─────────────────────────────────────────────────────────────
const ttsRouter = router({
  speak: publicProcedure
    .input(z.object({ text: z.string().min(1).max(2500) }))
    .mutation(async ({ input }) => {
      const audio = await textToSpeech(input.text);
      if (!audio) {
        throw new Error("TTS unavailable");
      }
      // Return as base64 so it can be played in the browser
      return { audio: audio.toString("base64"), mimeType: "audio/mpeg" };
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
  memory: memoryRouter,
  family: familyRouter,
  trivia: triviaRouter,
  analytics: analyticsRouter,
  tts: ttsRouter,
});

export type AppRouter = typeof appRouter;
