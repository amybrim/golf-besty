import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Newspaper, ExternalLink, RefreshCw, Flame, Tag } from "lucide-react";
import { motion } from "framer-motion";

const ALL_TAGS = ["All", "Drama", "LPGA", "Major", "Injury", "Comeback", "Rivalry", "PGA", "Off-Course"];

const TAG_COLORS: Record<string, string> = {
  Drama: "bg-red-500/10 text-red-600 border-red-200",
  LPGA: "bg-brass/10 text-brass border-brass/20",
  Major: "bg-green-mid/10 text-green-mid border-green-mid/20",
  Injury: "bg-orange-500/10 text-orange-600 border-orange-200",
  Comeback: "bg-green-light/10 text-green-light border-green-light/20",
  Rivalry: "bg-purple-500/10 text-purple-600 border-purple-200",
  PGA: "bg-blue-500/10 text-blue-600 border-blue-200",
  "Off-Course": "bg-muted text-muted-foreground border-border",
  Golf: "bg-muted text-muted-foreground border-border",
};

function TagBadge({ tag }: { tag: string }) {
  const cls = TAG_COLORS[tag] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono ${cls}`}>
      {tag}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Feed() {
  const [activeTag, setActiveTag] = useState("All");
  const { data: news, isLoading, refetch, isFetching } = trpc.golf.news.useQuery(
    { tag: activeTag, limit: 40 },
    { refetchInterval: 10 * 60 * 1000 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">The Locker Room</h1>
          <p className="text-muted-foreground text-sm font-mono">
            Live golf news · LPGA · Player stories · The talk of the tour
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-brass/40 text-muted-foreground hover:text-foreground transition-all text-sm flex-shrink-0"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
              activeTag === tag
                ? "bg-green-deep text-cream border-green-deep"
                : "border-border text-muted-foreground hover:border-brass/40 hover:text-foreground"
            }`}
          >
            {tag === "Drama" && "🔥 "}
            {tag === "LPGA" && "🏌️‍♀️ "}
            {tag}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!news || news.length === 0) && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Newspaper size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif text-foreground mb-2">No stories right now</p>
          <p className="text-muted-foreground text-sm font-mono">
            {activeTag !== "All"
              ? `No ${activeTag} stories at the moment. Try "All" to see everything.`
              : "Golf news feeds are loading. Check back in a moment."}
          </p>
        </div>
      )}

      {/* News grid */}
      {news && news.length > 0 && (
        <div className="space-y-3">
          {news.map((item, i) => (
            <motion.a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="group block bg-card border border-border rounded-xl p-5 hover:border-brass/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-muted-foreground text-xs font-mono">{item.source}</span>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-muted-foreground text-xs font-mono">{timeAgo(item.publishedAt)}</span>
                    {item.tags.includes("Drama") && (
                      <span className="flex items-center gap-1 text-red-500 text-xs">
                        <Flame size={11} /> Hot
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-semibold text-foreground leading-snug mb-2 group-hover:text-green-deep transition-colors">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {item.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                    <span className="ml-auto flex items-center gap-1 text-muted-foreground/50 group-hover:text-brass transition-colors text-xs">
                      Read <ExternalLink size={11} />
                    </span>
                  </div>
                </div>
                {item.imageUrl && (
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {news && news.length > 0 && (
        <p className="text-center text-muted-foreground text-xs font-mono border-t border-border pt-4">
          Sourced from Golf Channel · Golf Digest · Golf.com · No Laying Up · Golfweek · Updates every 10 minutes
        </p>
      )}
    </div>
  );
}
