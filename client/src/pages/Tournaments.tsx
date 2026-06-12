import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Trophy, Calendar, MapPin, ChevronDown, ChevronUp, Target, Zap } from "lucide-react";
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

function LeaderboardPanel({ eventId }: { eventId?: string }) {
  const { data: leaderboard, isLoading } = trpc.golf.leaderboard.useQuery(
    { eventId },
    { refetchInterval: 60000 }
  );

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

  return (
    <div className="mt-4 overflow-x-auto">
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
          {leaderboard.slice(0, 15).map((entry, i) => (
            <tr key={i} className="scorecard-row hover:bg-muted/30 transition-colors">
              <td className="py-2.5 font-score text-muted-foreground text-xs">
                {entry.position === 999 ? "-" : entry.position}
              </td>
              <td className="py-2.5 font-medium text-foreground">{entry.playerName}</td>
              <td className={`py-2.5 text-right font-score font-semibold ${
                entry.totalScore.startsWith("-") ? "text-green-mid" :
                entry.totalScore === "E" ? "text-foreground" : "text-destructive"
              }`}>
                {entry.totalScore}
              </td>
              <td className={`py-2.5 text-right font-score text-sm ${
                entry.today.startsWith("-") ? "text-green-mid" : "text-foreground"
              }`}>
                {entry.today}
              </td>
              <td className="py-2.5 text-right font-score text-muted-foreground text-xs">
                {entry.thru}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
            <LeaderboardPanel eventId={tournament.id} />
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
          PGA Tour · LIV Golf · Live leaderboards
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
