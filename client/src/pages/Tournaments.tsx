import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Trophy, Calendar, MapPin, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

function StatusBadge({ status }: { status: string }) {
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-light/10 text-green-light text-xs font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-green-light animate-pulse" />
        Live
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

export default function Tournaments() {
  const { data: tournaments, isLoading } = trpc.golf.tournaments.useQuery(
    undefined,
    { refetchInterval: 300000 }
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = tournaments?.filter((t) => t.status === "in_progress") ?? [];
  const upcoming = tournaments?.filter((t) => t.status === "upcoming") ?? [];
  const completed = tournaments?.filter((t) => t.status === "completed") ?? [];

  const TournamentCard = ({ tournament }: { tournament: typeof tournaments extends undefined ? never : NonNullable<typeof tournaments>[0] }) => {
    const isExpanded = expandedId === tournament.id;
    return (
      <motion.div
        layout
        className="bg-card border border-border rounded-xl overflow-hidden hover:border-brass/30 transition-colors"
      >
        <div
          className="p-5 cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : tournament.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={tournament.status} />
                <span className="text-muted-foreground text-xs font-mono">{tournament.tour}</span>
              </div>
              <h3 className="font-serif font-semibold text-foreground text-lg leading-tight mb-2">
                {tournament.name}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {tournament.venue && (
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
                  <span className="flex items-center gap-1 text-brass font-mono font-medium">
                    <DollarSign size={13} />
                    {tournament.purse}
                  </span>
                )}
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-1">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border px-5 pb-5"
          >
            <div className="brass-divider my-4" />
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Leaderboard
            </h4>
            <LeaderboardPanel eventId={tournament.id} />
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Tournaments</h1>
        <p className="text-muted-foreground text-sm font-mono">PGA Tour schedule and live leaderboards</p>
      </div>

      {active.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-green-light" />
            <h2 className="font-serif font-semibold text-foreground">Live Now</h2>
          </div>
          <div className="space-y-3">
            {active.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-brass" />
            <h2 className="font-serif font-semibold text-foreground">Coming Up</h2>
          </div>
          <div className="space-y-3">
            {upcoming.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-muted-foreground" />
            <h2 className="font-serif font-semibold text-foreground">Recent Results</h2>
          </div>
          <div className="space-y-3">
            {completed.slice(0, 5).map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </section>
      )}

      {(!tournaments || tournaments.length === 0) && (
        <div className="text-center py-16">
          <Trophy size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">No tournament data available right now.</p>
          <p className="text-muted-foreground/60 text-sm mt-1 font-mono">Check back soon.</p>
        </div>
      )}
    </div>
  );
}
