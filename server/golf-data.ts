/**
 * Golf Data Service
 *
 * Data sources:
 * 1. Polymarket Gamma API (public, no auth) — golf prediction markets
 * 2. ESPN public JSON API — PGA Tour schedule and leaderboard
 * 3. DataGolf API (requires key) — player rankings and stats
 */

const POLYMARKET_GAMMA = "https://gamma-api.polymarket.com";
const ESPN_GOLF_BASE = "https://site.api.espn.com/apis/site/v2/sports/golf/pga";
const DATAGOLF_BASE = "https://feeds.datagolf.com";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
  state: string;
  purse?: string;
  status: "upcoming" | "in_progress" | "completed";
  tour: string;
}

export interface LeaderboardEntry {
  position: number;
  playerName: string;
  playerId?: string;
  country?: string;
  totalScore: string;
  thru: string;
  today: string;
  rounds: string[];
}

export interface PlayerRanking {
  rank: number;
  playerName: string;
  country?: string;
  dgRank?: number;
  owgrRank?: number;
  avgScore?: number;
  sgTotal?: number;
  recentForm?: string;
}

export interface PolymarketGolfMarket {
  id: string;
  title: string;
  slug: string;
  outcomes: { name: string; probability: number }[];
  volume: number;
  liquidity: number;
  endDate: string;
  url: string;
}

// ── ESPN API helpers ─────────────────────────────────────────────────────────

export async function fetchPGASchedule(): Promise<Tournament[]> {
  try {
    const res = await fetch(`${ESPN_GOLF_BASE}/scoreboard?limit=20`);
    if (!res.ok) throw new Error(`ESPN schedule error: ${res.status}`);
    const data = await res.json() as any;

    const events: Tournament[] = [];
    const eventsArr = data?.events ?? [];

    for (const evt of eventsArr) {
      const comp = evt?.competitions?.[0];
      const venue = comp?.venue;
      const status = evt?.status?.type?.name ?? "";

      let tournStatus: Tournament["status"] = "upcoming";
      if (status === "STATUS_IN_PROGRESS") tournStatus = "in_progress";
      else if (status === "STATUS_FINAL") tournStatus = "completed";

      events.push({
        id: evt.id ?? evt.uid ?? String(Math.random()),
        name: evt.name ?? evt.shortName ?? "Unknown Tournament",
        startDate: evt.date ?? "",
        endDate: comp?.endDate ?? evt.date ?? "",
        venue: venue?.fullName ?? venue?.name ?? "TBD",
        city: venue?.address?.city ?? "",
        state: venue?.address?.state ?? "",
        purse: evt?.competitions?.[0]?.purse
          ? `$${Number(evt.competitions[0].purse).toLocaleString()}`
          : undefined,
        status: tournStatus,
        tour: "PGA Tour",
      });
    }

    return events;
  } catch (err) {
    console.error("[GolfData] ESPN schedule fetch failed:", err);
    return [];
  }
}

