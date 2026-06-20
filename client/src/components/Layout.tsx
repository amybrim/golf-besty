import { Link, useLocation } from "wouter";
import {
  MessageSquare,
  Trophy,
  TrendingUp,
  Target,
  Flag,
  Menu,
  X,
  Newspaper,
  Brain,
  HelpCircle,
  Heart,
  Volume2,
  BarChart2,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/", label: "Home", icon: Flag },
  { path: "/chat", label: "Talk to Wally", icon: MessageSquare },
  { path: "/showdown", label: "Wally vs Jamie", icon: Target },
  { path: "/feed", label: "The Locker Room", icon: Newspaper },
  { path: "/tournaments", label: "Tournaments", icon: Trophy },
  { path: "/mygame", label: "My Game", icon: Flag },
  { path: "/trivia", label: "Golf Trivia", icon: HelpCircle },
  { path: "/memory", label: "Wally's Memory", icon: Brain },
  { path: "/family", label: "From the Family", icon: Heart },
  { path: "/voice-aid", label: "Voice Aid", icon: Volume2 },
  { path: "/odds", label: "Market Odds", icon: TrendingUp },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full brass-badge flex items-center justify-center text-lg font-bold font-serif">
            W
          </div>
          <div>
            <div className="text-cream font-serif font-bold text-xl leading-tight">Wally</div>
            <div className="text-white/40 text-xs font-mono tracking-widest uppercase">
              Jamie's Golf Bestie
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location === path;
          return (
            <Link
              key={path}
              href={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 group ${
                active
                  ? "bg-white/10 text-cream"
                  : "text-white/60 hover:bg-white/5 hover:text-cream"
              }`}
            >
              <Icon
                size={18}
                className={`transition-colors ${active ? "text-brass" : "text-white/40 group-hover:text-brass"}`}
              />
              <span className="text-sm font-medium">{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brass" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Brass divider */}
      <div className="mx-6 brass-divider opacity-30" />

      {/* Clubhouse tagline + Amy's note */}
      <div className="px-6 py-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brass animate-pulse" />
          <span className="text-white/40 text-xs font-mono tracking-wider">Jamie's Clubhouse</span>
        </div>
        <p className="text-white/30 text-[11px] leading-relaxed">
          Amy added this so I can see what's helping you most and build you more of it. 💛
        </p>
        <Link
          href="/admin/analytics"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 mt-2 text-white/20 hover:text-white/50 transition-colors group"
        >
          <BarChart2 size={12} className="group-hover:text-brass/60" />
          <span className="text-[10px] font-mono tracking-wider">Amy's Dashboard</span>
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-cream">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 club-header flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 club-header flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full brass-badge flex items-center justify-center text-sm font-bold font-serif">
            W
          </div>
          <span className="text-cream font-serif font-bold text-lg">Wally</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-cream/70 hover:text-cream p-1"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-30 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 club-header"
            >
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
