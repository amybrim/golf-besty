import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Trophy, Target, ArrowRight, Newspaper, ExternalLink, Flame } from "lucide-react";
import { motion } from "framer-motion";

const TAG_COLORS: Record<string, string> = {
  Drama: "bg-red-500/10 text-red-600",
  LIV: "bg-brass/10 text-brass",
  Major: "bg-green-mid/10 text-green-mid",
  Injury: "bg-orange-500/10 text-orange-600",
  Comeback: "bg-green-light/10 text-green-light",
  Rivalry: "bg-purple-500/10 text-purple-600",
  PGA: "bg-blue-500/10 text-blue-600",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Home() {
  const { data: tournaments } = trpc.golf.tournaments.useQuery();
  const { data: topStories } = trpc.golf.topStories.useQuery();

  const activeTournament = tournaments?.find((t) => t.status === "in_progress");
  const nextTournament = tournaments?.find((t) => t.status === "upcoming");
  const featured = activeTournament ?? nextTournament;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">

      {/* Birthday Hero — Wally greets Jamie */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl club-header px-8 py-12"
      >
        {/* Background flag watermark */}
        <div className="absolute right-6 top-4 opacity-10 select-none pointer-events-none">
          <span className="text-[120px] leading-none">⛳</span>
        </div>

        <div className="relative z-10">
          {/* Birthday badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass/20 text-brass text-xs font-mono tracking-widest uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brass animate-pulse" />
            Happy 60th, Jamie
          </div>

          <h1 className="text-cream font-serif text-4xl font-bold leading-tight mb-3">
            Hey Jamie.<br />
            <span className="text-brass">Wally's here.</span>
          </h1>

          <p className="text-white/65 text-base leading-relaxed mb-8 max-w-md">
            Your golf best friend. I know everything happening on tour — PGA, LIV, the drama, the gossip, who's hot, who's choking, and what's coming up this week. Let's talk golf.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg brass-badge font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <MessageSquare size={16} />
              Talk to Wally
            </Link>
            <Link
              href="/showdown"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-cream hover:bg-white/15 transition-colors text-sm font-medium"
            >
              <Target size={16} />
              Wally vs Jamie
            </Link>
          </div>
        </div>
      </motion.div>

      {/* This Week in Golf */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-brass" />
              <span className="font-serif font-semibold text-foreground">
                {featured.status === "in_progress" ? "Happening Now" : "Up This Week"}
              </span>
            </div>
            {featured.status === "in_progress" && (
              <span className="flex items-center gap-1.5 text-xs text-green-light font-mono">
                <span className="w-2 h-2 rounded-full bg-green-light animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="brass-divider mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-1">Tournament</div>
              <div className="font-serif font-semibold text-foreground">{featured.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-1">Venue</div>
              <div className="text-foreground text-sm">{featured.venue || "TBD"}</div>
            </div>
            {featured.purse && (
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-1">Purse</div>
                <div className="text-brass font-mono font-semibold">{featured.purse}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wider font-mono mb-1">Location</div>
              <div className="text-foreground text-sm">{[featured.city, featured.state].filter(Boolean).join(", ") || "TBD"}</div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/showdown" className="text-sm text-brass hover:text-brass-dark font-medium flex items-center gap-1 transition-colors">
              Make your call <Target size={14} />
            </Link>
            <Link href="/tournaments" className="text-sm text-green-mid hover:text-green-deep font-medium flex items-center gap-1 transition-colors">
              Leaderboard <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* What Wally's watching — top stories */}
      {topStories && topStories.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-red-500" />
              <h2 className="font-serif font-semibold text-foreground">What Wally's Watching</h2>
            </div>
            <Link href="/feed" className="text-sm text-brass hover:text-brass-dark font-medium flex items-center gap-1 transition-colors">
              Full locker room <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {topStories.slice(0, 4).map((story, i) => (
              <motion.a
                key={story.id}
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="group flex items-start gap-4 bg-card border border-border rounded-xl p-4 hover:border-brass/40 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-score text-xs text-muted-foreground font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-muted-foreground text-xs font-mono">{story.source}</span>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-muted-foreground text-xs font-mono">{timeAgo(story.publishedAt)}</span>
                    {story.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className={`px-1.5 py-0.5 rounded text-xs font-mono ${TAG_COLORS[tag] ?? "bg-muted text-muted-foreground"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-medium text-foreground text-sm leading-snug group-hover:text-green-deep transition-colors line-clamp-2">
                    {story.title}
                  </h3>
                </div>
                <ExternalLink size={13} className="text-muted-foreground/30 group-hover:text-brass transition-colors flex-shrink-0 mt-1" />
              </motion.a>
            ))}
          </div>
        </motion.section>
      )}

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {[
          { href: "/chat", icon: MessageSquare, label: "Talk to Wally", sub: "Ask him anything golf", color: "text-green-mid" },
          { href: "/showdown", icon: Target, label: "Wally vs Jamie", sub: "Call the tournament", color: "text-brass" },
          { href: "/feed", icon: Newspaper, label: "The Locker Room", sub: "Live golf news & drama", color: "text-brass-dark" },
        ].map(({ href, icon: Icon, label, sub, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-brass/40 hover:shadow-sm transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-brass/10 transition-colors">
              <Icon size={18} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm group-hover:text-green-deep transition-colors">{label}</div>
              <div className="text-muted-foreground text-xs">{sub}</div>
            </div>
            <ArrowRight size={14} className="text-muted-foreground/30 group-hover:text-brass group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </motion.div>

      <div className="text-center text-muted-foreground text-xs font-mono border-t border-border pt-5">
        Wally is Jamie's personal golf companion — built with love for his 60th birthday.
      </div>
    </div>
  );
}
