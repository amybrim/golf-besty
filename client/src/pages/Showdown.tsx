import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Target, Trophy, CheckCircle, XCircle, Clock, ChevronDown, MessageSquare, Swords, TrendingUp, RefreshCw, Lock } from "lucide-react";
import { useGuestId } from "@/hooks/useGuestId";
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
      {/* Header */}
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

      {/* Battle grid */}
      <div className="grid grid-cols-2 divide-x divide-border">
        {/* Jamie */}
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

        {/* Wally */}
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

      {/* Verdict banner */}
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

// No hardcoded field — always use live data from the selected tournament's leaderboard

function ShowdownCard({ pick }: { pick: any }) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
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

      {/* Picks comparison */}
      <div className="grid grid-cols-2 divide-x divide-border">
        {/* Jamie's call */}
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

        {/* Wally's call */}
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

      {/* Wally's reasoning */}
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

export default function Showdown() {
  const guestId = useGuestId();
  const [selectedTournament, setSelectedTournament] = useState<{ id: string; name: string } | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [jamieReasoning, setJamieReasoning] = useState("");
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);
  const [submitted, setSubmitted] = useState<{ aiPick: string; aiReasoning: string } | null>(null);

  const { data: tournaments } = trpc.golf.tournaments.useQuery();
  const { data: myPicks, refetch: refetchPicks } = trpc.picks.myPicks.useQuery(
    { guestId },
    { enabled: !!guestId }
  );
  const { data: nightBriefs, refetch: refetchBriefs } = trpc.picks.nightBrief.useQuery(
    { guestId },
    { enabled: !!guestId, refetchInterval: 5 * 60 * 1000 } // refresh every 5 min
  );
  const activeBriefs = (nightBriefs ?? []).filter((b: any) => b?.statusState === "in" || b?.statusState === "post");

  // Fetch live leaderboard for the selected tournament to get real confirmed field
  const { data: liveLeaderboard } = trpc.golf.leaderboard.useQuery(
    { eventId: selectedTournament?.id },
    { enabled: !!selectedTournament }
  );

  const pickableTournaments = tournaments?.filter(
    (t) => t.status === "upcoming" || t.status === "in_progress"
  ) ?? [];

  // Always use live leaderboard names — never a hardcoded fallback
  const fieldPlayers: string[] = liveLeaderboard && liveLeaderboard.length > 0
    ? liveLeaderboard.map((p: any) => p.playerName)
    : [];

  const existingPickIds = new Set(myPicks?.map((p: any) => p.tournamentId) ?? []);

  const makePick = trpc.picks.makeShowdownPick.useMutation({
    onSuccess: (data: any) => {
      setSubmitted({ aiPick: data.aiPick, aiReasoning: data.aiReasoning });
      refetchPicks();
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Couldn't save your call. Try again.");
    },
  });

  const jamieWins = myPicks?.filter((p: any) => p.isResolved && p.isCorrect).length ?? 0;
  const wallyWins = myPicks?.filter((p: any) => p.isResolved && p.aiIsCorrect).length ?? 0;
  const totalResolved = myPicks?.filter((p: any) => p.isResolved).length ?? 0;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Wally vs Jamie</h1>
        <p className="text-muted-foreground text-sm font-mono">
          Pick the winner of any tournament. Two calls — human gut vs AI. Who's right?
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
            <div className="text-center mt-4 text-sm text-green-mid font-medium">
              Jamie leads. Human gut is winning. 🏌️
            </div>
          )}
          {wallyWins > jamieWins && (
            <div className="text-center mt-4 text-sm text-brass font-medium">
              Wally leads. The data doesn't lie. 🤖
            </div>
          )}
          {wallyWins === jamieWins && totalResolved > 0 && (
            <div className="text-center mt-4 text-sm text-muted-foreground font-medium">
              All square. It's anyone's game.
            </div>
          )}
        </motion.div>
      )}

      {/* Make your call */}
      {pickableTournaments.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-brass" />
            <span className="font-serif font-semibold text-foreground">Make Your Call</span>
          </div>
          <div className="brass-divider mb-5" />

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
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
                Calls are locked. Check back after the tournament to see who was right.
              </div>
              <button
                onClick={() => { setSubmitted(null); setSelectedTournament(null); setSelectedPlayer(""); setJamieReasoning(""); }}
                className="w-full py-2.5 rounded-lg border border-border hover:border-brass/40 text-sm text-foreground transition-all"
              >
                Make another call
              </button>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {/* Tournament */}
              <div>
                <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-2">
                  Choose a tournament
                </label>
                <div className="space-y-2">
                  {pickableTournaments.map((t: any) => {
                    const alreadyPicked = existingPickIds.has(t.id);
                    return (
                      <button
                        key={t.id}
                        disabled={alreadyPicked}
                        onClick={() => setSelectedTournament({ id: t.id, name: t.name })}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                          selectedTournament?.id === t.id
                            ? "border-brass bg-brass/5 text-foreground"
                            : alreadyPicked
                            ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                            : "border-border hover:border-brass/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-medium text-sm">{t.name}</div>
                          {t.status === "in_progress" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-light/10 text-green-light text-xs font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-light animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {t.venue && t.venue !== "TBD" && <span className="text-xs text-muted-foreground font-mono">{t.venue}</span>}
                          {t.tour && <span className="text-xs text-muted-foreground font-mono">{t.tour}</span>}
                        </div>
                        {alreadyPicked && <div className="text-xs text-brass font-mono mt-0.5">Already called ✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player */}
              {selectedTournament && (
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-2">
                    Who's winning it?
                  </label>
                  {fieldPlayers.length === 0 ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border text-muted-foreground text-sm">
                      <div className="w-3 h-3 rounded-full border-2 border-brass border-t-transparent animate-spin" />
                      Loading confirmed field...
                    </div>
                  ) : (
                  <div className="relative">
                    <button
                      onClick={() => setPlayerDropdownOpen(!playerDropdownOpen)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-brass/40 transition-all flex items-center justify-between"
                    >
                      <span className={selectedPlayer ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {selectedPlayer || `Pick from ${fieldPlayers.length} players...`}
                      </span>
                      <ChevronDown size={16} className="text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {playerDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-xl shadow-lg"
                        >
                          {/* Search inside dropdown */}
                          <div className="p-2 border-b border-border sticky top-0 bg-card">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Type to search..."
                              className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
                              onChange={(e) => {
                                const q = e.target.value.toLowerCase();
                                const list = document.getElementById('player-list');
                                if (list) {
                                  Array.from(list.children).forEach((el) => {
                                    const btn = el as HTMLButtonElement;
                                    btn.style.display = btn.textContent?.toLowerCase().includes(q) ? '' : 'none';
                                  });
                                }
                              }}
                            />
                          </div>
                          <div id="player-list" className="max-h-52 overflow-y-auto">
                            {fieldPlayers.map((player: string) => (
                              <button
                                key={player}
                                onClick={() => { setSelectedPlayer(player); setPlayerDropdownOpen(false); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm text-foreground border-b border-border/50 last:border-0"
                              >
                                {player}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  )}
                </div>
              )}

              {/* Jamie's reasoning */}
              {selectedPlayer && (
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-2">
                    Your reasoning (optional — trash talk welcome)
                  </label>
                  <textarea
                    value={jamieReasoning}
                    onChange={(e) => setJamieReasoning(e.target.value)}
                    placeholder="Why him? Gut feel? Saw him on 18 last week? Wally will respond..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 resize-none transition-colors"
                  />
                </div>
              )}

              {/* Submit */}
              {selectedTournament && selectedPlayer && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button
                    onClick={() => makePick.mutate({
                      tournamentId: selectedTournament.id,
                      tournamentName: selectedTournament.name,
                      playerName: selectedPlayer,
                      jamieReasoning: jamieReasoning || undefined,
                      guestId,
                    })}
                    disabled={makePick.isPending}
                    className="w-full py-3.5 rounded-xl brass-badge font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {makePick.isPending ? "Wally is thinking..." : `Lock in ${selectedPlayer} — see what Wally says →`}
                  </button>
                  <p className="text-center text-muted-foreground text-xs font-mono mt-2">
                    Wally will reveal his pick and reasoning right after you submit
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No tournaments */}
      {pickableTournaments.length === 0 && (!myPicks || myPicks.length === 0) && (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Target size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif text-foreground mb-2">No tournament this week</p>
          <p className="text-muted-foreground text-sm font-mono">
            Check back when the next event is on the schedule.
          </p>
        </div>
      )}

      {/* Night Brief — live battle cards for active tournaments */}
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

      {/* History */}
      {myPicks && myPicks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-semibold text-foreground">Past Showdowns</h2>
          </div>
          {myPicks.map((pick: any) => {
            const isLocked = pick.isLocked;
            return (
              <div key={pick.id} className="relative">
                {isLocked && !pick.isResolved && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 text-xs text-muted-foreground font-mono">
                    <Lock size={10} /> Locked
                  </div>
                )}
                <ShowdownCard pick={pick} />
              </div>
            );
          })}
        </section>
      )}

      <div className="text-center text-muted-foreground text-xs font-mono border-t border-border pt-5">
        Wally vs Jamie is purely for fun. No money, no wagering — just two friends calling it every week.
      </div>
    </div>
  );
}
