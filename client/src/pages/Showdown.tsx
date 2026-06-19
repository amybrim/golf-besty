import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Target, Trophy, CheckCircle, XCircle, Clock, ChevronDown, MessageSquare, Swords, TrendingUp, RefreshCw, Lock } from "lucide-react";
import { useGuestId } from "@/hooks/useGuestId";
import { useAnalytics } from "@/hooks/useAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

// ── Night Brief Card ──────────────────────────────────────────────────────────
function NightBriefCard({ brief }: { brief: any }) {
  const jamiePos = brief.jamie.position;
  const wallyPos = brief.wally.position;
  const jamieWinning = jamiePos !== null && wallyPos !== null && jamiePos < wallyPos;
  const wallyWinning = jamiePos !== null && wallyPos !== null && wallyPos < jamiePos;
  const tied = jamiePos !== null && wallyPos !== null && jamiePos === wallyPos;

  const scoreColor = (score: string) => {
    if (!score || score === "–" || score === "E") return "text-foreground";
    return score.startsWith("-") ? "text-green-mid" : "text-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-serif font-semibold text-foreground text-sm">{brief.tournamentName}</div>
          <div className="text-muted-foreground text-xs font-mono mt-0.5">{brief.statusDetail}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {brief.statusState === "in" && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-light/10 text-green-light text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-light animate-pulse" />
              Live
            </span>
          )}
          <Swords size={14} className="text-brass" />
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border">
        <div className={`px-5 py-4 ${jamieWinning ? "bg-green-light/5" : ""}`}>
          <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2">Jamie's Pick</div>
          <div className="font-serif font-semibold text-foreground text-sm mb-2">{brief.jamie.playerName}</div>
          <div className="flex items-baseline gap-2">
            <span className={`font-score text-2xl font-bold ${scoreColor(brief.jamie.total)}`}>{brief.jamie.total}</span>
            {brief.jamie.position && (
              <span className="text-muted-foreground text-xs font-mono">T{brief.jamie.position}</span>
            )}
          </div>
          <div className="text-muted-foreground text-xs font-mono mt-1">
            Today: <span className={scoreColor(brief.jamie.today)}>{brief.jamie.today}</span>
            {brief.jamie.thru && brief.jamie.thru !== "-" && <span className="ml-1">· Thru {brief.jamie.thru}</span>}
          </div>
          {jamieWinning && (
            <div className="mt-2 text-green-light text-xs font-mono flex items-center gap-1">
              <TrendingUp size={11} /> Leading
            </div>
          )}
        </div>

        <div className={`px-5 py-4 ${wallyWinning ? "bg-brass/5" : ""}`}>
          <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2">Wally's Pick</div>
          <div className="font-serif font-semibold text-foreground text-sm mb-2">{brief.wally.playerName}</div>
          <div className="flex items-baseline gap-2">
            <span className={`font-score text-2xl font-bold ${scoreColor(brief.wally.total)}`}>{brief.wally.total}</span>
            {brief.wally.position && (
              <span className="text-muted-foreground text-xs font-mono">T{brief.wally.position}</span>
            )}
          </div>
          <div className="text-muted-foreground text-xs font-mono mt-1">
            Today: <span className={scoreColor(brief.wally.today)}>{brief.wally.today}</span>
            {brief.wally.thru && brief.wally.thru !== "-" && <span className="ml-1">· Thru {brief.wally.thru}</span>}
          </div>
          {wallyWinning && (
            <div className="mt-2 text-brass text-xs font-mono flex items-center gap-1">
              <TrendingUp size={11} /> Leading
            </div>
          )}
        </div>
      </div>

      {(jamieWinning || wallyWinning || tied) && (
        <div className={`px-5 py-2.5 text-center text-xs font-mono border-t border-border ${
          jamieWinning ? "text-green-light bg-green-light/5" :
          wallyWinning ? "text-brass bg-brass/5" :
          "text-muted-foreground"
        }`}>
          {jamieWinning && "Jamie's player is ahead right now. Human gut 🏌️"}
          {wallyWinning && "Wally's player is ahead right now. The data doesn't lie 🤖"}
          {tied && "Dead heat. Both players tied on the leaderboard."}
        </div>
      )}
    </motion.div>
  );
}

