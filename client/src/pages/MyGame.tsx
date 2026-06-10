import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Flag, LogIn, Plus, Trophy, TrendingDown, TrendingUp, MessageSquare, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

function ScoreBadge({ score, par }: { score: number; par: number }) {
  const diff = score - par;
  if (diff <= -2) return <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-600 font-mono text-xs font-bold">{diff} Eagle</span>;
  if (diff === -1) return <span className="px-2 py-0.5 rounded bg-green-light/20 text-green-light font-mono text-xs font-bold">-1 Birdie</span>;
  if (diff === 0) return <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">Even</span>;
  if (diff === 1) return <span className="px-2 py-0.5 rounded bg-orange-400/10 text-orange-500 font-mono text-xs">+1 Bogey</span>;
  return <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-mono text-xs">+{diff} Double+</span>;
}

function RoundCard({ round }: { round: any }) {
  const [showWally, setShowWally] = useState(false);
  const diff = round.score - round.par;
  const diffStr = diff === 0 ? "E" : diff > 0 ? `+${diff}` : `${diff}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-serif font-semibold text-foreground">{round.courseName}</div>
          <div className="text-muted-foreground text-xs font-mono mt-0.5">
            {new Date(round.playedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {round.tees && <> · {round.tees} tees</>}
          </div>
          {round.notes && (
            <p className="text-muted-foreground text-xs mt-2 italic leading-relaxed">"{round.notes}"</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-score text-3xl font-bold text-foreground">{round.score}</div>
          <div className="text-muted-foreground text-xs font-mono">par {round.par}</div>
          <div className={`font-score font-bold text-sm mt-0.5 ${diff < 0 ? "text-green-light" : diff === 0 ? "text-muted-foreground" : "text-orange-500"}`}>
            {diffStr}
          </div>
        </div>
      </div>

      {/* Wally's reaction */}
      {round.wallyReaction && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowWally(!showWally)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2 font-mono text-xs">
              <MessageSquare size={13} className="text-brass" />
              What Wally said
            </span>
            <ChevronDown size={14} className={`transition-transform ${showWally ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showWally && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 text-sm text-foreground leading-relaxed">
                  <Streamdown>{round.wallyReaction}</Streamdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default function MyGame() {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [course, setCourse] = useState("");
  const [score, setScore] = useState("");
  const [par, setPar] = useState("72");
  const [tees, setTees] = useState("");
  const [notes, setNotes] = useState("");
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split("T")[0]);

  const { data: rounds, refetch } = trpc.game.myRounds.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const logRound = trpc.game.logRound.useMutation({
    onSuccess: () => {
      toast.success("Round logged. Wally's got thoughts.");
      refetch();
      setShowForm(false);
      setCourse(""); setScore(""); setPar("72"); setTees(""); setNotes("");
      setPlayedAt(new Date().toISOString().split("T")[0]);
    },
    onError: (err: any) => toast.error(err.message ?? "Couldn't log the round."),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full club-header flex items-center justify-center">
          <Flag size={28} className="text-brass" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">My Game</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Log your rounds and Wally will react to every score — good, bad, or ugly.
          </p>
        </div>
        <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg brass-badge font-semibold text-sm hover:opacity-90 transition-opacity">
          <LogIn size={16} /> Sign in to track your game
        </a>
      </div>
    );
  }

  const totalRounds = rounds?.length ?? 0;
  const avgScore = totalRounds > 0
    ? Math.round((rounds!.reduce((s: number, r: any) => s + r.score, 0) / totalRounds) * 10) / 10
    : null;
  const bestRound = totalRounds > 0
    ? rounds!.reduce((best: any, r: any) => r.score - r.par < best.score - best.par ? r : best)
    : null;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">My Game</h1>
          <p className="text-muted-foreground text-sm font-mono">
            Log your rounds. Wally reacts to every single one.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl brass-badge font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex-shrink-0"
        >
          <Plus size={16} />
          Log a round
        </button>
      </div>

      {/* Stats bar */}
      {totalRounds > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="font-score text-2xl font-bold text-foreground mb-0.5">{totalRounds}</div>
            <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Rounds</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="font-score text-2xl font-bold text-foreground mb-0.5">{avgScore ?? "—"}</div>
            <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Avg Score</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            {bestRound ? (
              <>
                <div className="font-score text-2xl font-bold text-green-mid mb-0.5">
                  {bestRound.score - bestRound.par === 0 ? "E" : bestRound.score - bestRound.par > 0 ? `+${bestRound.score - bestRound.par}` : `${bestRound.score - bestRound.par}`}
                </div>
                <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Best Round</div>
              </>
            ) : (
              <>
                <div className="font-score text-2xl font-bold text-muted-foreground mb-0.5">—</div>
                <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Best Round</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Log round form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-brass/30 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Flag size={16} className="text-brass" />
                <span className="font-serif font-semibold text-foreground">Log a Round</span>
              </div>
              <div className="brass-divider" />

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-1.5">Course</label>
                  <input
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    placeholder="e.g. Pebble Beach, Augusta National..."
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-1.5">Score</label>
                  <input
                    type="number"
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    placeholder="e.g. 78"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-1.5">Par</label>
                  <input
                    type="number"
                    value={par}
                    onChange={e => setPar(e.target.value)}
                    placeholder="72"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-1.5">Date Played</label>
                  <input
                    type="date"
                    value={playedAt}
                    onChange={e => setPlayedAt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-brass/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-1.5">Tees (optional)</label>
                  <input
                    value={tees}
                    onChange={e => setTees(e.target.value)}
                    placeholder="e.g. Blue, Championship..."
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-muted-foreground text-xs uppercase tracking-wider font-mono block mb-1.5">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="How'd it go? Wally will react..."
                    rows={2}
                    maxLength={400}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 resize-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!course || !score || !par) { toast.error("Course, score, and par are required."); return; }
                    logRound.mutate({ courseName: course, score: parseInt(score), par: parseInt(par), tees: tees || undefined, notes: notes || undefined, playedAt });
                  }}
                  disabled={logRound.isPending}
                  className="flex-1 py-3 rounded-xl brass-badge font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {logRound.isPending ? "Wally is reacting..." : "Log it — see what Wally thinks →"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-3 rounded-xl border border-border hover:border-brass/40 text-sm text-foreground transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rounds list */}
      {rounds && rounds.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif font-semibold text-foreground">Your Rounds</h2>
          {rounds.map((round: any) => (
            <RoundCard key={round.id} round={round} />
          ))}
        </section>
      ) : !showForm ? (
        <div className="text-center py-14 bg-card border border-border rounded-xl">
          <Flag size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif text-foreground mb-2">No rounds logged yet</p>
          <p className="text-muted-foreground text-sm font-mono mb-5">
            Log your first round and Wally will have something to say about it.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl brass-badge font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Log your first round
          </button>
        </div>
      ) : null}
    </div>
  );
}
