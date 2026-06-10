import { trpc } from "@/lib/trpc";
import { Users, Star, TrendingUp, Globe } from "lucide-react";
import { motion } from "framer-motion";

const KNOWN_PLAYERS = [
  { name: "Scottie Scheffler", country: "USA", rank: 1, note: "World No. 1 — dominant force in modern golf", form: "🔥 On fire" },
  { name: "Rory McIlroy", country: "NIR", rank: 2, note: "4-time major winner, still chasing the career Grand Slam", form: "📈 Strong form" },
  { name: "Xander Schauffele", country: "USA", rank: 3, note: "2024 PGA Championship & Open winner", form: "💪 Consistent" },
  { name: "Collin Morikawa", country: "USA", rank: 4, note: "Two-time major champion, elite ball-striker", form: "📊 Steady" },
  { name: "Patrick Cantlay", country: "USA", rank: 5, note: "Ryder Cup lightning rod, clutch performer", form: "🎯 Focused" },
  { name: "Viktor Hovland", country: "NOR", rank: 6, note: "Norwegian sensation, fan favourite worldwide", form: "🌟 Exciting" },
  { name: "Ludvig Åberg", country: "SWE", rank: 7, note: "Rookie phenom — already playing like a veteran", form: "🚀 Rising" },
  { name: "Tommy Fleetwood", country: "ENG", rank: 8, note: "European stalwart, always in contention", form: "📈 In form" },
  { name: "Jon Rahm", country: "ESP", rank: 9, note: "Moved to LIV Golf — 2023 Masters champion", form: "🏌️ LIV" },
  { name: "Bryson DeChambeau", country: "USA", rank: 10, note: "LIV Golf, US Open winner, the mad scientist of golf", form: "💥 LIV" },
  { name: "Brooks Koepka", country: "USA", rank: 11, note: "5-time major winner, LIV Golf — the ultimate big-game player", form: "🏆 LIV" },
  { name: "Dustin Johnson", country: "USA", rank: 12, note: "LIV Golf captain, former world No. 1", form: "🏌️ LIV" },
  { name: "Phil Mickelson", country: "USA", rank: 13, note: "LIV Golf pioneer — the most controversial move in golf history", form: "🤔 LIV" },
  { name: "Tiger Woods", country: "USA", rank: 14, note: "The greatest of all time — still defying the odds", form: "🐯 Legend" },
  { name: "Jordan Spieth", country: "USA", rank: 15, note: "3-time major winner, career Grand Slam in sight", form: "🎯 Hunting" },
  { name: "Justin Thomas", country: "USA", rank: 16, note: "2-time major winner, always dangerous", form: "📊 Steady" },
  { name: "Max Homa", country: "USA", rank: 17, note: "Multiple PGA Tour wins, beloved by golf Twitter", form: "😂 Funny & good" },
  { name: "Tony Finau", country: "USA", rank: 18, note: "Multiple wins, finally living up to the potential", form: "💪 Delivering" },
  { name: "Hideki Matsuyama", country: "JPN", rank: 19, note: "2021 Masters champion, Japanese golf icon", form: "🌸 Consistent" },
  { name: "Shane Lowry", country: "IRL", rank: 20, note: "2019 Open champion, beloved by the galleries", form: "☘️ Solid" },
];

const LIV_PLAYERS = [
  { name: "Jon Rahm", team: "Legion XIII", note: "Shocked the world leaving PGA Tour after Masters win" },
  { name: "Bryson DeChambeau", team: "Crushers GC", note: "Reinvented himself — US Open winner, LIV star" },
  { name: "Brooks Koepka", team: "Smash GC", note: "5 majors, still competing at the highest level" },
  { name: "Dustin Johnson", team: "4 Aces GC", note: "Team captain, former world No. 1" },
  { name: "Phil Mickelson", team: "HyFlyers GC", note: "The man who started it all — still controversial" },
  { name: "Cam Smith", team: "Ripper GC", note: "2022 Open champion, left PGA at peak" },
  { name: "Patrick Reed", team: "Crushers GC", note: "Masters champion, always in the headlines" },
  { name: "Talor Gooch", team: "Range Goats GC", note: "LIV's biggest success story — thriving" },
];