export async function fetchPGALeaderboard(eventId?: string): Promise<LeaderboardEntry[]> {
  try {
    const url = eventId
      ? `${ESPN_GOLF_BASE}/scoreboard?event=${eventId}`
      : `${ESPN_GOLF_BASE}/scoreboard`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ESPN leaderboard error: ${res.status}`);
    const data = await res.json() as any;

    const entries: LeaderboardEntry[] = [];
    const competitions = data?.events?.[0]?.competitions ?? [];
    const competitors = competitions?.[0]?.competitors ?? [];

    for (const c of competitors) {
      const stats = c?.statistics ?? [];
      const rounds = c?.linescores?.map((ls: any) => String(ls?.value ?? "-")) ?? [];

      entries.push({
        position: c?.status?.position?.id ? Number(c.status.position.id) : 999,
        playerName: c?.athlete?.displayName ?? c?.athlete?.fullName ?? "Unknown",
        playerId: c?.athlete?.id,
        country: c?.athlete?.flag?.alt ?? c?.athlete?.country,
        totalScore: c?.score ?? c?.status?.displayValue ?? "E",
        thru: c?.status?.thru ?? c?.status?.displayValue ?? "-",
        today: c?.linescores?.slice(-1)?.[0]?.value?.toString() ?? "-",
        rounds,
      });
    }

    return entries.sort((a, b) => a.position - b.position);
  } catch (err) {
    console.error("[GolfData] ESPN leaderboard fetch failed:", err);
    return [];
  }
}

// ── DataGolf API helpers ─────────────────────────────────────────────────────

export async function fetchPlayerRankings(apiKey: string): Promise<PlayerRanking[]> {
  try {
    const res = await fetch(
      `${DATAGOLF_BASE}/preds/get-dg-rankings?file_format=json&key=${apiKey}`
    );
    if (!res.ok) throw new Error(`DataGolf rankings error: ${res.status}`);
    const data = await res.json() as any;

    const players = data?.rankings ?? [];
    return players.slice(0, 50).map((p: any, idx: number) => ({
      rank: idx + 1,
      playerName: p?.player_name ?? "Unknown",
      country: p?.country,
      dgRank: p?.dg_rank ?? idx + 1,
      owgrRank: p?.owgr_rank,
      avgScore: p?.datagolf_skill ? parseFloat(p.datagolf_skill.toFixed(2)) : undefined,
      sgTotal: p?.sg_total ? parseFloat(p.sg_total.toFixed(3)) : undefined,
      recentForm: p?.recent_form,
    }));
  } catch (err) {
    console.error("[GolfData] DataGolf rankings fetch failed:", err);
    return [];
  }
}

export async function fetchTournamentField(apiKey: string): Promise<{ playerName: string; playerId?: string; country?: string }[]> {
  try {
    const res = await fetch(
      `${DATAGOLF_BASE}/field-updates?tour=pga&file_format=json&key=${apiKey}`
    );
    if (!res.ok) throw new Error(`DataGolf field error: ${res.status}`);
    const data = await res.json() as any;

    const field = data?.field ?? [];
    return field.map((p: any) => ({
      playerName: p?.player_name ?? "Unknown",
      playerId: p?.dg_id?.toString(),
      country: p?.country,
    }));
  } catch (err) {
    console.error("[GolfData] DataGolf field fetch failed:", err);
    return [];
  }
}

// ── Polymarket API helpers ───────────────────────────────────────────────────

export async function fetchPolymarketGolfMarkets(): Promise<PolymarketGolfMarket[]> {
  try {
    // Search for golf markets using the search endpoint
    const searchRes = await fetch(
      `${POLYMARKET_GAMMA}/events?active=true&closed=false&limit=50&order=volume&ascending=false`,
      { headers: { "Accept": "application/json" } }
    );

    if (!searchRes.ok) throw new Error(`Polymarket events error: ${searchRes.status}`);
    const events = await searchRes.json() as any[];

    // Filter for golf-related events
    const golfKeywords = ["golf", "pga", "masters", "open championship", "us open", "ryder cup", "liv golf", "players championship"];
    const golfEvents = events.filter((evt: any) => {
      const title = (evt?.title ?? "").toLowerCase();
      const desc = (evt?.description ?? "").toLowerCase();
      return golfKeywords.some(kw => title.includes(kw) || desc.includes(kw));
    });

    const markets: PolymarketGolfMarket[] = [];

    for (const evt of golfEvents.slice(0, 15)) {
      const evtMarkets = evt?.markets ?? [];
      if (evtMarkets.length === 0) continue;

      // Multi-outcome event (e.g. "Who will win the US Open?")
      const outcomes = evtMarkets.map((m: any) => ({
        name: m?.groupItemTitle ?? m?.question ?? m?.outcomePrices?.[0] ?? "Unknown",
        probability: m?.lastTradePrice
          ? parseFloat((parseFloat(m.lastTradePrice) * 100).toFixed(1))
          : m?.bestAsk
          ? parseFloat((parseFloat(m.bestAsk) * 100).toFixed(1))
          : 0,
      })).sort((a: any, b: any) => b.probability - a.probability);

      markets.push({
        id: evt.id ?? evt.conditionId ?? String(Math.random()),
        title: evt.title ?? "Golf Market",
        slug: evt.slug ?? "",
        outcomes: outcomes.slice(0, 10),
        volume: parseFloat(evt.volume ?? "0"),
        liquidity: parseFloat(evt.liquidity ?? "0"),
        endDate: evt.endDate ?? "",
        url: `https://polymarket.com/event/${evt.slug ?? evt.id}`,
      });
    }

    return markets;
  } catch (err) {
    console.error("[GolfData] Polymarket fetch failed:", err);
    return [];
  }
}
