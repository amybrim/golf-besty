import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useGuestId } from "@/hooks/useGuestId";
import { Target, Trophy, Flag, CheckCircle, XCircle, Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const KNOWN_FIELD = [
  "Scottie Scheffler", "Rory McIlroy", "Xander Schauffele", "Collin Morikawa",
  "Patrick Cantlay", "Viktor Hovland", "Ludvig Åberg", "Tommy Fleetwood",
  "Jordan Spieth", "Justin Thomas", "Max Homa", "Tony Finau", "Hideki Matsuyama",
  "Shane Lowry", "Matt Fitzpatrick", "Keegan Bradley", "Wyndham Clark",
  "Russell Henley", "Sahith Theegala", "Adam Scott", "Sungjae Im",
  "Tom Kim", "Cameron Young", "Nick Taylor", "Sepp Straka",
];

function PickCard({ pick }: { pick: any }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="font-serif font-semibold text-foreground">{pick.tournamentName}</div>
          <div className="text-muted-foreground text-xs font-mono mt-0.5">
            {new Date(pick.createdAt).toLocaleDateString()}
          </div>
        </div>
        {pick.isResolved ? (
          pick.isCorrect ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-light/10 text-green-light text-xs font-mono">
              <CheckCircle size={12} /> Won
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-mono">
              <XCircle size={12} /> Missed
            </span>
          )
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brass/10 text-brass text-xs font-mono">
            <Clock size={12} /> Pending
          </span>
        )}
      </div>

      <div className="brass-divider mb-3" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-1">Your Pick</div>
          <div className="font-medium text-foreground">{pick.playerName}</div>
        </div>
        {pick.aiPickPlayerName && (
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-1">The Caddie's Pick</div>
            <div className="font-medium text-foreground">{pick.aiPickPlayerName}</div>
          </div>
        )}
        {pick.isResolved && pick.actualWinner && (
          <div className="col-span-2">
            <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-1">Actual Winner</div>
            <div className="font-serif font-semibold text-brass">{pick.actualWinner}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Picks() {
  const guestId = useGuestId();
  const [selectedTournament, setSelectedTournament] = useState<{ id: string; name: string } | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [showResult, setShowResult] = useState<{ aiPick: string } | null>(null);
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);

  const { data: tournaments } = trpc.golf.tournaments.useQuery();
  const { data: fieldData } = trpc.golf.field.useQuery();
  const { data: myPicks, refetch: refetchPicks } = trpc.picks.myPicks.useQuery(
    { guestId },
    { enabled: !!guestId }
  );

  const pickableTournaments = tournaments?.filter(
    (t) => t.status === "upcoming" || t.status === "in_progress"
  ) ?? [];

  const fieldPlayers = fieldData && fieldData.length > 0
    ? fieldData.map((p) => p.playerName)
    : KNOWN_FIELD;

  const existingPickIds = new Set(myPicks?.map((p) => p.tournamentId) ?? []);

  const makePick = trpc.picks.makePick.useMutation({
    onSuccess: (data) => {
      setShowResult({ aiPick: data.aiPick });
      refetchPicks();
      toast.success("Pick locked in! May the best man win.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Couldn't save your pick. Try again.");
    },
  });

  const handleSubmit = () => {
    if (!selectedTournament || !selectedPlayer) return;
    makePick.mutate({
      tournamentId: selectedTournament.id,
      tournamentName: selectedTournament.name,
      playerName: selectedPlayer,
      guestId,
    });
  };

  const userScore = myPicks?.filter((p) => p.isResolved && p.isCorrect).length ?? 0;
  const aiScore = myPicks?.filter((p) => p.isResolved && p.aiIsCorrect).length ?? 0;
  const totalResolved = myPicks?.filter((p) => p.isResolved).length ?? 0;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Bragging Rights</h1>
        <p className="text-muted-foreground text-sm font-mono">
          Pick tournament winners against The Caddie · No money · Pure pride
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">
        <Flag size={14} className="text-brass flex-shrink-0" />
        <span>
          <strong className="text-foreground">Entertainment only.</strong> No real money, no wagering, no gambling. This is purely for fun and bragging rights between you and The Caddie.
        </span>
      </div>

      {/* Score card */}
      {totalResolved > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-brass" />
            The Scorecard
          </h2>
          <div className="brass-divider mb-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-score text-3xl font-bold text-green-mid">{userScore}</div>
              <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider mt-1">You</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground font-mono text-sm">vs</div>
            </div>
            <div>
              <div className="font-score text-3xl font-bold text-brass">{aiScore}</div>
              <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider mt-1">The Caddie</div>
            </div>
          </div>
          <div className="text-center text-muted-foreground text-xs font-mono mt-3">
            {totalResolved} tournament{totalResolved !== 1 ? "s" : ""} resolved
          </div>
        </div>
      )}

      {/* Make a pick */}
      {pickableTournaments.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target size={16} className="text-brass" />
            Make Your Pick
          </h2>
          <div className="brass-divider mb-5" />

          {showResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <div className="w-14 h-14 rounded-full bg-green-light/10 flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-green-light" />
              </div>
              <div>
                <div className="font-serif font-bold text-foreground text-xl mb-1">Pick Locked In</div>
                <div className="text-muted-foreground text-sm">
                  The Caddie went with <strong className="text-brass">{showResult.aiPick}</strong>
                </div>
                <div className="text-muted-foreground text-sm mt-1">
                  May the best man win. Bragging rights on the line.
                </div>
              </div>
              <button
                onClick={() => { setShowResult(null); setSelectedTournament(null); setSelectedPlayer(""); }}
                className="px-5 py-2.5 rounded-lg border border-border hover:border-brass/40 text-sm text-foreground transition-all"
              >
                Make another pick
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Tournament selector */}
              <div>
                <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-2">
                  Tournament
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {pickableTournaments.map((t) => {
                    const alreadyPicked = existingPickIds.has(t.id);
                    return (
                      <button
                        key={t.id}
                        disabled={alreadyPicked}
                        onClick={() => setSelectedTournament({ id: t.id, name: t.name })}
                        className={`text-left px-4 py-3 rounded-lg border transition-all ${
                          selectedTournament?.id === t.id
                            ? "border-brass bg-brass/5 text-foreground"
                            : alreadyPicked
                            ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                            : "border-border hover:border-brass/40 text-foreground"
                        }`}
                      >
                        <div className="font-medium text-sm">{t.name}</div>
                        {alreadyPicked && (
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">Already picked</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player selector */}
              {selectedTournament && (
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-2">
                    Your Pick to Win
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setPlayerDropdownOpen(!playerDropdownOpen)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-brass/40 transition-all flex items-center justify-between"
                    >
                      <span className={selectedPlayer ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {selectedPlayer || "Select a player..."}
                      </span>
                      <ChevronDown size={16} className="text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {playerDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
                        >
                          {fieldPlayers.map((player) => (
                            <button
                              key={player}
                              onClick={() => { setSelectedPlayer(player); setPlayerDropdownOpen(false); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors text-sm text-foreground border-b border-border/50 last:border-0"
                            >
                              {player}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Submit */}
              {selectedTournament && selectedPlayer && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button
                    onClick={handleSubmit}
                    disabled={makePick.isPending}
                    className="w-full py-3.5 rounded-xl brass-badge font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {makePick.isPending ? "Locking in..." : `Lock in ${selectedPlayer} →`}
                  </button>
                  <p className="text-center text-muted-foreground text-xs font-mono mt-2">
                    The Caddie will reveal his pick after you submit
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pick history */}
      {myPicks && myPicks.length > 0 && (
        <section>
          <h2 className="font-serif font-semibold text-foreground mb-4">Your Pick History</h2>
          <div className="space-y-3">
            {myPicks.map((pick) => (
              <PickCard key={pick.id} pick={pick} />
            ))}
          </div>
        </section>
      )}

      {myPicks && myPicks.length === 0 && pickableTournaments.length === 0 && (
        <div className="text-center py-12">
          <Target size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif text-foreground mb-2">No picks yet</p>
          <p className="text-muted-foreground text-sm font-mono">
            Picks open when tournaments are scheduled.
          </p>
        </div>
      )}
    </div>
  );
}
