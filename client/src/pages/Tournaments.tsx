import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Trophy, Calendar, MapPin, ChevronDown, ChevronUp, Target, Zap, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

function StatusBadge({ status }: { status: string }) {
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-light/10 text-green-light text-xs font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-green-light animate-pulse" />
        Live Now
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-mono">
        Final
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full bg-brass/10 text-brass text-xs font-mono">
      Upcoming
    </span>
  );
}

function LeaderboardPanel({ eventId, tour }: { eventId?: string; tour?: string }) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [narrating, setNarrating] = useState(false);
  const { data: leaderboard, isLoading } = trpc.golf.leaderboard.useQuery(
    { eventId, tour },
    { refetchInterval: 60000 }
  );

  const narrateLeaderboard = useCallback(() => {
    if (!leaderboard || leaderboard.length === 0) return;
    if (narrating) {
      window.speechSynthesis.cancel();
      setNarrating(false);
      return;
    }
    const top5 = leaderboard.slice(0, 5);
    const text = `Here's the top 5. ` +
      top5.map((e, i) => `${i + 1}: ${e.playerName}, ${e.totalScore} total`).join('. ') +
      `. That's your live leaderboard.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;
    utterance.onend = () => setNarrating(false);
    utterance.onerror = () => setNarrating(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setNarrating(true);
  }, [leaderboard, narrating]);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <p className="text-muted-foreground text-sm mt-4 font-mono">
        Leaderboard data unavailable — check back when the tournament begins.
      </p>
    );
  }

  // Search logic
  const searchTerm = search.trim().toLowerCase();
  const matchIdx = searchTerm
    ? leaderboard.findIndex((e) => e.playerName.toLowerCase().includes(searchTerm))
    : -1;
  const matchEntry = matchIdx >= 0 ? leaderboard[matchIdx] : null;

  // Rows to display in table
  let displayRows: typeof leaderboard;
  let highlightPos = -1;
  if (searchTerm && matchEntry) {
    const start = Math.max(0, matchIdx - 3);
    const end = Math.min(leaderboard.length, matchIdx + 4);
    displayRows = leaderboard.slice(start, end);
    highlightPos = matchIdx - start;
  } else if (showAll) {
    displayRows = leaderboard;
  } else {
    displayRows = leaderboard.slice(0, 25);
  }

  const scoreColor = (s: string) =>
    s.startsWith("-") ? "text-green-mid" : s === "E" ? "text-foreground" : "text-destructive";

  return (
    <div className="mt-4">
      {/* Narrate top 5 button */}
      {leaderboard && leaderboard.length > 0 && (
        <button
          onClick={narrateLeaderboard}
          className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            narrating
              ? "bg-brass/10 border-brass/40 text-brass"
              : "border-border text-muted-foreground hover:border-brass/40 hover:text-brass"
          }`}
        >
          {narrating ? <VolumeX size={13} /> : <Volume2 size={13} />}
          {narrating ? "Stop narrating" : "Read top 5 aloud"}
        </button>
      )}

      {/* Player search input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a player..."
          className="w-full px-4 py-2.5 pl-9 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 transition-colors"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-mono"
          >
            ✕
          </button>
        )}
      </div>

      {/* No match */}
      {searchTerm && !matchEntry && (
        <p className="text-muted-foreground text-sm font-mono py-3 text-center">
          No player found matching &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Match highlight card */}
      {searchTerm && matchEntry && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-4 rounded-xl bg-brass/5 border border-brass/30"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-serif font-semibold text-foreground text-base leading-tight">{matchEntry.playerName}</div>
              <div className="text-muted-foreground text-xs font-mono mt-0.5">
                {matchEntry.country && `${matchEntry.country} · `}
                Position #{matchEntry.position === 999 ? "–" : matchEntry.position}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`font-score text-2xl font-bold ${scoreColor(matchEntry.totalScore)}`}>
                {matchEntry.totalScore}
              </div>
              <div className="text-muted-foreground text-xs font-mono">
                Today {matchEntry.today} · Thru {matchEntry.thru}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard table */}
      {(!searchTerm || matchEntry) && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2 text-muted-foreground font-mono text-xs uppercase tracking-wider w-10">Pos</th>
                <th className="text-left pb-2 text-muted-foreground font-mono text-xs uppercase tracking-wider">Player</th>
                <th className="text-right pb-2 text-muted-foreground font-mono text-xs uppercase tracking-wider">Total</th>
                <th className="text-right pb-2 text-muted-foreground font-mono text-xs uppercase tracking-wider">Today</th>
                <th className="text-right pb-2 text-muted-foreground font-mono text-xs uppercase tracking-wider">Thru</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((entry, i) => {
                const isMatch = searchTerm && i === highlightPos;
                return (
                  <tr
                    key={i}
                    className={`scorecard-row transition-colors ${
                      isMatch
                        ? "bg-brass/10 border-l-2 border-brass"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="py-2.5 font-score text-muted-foreground text-xs pl-2">
                      {entry.position === 999 ? "-" : entry.position}
                    </td>
                    <td className={`py-2.5 font-medium ${isMatch ? "text-brass" : "text-foreground"}`}>
                      {entry.playerName}
                    </td>
                    <td className={`py-2.5 text-right font-score font-semibold ${scoreColor(entry.totalScore)}`}>
                      {entry.totalScore}
                    </td>
                    <td className={`py-2.5 text-right font-score text-sm ${scoreColor(entry.today)}`}>
                      {entry.today}
                    </td>
                    <td className="py-2.5 text-right font-score text-muted-foreground text-xs">
                      {entry.thru}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!searchTerm && leaderboard.length > 25 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border-t border-border"
            >
              {showAll ? "Show less" : `Show all ${leaderboard.length} players`}
            </button>
          )}
        </div>
      )}

      <p className="text-muted-foreground/50 text-xs font-mono mt-3 text-right">
        Via ESPN · Updates every 60s
      </p>
    </div>
  );
}

type Tournament = {
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
};

function TournamentCard({
  tournament,
  expandedId,
  setExpandedId,
}: {
  tournament: Tournament;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  const isExpanded = expandedId === tournament.id;
  const isLive = tournament.status === "in_progress";
  const isPickable = tournament.status === "upcoming" || tournament.status === "in_progress";

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <motion.div
      layout
      className={`bg-card border rounded-xl overflow-hidden transition-colors ${
        isLive ? "border-green-light/30 shadow-sm shadow-green-light/5" : "border-border hover:border-brass/30"
      }`}
    >
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpandedId(isExpanded ? null : tournament.id)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={tournament.status} />
              <span className="text-muted-foreground text-xs font-mono">{tournament.tour}</span>
              {tournament.startDate && (
                <span className="text-muted-foreground text-xs font-mono">
                  {formatDate(tournament.startDate)}
                  {tournament.endDate && tournament.endDate !== tournament.startDate
                    ? ` – ${formatDate(tournament.endDate)}`
                    : ""}
                </span>
              )}
            </div>
            <h3 className="font-serif font-semibold text-foreground text-lg leading-tight mb-2">
              {tournament.name}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {tournament.venue && tournament.venue !== "TBD" && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {tournament.venue}
                </span>
              )}
              {(tournament.city || tournament.state) && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {[tournament.city, tournament.state].filter(Boolean).join(", ")}
                </span>
              )}
              {tournament.purse && (
                <span className="flex items-center gap-1 text-brass font-mono font-medium text-xs">
                  {tournament.purse}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {isPickable && (
              <Link href="/showdown">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brass/10 hover:bg-brass/20 text-brass text-xs font-mono font-medium transition-colors cursor-pointer">
                  <Target size={11} />
                  Pick winner
                </span>
              </Link>
            )}
            <button className="text-muted-foreground hover:text-foreground transition-colors mt-1">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border px-5 pb-5 overflow-hidden"
          >
            <div className="brass-divider my-4" />
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {isLive ? "Live Leaderboard" : tournament.status === "completed" ? "Final Results" : "Field Preview"}
            </h4>
            <LeaderboardPanel eventId={tournament.id} tour={tournament.tour} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Tournaments() {
  const { data: tournaments, isLoading } = trpc.golf.tournaments.useQuery(
    undefined,
    { refetchInterval: 300000 }
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = tournaments?.filter((t) => t.status === "in_progress") ?? [];
  const upcoming = tournaments?.filter((t) => t.status === "upcoming") ?? [];
  const completed = tournaments?.filter((t) => t.status === "completed") ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const totalCount = (tournaments?.length ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Tournaments</h1>
        <p className="text-muted-foreground text-sm font-mono">
          PGA Tour · LPGA · Live leaderboards
          {totalCount > 0 && ` · ${totalCount} events`}
        </p>
      </div>

      {/* Pick winner CTA banner */}
      {(active.length > 0 || upcoming.length > 0) && (
        <Link href="/showdown">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-brass/5 border border-brass/20 rounded-xl cursor-pointer hover:bg-brass/10 transition-colors"
          >
            <Zap size={18} className="text-brass flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-serif font-semibold text-foreground text-sm">
                Wally vs Jamie — Pick Your Winner
              </div>
              <div className="text-muted-foreground text-xs font-mono mt-0.5">
                {active.length > 0
                  ? `${active[0].name} is live — who's taking it?`
                  : upcoming.length > 0
                  ? `${upcoming[0].name} coming up — make your call`
                  : "Make your pick for this week's tournament"}
              </div>
            </div>
            <span className="text-brass text-xs font-mono flex-shrink-0">Go →</span>
          </motion.div>
        </Link>
      )}

      {/* Live Now */}
      {active.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-light animate-pulse" />
            <h2 className="font-serif font-semibold text-foreground">Live Now</h2>
            <span className="text-muted-foreground text-xs font-mono">({active.length})</span>
          </div>
          <div className="space-y-3">
            {active.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ))}
          </div>
        </section>
      )}

      {/* Coming Up */}
      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-brass" />
            <h2 className="font-serif font-semibold text-foreground">Coming Up</h2>
            <span className="text-muted-foreground text-xs font-mono">({upcoming.length})</span>
          </div>
          <div className="space-y-3">
            {upcoming.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Results */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-muted-foreground" />
            <h2 className="font-serif font-semibold text-foreground">Recent Results</h2>
          </div>
          <div className="space-y-3">
            {completed.slice(0, 5).map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ))}
          </div>
        </section>
      )}

      {totalCount === 0 && (
        <div className="text-center py-16">
          <Trophy size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">No tournament data available right now.</p>
          <p className="text-muted-foreground/60 text-sm mt-1 font-mono">Check back soon.</p>
        </div>
      )}
    </div>
  );
}