// ── Per-tournament pick card ──────────────────────────────────────────────────
function TournamentPickCard({
  tournament,
  existingPick,
  guestId,
  onPickMade,
}: {
  tournament: any;
  existingPick: any;
  guestId: string;
  onPickMade: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [jamieReasoning, setJamieReasoning] = useState("");
  const [submitted, setSubmitted] = useState<{ aiPick: string; aiReasoning: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isLive = tournament.status === "in_progress";
  const alreadyPicked = !!existingPick;

  const { data: liveLeaderboard } = trpc.golf.leaderboard.useQuery(
    { eventId: tournament.id },
    { enabled: open && !alreadyPicked }
  );

  const fieldPlayers: string[] = liveLeaderboard && liveLeaderboard.length > 0
    ? liveLeaderboard.map((p: any) => p.playerName)
    : [];

  const filtered = playerSearch
    ? fieldPlayers.filter((p) => p.toLowerCase().includes(playerSearch.toLowerCase()))
    : fieldPlayers;

  const { track } = useAnalytics(guestId);

  const makePick = trpc.picks.makeShowdownPick.useMutation({
    onSuccess: (data: any) => {
      track("showdown_pick_made", { label: tournament.name });
      setSubmitted({ aiPick: data.aiPick, aiReasoning: data.aiReasoning });
      onPickMade();
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Couldn't save your call. Try again.");
    },
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Card header — always visible */}
      <button
        onClick={() => !alreadyPicked && setOpen((v) => !v)}
        className={`w-full text-left px-5 py-4 flex items-start justify-between gap-4 ${!alreadyPicked ? "hover:bg-muted/20 transition-colors" : ""}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif font-semibold text-foreground">{tournament.name}</span>
            {isLive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-light/10 text-green-light text-xs font-mono shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-light animate-pulse" />
                Live now
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {tournament.venue && tournament.venue !== "TBD" && (
              <span className="text-xs text-muted-foreground font-mono">{tournament.venue}</span>
            )}
            {tournament.startDate && (
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(tournament.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {tournament.endDate && tournament.endDate !== tournament.startDate && (
                  <> – {new Date(tournament.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                )}
              </span>
            )}
            {tournament.tour && <span className="text-xs text-muted-foreground font-mono">{tournament.tour}</span>}
          </div>
        </div>

        {alreadyPicked ? (
          <div className="text-right shrink-0">
            <div className="text-xs text-brass font-mono font-medium">Called ✓</div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">{existingPick.playerName}</div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-brass text-xs font-mono shrink-0">
            {open ? "Close" : "Make your call →"}
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        )}
      </button>

      {/* Already picked — show the matchup summary */}
      {alreadyPicked && (
        <div className="border-t border-border">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="px-5 py-3">
              <div className="text-muted-foreground text-xs font-mono mb-1">Jamie</div>
              <div className="font-medium text-sm text-foreground">{existingPick.playerName}</div>
            </div>
            <div className="px-5 py-3">
              <div className="text-muted-foreground text-xs font-mono mb-1">Wally</div>
              <div className="font-medium text-sm text-foreground">{existingPick.aiPickPlayerName ?? "—"}</div>
            </div>
          </div>
          {existingPick.isLocked && (
            <div className="px-5 py-2 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Lock size={10} /> Picks locked — tournament in progress
            </div>
          )}
        </div>
      )}

      {/* Expandable pick form */}
      <AnimatePresence>
        {open && !alreadyPicked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-5 py-5 space-y-4">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-xl p-4 text-center">
                      <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2">Your Call</div>
                      <div className="font-serif font-semibold text-foreground">{selectedPlayer}</div>
                      {jamieReasoning && (
                        <p className="text-muted-foreground text-xs mt-2 italic">"{jamieReasoning}"</p>
                      )}
                    </div>
                    <div className="bg-brass/5 border border-brass/20 rounded-xl p-4 text-center">
                      <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2">Wally's Call</div>
                      <div className="font-serif font-semibold text-brass">{submitted.aiPick}</div>
                    </div>
                  </div>
                  {submitted.aiReasoning && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                        <MessageSquare size={12} className="text-brass" />
                        Wally's reasoning
                      </div>
                      <div className="text-sm text-foreground leading-relaxed">
                        <Streamdown>{submitted.aiReasoning}</Streamdown>
                      </div>
                    </div>
                  )}
                  <div className="text-center text-muted-foreground text-xs font-mono">
                    Calls are locked. Check back after the tournament.
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Player picker */}
                  <div>
                    <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-2">
                      Who's winning it?
                    </label>
                  {fieldPlayers.length === 0 && !liveLeaderboard ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border text-muted-foreground text-sm">
                      <div className="w-3 h-3 rounded-full border-2 border-brass border-t-transparent animate-spin" />
                      Loading confirmed field...
                    </div>
                  ) : fieldPlayers.length === 0 ? (
                    <div className="px-4 py-3 rounded-lg border border-border bg-muted/30">
                      <p className="text-muted-foreground text-sm font-mono">
                        Field not yet confirmed — ESPN releases the official entry list closer to tee-off.
                      </p>
                      {tournament.startDate && (
                        <p className="text-muted-foreground text-xs font-mono mt-1">
                          Tournament starts {new Date(tournament.startDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. Check back a day or two before.
                        </p>
                      )}
                    </div>
                  ) : (
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen((v) => !v)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-brass/40 transition-all flex items-center justify-between"
                        >
                          <span className={selectedPlayer ? "text-foreground font-medium" : "text-muted-foreground"}>
                            {selectedPlayer || `Pick from ${fieldPlayers.length} players...`}
                          </span>
                          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                        </button>
                        <AnimatePresence>
                          {dropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute top-full left-0 right-0 z-30 mt-1 bg-card border border-border rounded-xl shadow-xl"
                            >
                              <div className="p-2 border-b border-border bg-card sticky top-0 rounded-t-xl">
                                <input
                                  autoFocus
                                  type="text"
                                  value={playerSearch}
                                  placeholder="Search player..."
                                  onChange={(e) => setPlayerSearch(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
                                />
                              </div>
                              <div className="max-h-52 overflow-y-auto">
                                {filtered.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-muted-foreground">No players found</div>
                                ) : (
                                  filtered.map((player: string) => (
                                    <button
                                      key={player}
                                      onClick={() => {
                                        setSelectedPlayer(player);
                                        setDropdownOpen(false);
                                        setPlayerSearch("");
                                      }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm text-foreground border-b border-border/50 last:border-0"
                                    >
                                      {player}
                                    </button>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Reasoning */}
                  {selectedPlayer && (
                    <div>
                      <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-2">
                        Your reasoning (optional — trash talk welcome)
                      </label>
                      <textarea
                        value={jamieReasoning}
                        onChange={(e) => setJamieReasoning(e.target.value)}
                        placeholder="Why him? Gut feel? Wally will respond..."
                        rows={2}
                        maxLength={500}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 resize-none transition-colors"
                      />
                    </div>
                  )}

                  {/* Submit */}
                  {selectedPlayer && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <button
                        onClick={() =>
                          makePick.mutate({
                            tournamentId: tournament.id,
                            tournamentName: tournament.name,
                            playerName: selectedPlayer,
                            jamieReasoning: jamieReasoning || undefined,
                            guestId,
                          })
                        }
                        disabled={makePick.isPending}
                        className="w-full py-3.5 rounded-xl brass-badge font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {makePick.isPending ? "Wally is thinking..." : `Lock in ${selectedPlayer} — see what Wally says →`}
                      </button>
                      <p className="text-center text-muted-foreground text-xs font-mono mt-2">
                        Wally reveals his pick right after you submit
                      </p>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ShowdownCard (history) ────────────────────────────────────────────────────
function ShowdownCard({ pick }: { pick: any }) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <div className="font-serif font-semibold text-foreground">{pick.tournamentName}</div>
          <div className="text-muted-foreground text-xs font-mono mt-0.5">
            {new Date(pick.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
        {pick.isResolved ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-muted-foreground text-xs font-mono">Actual winner</span>
            <span className="font-serif font-semibold text-brass text-sm">{pick.actualWinner ?? "—"}</span>
          </div>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brass/10 text-brass text-xs font-mono">
            <Clock size={11} /> In play
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 divide-x divide-border">
        <div className="px-5 py-4">
          <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2">Jamie's Call</div>
          <div className="font-medium text-foreground mb-1">{pick.playerName}</div>
          {pick.isResolved && (
            pick.isCorrect
              ? <span className="flex items-center gap-1 text-green-light text-xs font-mono"><CheckCircle size={12} /> Nailed it</span>
              : <span className="flex items-center gap-1 text-muted-foreground text-xs font-mono"><XCircle size={12} /> Missed</span>
          )}
          {pick.jamieReasoning && (
            <p className="text-muted-foreground text-xs mt-2 italic leading-relaxed">"{pick.jamieReasoning}"</p>
          )}
        </div>

        <div className="px-5 py-4">
          <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2">Wally's Call</div>
          <div className="font-medium text-foreground mb-1">{pick.aiPickPlayerName ?? "—"}</div>
          {pick.isResolved && (
            pick.aiIsCorrect
              ? <span className="flex items-center gap-1 text-green-light text-xs font-mono"><CheckCircle size={12} /> Nailed it</span>
              : <span className="flex items-center gap-1 text-muted-foreground text-xs font-mono"><XCircle size={12} /> Missed</span>
          )}
        </div>
      </div>

      {pick.aiReasoning && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2 font-mono text-xs">
              <MessageSquare size={13} className="text-brass" />
              Wally's reasoning
            </span>
            <ChevronDown size={14} className={`transition-transform ${showReasoning ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showReasoning && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                  <Streamdown>{pick.aiReasoning}</Streamdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Showdown page ────────────────────────────────────────────────────────
export default function Showdown() {
  const guestId = useGuestId();

  const { data: tournaments } = trpc.golf.tournaments.useQuery();
  const { data: myPicks, refetch: refetchPicks } = trpc.picks.myPicks.useQuery(
    { guestId },
    { enabled: !!guestId }
  );
  const { data: nightBriefs, refetch: refetchBriefs } = trpc.picks.nightBrief.useQuery(
    { guestId },
    { enabled: !!guestId, refetchInterval: 5 * 60 * 1000 }
  );
  const activeBriefs = (nightBriefs ?? []).filter((b: any) => b?.statusState === "in" || b?.statusState === "post");

  // Show only: 1 live + up to 2 upcoming (max 3 total)
  const liveAndUpcoming = (tournaments ?? []).filter(
    (t: any) => t.status === "in_progress" || t.status === "upcoming"
  ).slice(0, 3);

  const picksByTournament = new Map((myPicks ?? []).map((p: any) => [p.tournamentId, p]));

  const jamieWins = myPicks?.filter((p: any) => p.isResolved && p.isCorrect).length ?? 0;
  const wallyWins = myPicks?.filter((p: any) => p.isResolved && p.aiIsCorrect).length ?? 0;
  const totalResolved = myPicks?.filter((p: any) => p.isResolved).length ?? 0;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Wally vs Jamie</h1>
        <p className="text-muted-foreground text-sm font-mono">
          Pick the winner. One call each — human gut vs AI. Who's right?
        </p>
      </div>

      {/* Running score */}
      {totalResolved > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-brass" />
            <span className="font-serif font-semibold text-foreground">The Running Score</span>
          </div>
          <div className="brass-divider mb-5" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-score text-4xl font-bold text-green-mid mb-1">{jamieWins}</div>
              <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Jamie</div>
              <div className="text-muted-foreground text-xs mt-0.5">Human gut</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-muted-foreground font-mono text-sm">vs</div>
              <div className="text-muted-foreground text-xs font-mono mt-1">{totalResolved} played</div>
            </div>
            <div>
              <div className="font-score text-4xl font-bold text-brass mb-1">{wallyWins}</div>
              <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Wally</div>
              <div className="text-muted-foreground text-xs mt-0.5">AI intelligence</div>
            </div>
          </div>
          {jamieWins > wallyWins && (
            <div className="text-center mt-4 text-sm text-green-mid font-medium">Jamie leads. Human gut is winning. 🏌️</div>
          )}
          {wallyWins > jamieWins && (
            <div className="text-center mt-4 text-sm text-brass font-medium">Wally leads. The data doesn't lie. 🤖</div>
          )}
          {wallyWins === jamieWins && totalResolved > 0 && (
            <div className="text-center mt-4 text-sm text-muted-foreground font-medium">All square. It's anyone's game.</div>
          )}
        </motion.div>
      )}

      {/* Tonight's Battle */}
      {activeBriefs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords size={16} className="text-brass" />
              <h2 className="font-serif font-semibold text-foreground">Tonight's Battle</h2>
            </div>
            <button
              onClick={() => refetchBriefs()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          <p className="text-muted-foreground text-xs font-mono -mt-2">
            Live positions — updates every 5 min. Locked until next tee-off.
          </p>
          {activeBriefs.map((brief: any) => (
            <NightBriefCard key={brief.pickId} brief={brief} />
          ))}
        </section>
      )}

      {/* Tournament pick cards */}
      {liveAndUpcoming.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-brass" />
            <h2 className="font-serif font-semibold text-foreground">Make Your Call</h2>
          </div>
          {liveAndUpcoming.map((t: any) => (
            <TournamentPickCard
              key={t.id}
              tournament={t}
              existingPick={picksByTournament.get(t.id) ?? null}
              guestId={guestId}
              onPickMade={refetchPicks}
            />
          ))}
        </section>
      )}

      {liveAndUpcoming.length === 0 && (!myPicks || myPicks.length === 0) && (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Target size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif text-foreground mb-2">No tournament this week</p>
          <p className="text-muted-foreground text-sm font-mono">
            Check back when the next event is on the schedule.
          </p>
        </div>
      )}

      {/* History */}
      {myPicks && myPicks.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif font-semibold text-foreground">Past Showdowns</h2>
          {myPicks.map((pick: any) => (
            <ShowdownCard key={pick.id} pick={pick} />
          ))}
        </section>
      )}

      <div className="text-center text-muted-foreground text-xs font-mono border-t border-border pt-5">
        Wally vs Jamie is purely for fun. No money, no wagering — just two friends calling it every week.
      </div>
    </div>
  );
}
