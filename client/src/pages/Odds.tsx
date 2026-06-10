import { trpc } from "@/lib/trpc";
import { TrendingUp, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

function ProbabilityBar({ probability, rank }: { probability: number; rank: number }) {
  const colors = [
    "from-brass to-brass-dark",
    "from-green-mid to-green-deep",
    "from-green-light to-green-mid",
  ];
  const colorClass = colors[Math.min(rank, colors.length - 1)];
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(probability, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
        />
      </div>
      <span className="font-score font-semibold text-sm text-foreground w-12 text-right">
        {probability.toFixed(1)}%
      </span>
    </div>
  );
}

export default function Odds() {
  const { data: markets, isLoading, refetch, isFetching } = trpc.golf.polymarketOdds.useQuery(
    undefined,
    { refetchInterval: 5 * 60 * 1000 }
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">Market Odds</h1>
          <p className="text-muted-foreground text-sm font-mono">
            Real prediction market probabilities from Polymarket
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-brass/40 text-muted-foreground hover:text-foreground transition-all text-sm"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-xl p-4">
        <AlertCircle size={16} className="text-brass flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">For reference only.</span> These are real Polymarket prediction market probabilities — crowd-sourced odds reflecting what traders believe. This app does not facilitate any betting or wagering. All picks on Golf Besty are for bragging rights only.
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!markets || markets.length === 0) && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <TrendingUp size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif text-foreground mb-2">No active golf markets right now</p>
          <p className="text-muted-foreground text-sm font-mono">
            Polymarket golf markets appear around major tournaments.
          </p>
          <a
            href="https://polymarket.com/predictions/golf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-brass hover:text-brass-dark transition-colors"
          >
            View on Polymarket <ExternalLink size={13} />
          </a>
        </div>
      )}

      {markets && markets.length > 0 && (
        <div className="space-y-6">
          {markets.map((market, mi) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mi * 0.06 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif font-semibold text-foreground text-lg leading-tight mb-2">
                      {market.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-mono">
                      {market.volume > 0 && (
                        <span>Vol: ${market.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      )}
                      {market.liquidity > 0 && (
                        <span>Liq: ${market.liquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      )}
                      {market.endDate && (
                        <span>Ends: {new Date(market.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <a
                    href={market.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-brass/40 text-muted-foreground hover:text-brass transition-all text-xs font-mono flex-shrink-0"
                  >
                    Polymarket <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {market.outcomes.slice(0, 8).map((outcome, oi) => (
                  <div key={oi} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground font-medium">{outcome.name}</span>
                    </div>
                    <ProbabilityBar probability={outcome.probability} rank={oi} />
                  </div>
                ))}
                {market.outcomes.length > 8 && (
                  <p className="text-muted-foreground text-xs font-mono pt-1">
                    +{market.outcomes.length - 8} more outcomes on Polymarket
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="text-center text-muted-foreground text-xs font-mono border-t border-border pt-6">
        Data sourced from{" "}
        <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="text-brass hover:underline">
          Polymarket
        </a>{" "}
        via public Gamma API · Refreshes every 5 minutes · Not financial advice
      </div>
    </div>
  );
}