export default function Players() {
  const { data: apiPlayers, isLoading } = trpc.golf.players.useQuery();
  const hasApiData = apiPlayers && apiPlayers.length > 0;

  const displayPlayers = hasApiData
    ? apiPlayers.slice(0, 20).map((p, i) => ({
        name: p.playerName,
        country: p.country ?? "",
        rank: p.owgrRank ?? p.rank,
        note: `SG Total: ${p.sgTotal ?? "N/A"} · Avg Score: ${p.avgScore ?? "N/A"}`,
        form: `DG Rank #${p.dgRank ?? i + 1}`,
      }))
    : KNOWN_PLAYERS;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Player Intel</h1>
        <p className="text-muted-foreground text-sm font-mono">
          World rankings, form, and the stories behind the players
        </p>
      </div>

      {/* PGA World Rankings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-brass" />
          <h2 className="font-serif font-semibold text-foreground">World Rankings</h2>
          {!hasApiData && (
            <span className="text-xs text-muted-foreground font-mono ml-2">
              (DataGolf API key not configured — showing curated list)
            </span>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-mono text-xs uppercase tracking-wider w-12">Rank</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-mono text-xs uppercase tracking-wider">Player</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-mono text-xs uppercase tracking-wider hidden md:table-cell">Country</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-mono text-xs uppercase tracking-wider hidden lg:table-cell">Intel</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-mono text-xs uppercase tracking-wider">Form</th>
                </tr>
              </thead>
              <tbody>
                {displayPlayers.map((player, i) => (
                  <motion.tr
                    key={player.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="scorecard-row hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`font-score font-bold text-sm ${
                        i === 0 ? "text-brass" :
                        i < 3 ? "text-green-mid" :
                        "text-muted-foreground"
                      }`}>
                        #{player.rank ?? i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{player.name}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-muted-foreground text-sm font-mono">{player.country}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-muted-foreground text-sm">{player.note}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm">{player.form}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {!hasApiData && (
            <div className="px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground font-mono">
                Live rankings via DataGolf API · Add DATAGOLF_API_KEY in settings to enable
              </p>
            </div>
          )}
        </div>
      </section>

      {/* LIV Golf section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Star size={16} className="text-brass" />
          <h2 className="font-serif font-semibold text-foreground">LIV Golf — The Breakaways</h2>
          <span className="px-2 py-0.5 rounded-full bg-brass/10 text-brass text-xs font-mono">Saudi-backed</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Since 2022, LIV Golf has pulled some of the biggest names in the game with guaranteed contracts and Saudi money. 
            The PGA Tour vs LIV war has been the biggest story in golf — and it's still not over. 
            A merger framework was announced in 2023 but talks have stalled repeatedly. 
            Greg Norman remains the commissioner and lightning rod. The drama never stops.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LIV_PLAYERS.map((player, i) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-xl p-4 hover:border-brass/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-serif font-semibold text-foreground">{player.name}</div>
                  <div className="text-brass text-xs font-mono mt-0.5">{player.team}</div>
                  <div className="text-muted-foreground text-sm mt-1.5 leading-snug">{player.note}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-brass/10 text-brass text-xs font-mono flex-shrink-0">LIV</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ask The Caddie CTA */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full club-header flex items-center justify-center flex-shrink-0">
          <TrendingUp size={20} className="text-brass" />
        </div>
        <div className="flex-1">
          <div className="font-serif font-semibold text-foreground mb-1">Want the real story on any player?</div>
          <p className="text-muted-foreground text-sm">Ask The Caddie — he knows the gossip, the stats, the drama, and the history.</p>
        </div>
        <a
          href="/chat"
          className="px-5 py-2.5 rounded-lg brass-badge text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Ask The Caddie
        </a>
      </div>
    </div>
  );
}
