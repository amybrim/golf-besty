import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, Volume2, CheckCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.88;
  utterance.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Alex") || v.name.includes("Google US English"))
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function timeAgo(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function FamilyDrops() {
  const guestId = typeof window !== "undefined" ? (localStorage.getItem("wally_guest_id") ?? undefined) : undefined;
  const { track } = useAnalytics(guestId);
  const utils = trpc.useUtils();
  const { data: drops, isLoading } = trpc.family.all.useQuery();

  useEffect(() => { track("page_view", { page: "/family" }); }, []);
  const unreadCount = drops?.filter((d) => !d.isRead).length ?? 0;

  const dropMutation = trpc.family.drop.useMutation({
    onSuccess: () => {
      utils.family.all.invalidate();
      setFromName("");
      setMessage("");
      setShowForm(false);
      toast.success("Your message is waiting for Jamie inside Wally.");
    },
    onError: (e) => toast.error(e.message),
  });

  const markRead = trpc.family.markRead.useMutation({
    onSuccess: () => utils.family.all.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart size={18} className="text-red-500" />
            <h1 className="font-serif text-2xl font-bold text-foreground">From the Family</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-xs font-mono font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Leave Jamie a message. He'll find it here when he opens Wally.</p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="brass-badge text-sm font-semibold flex items-center gap-1.5"
          size="sm"
        >
          <Send size={13} />
          Leave a Message
        </Button>
      </div>

      {/* Drop form — no login required */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-brass/30 rounded-xl p-5 space-y-4"
          >
            <div className="brass-divider" />
            <p className="text-sm text-muted-foreground italic font-serif">
              No sign-in needed. Just leave your name and your message — Jamie will see it here.
            </p>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">Your Name</label>
              <input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="e.g. Amy, Mom, The guys from the club..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brass/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write anything. A memory, a joke, a golf story, a love note. Jamie will read it here."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brass/50 transition-colors resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-muted-foreground">
                Cancel
              </Button>
              <Button
                size="sm"
                className="brass-badge text-sm font-semibold"
                disabled={!fromName.trim() || !message.trim() || dropMutation.isPending}
                onClick={() => dropMutation.mutate({ fromName: fromName.trim(), message: message.trim() })}
              >
                {dropMutation.isPending ? "Sending..." : "Send to Jamie"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : !drops || drops.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mail size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No messages yet. Be the first to leave one for Jamie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {drops.map((drop, i) => (
              <motion.div
                key={drop.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`group bg-card border rounded-xl p-5 transition-all ${
                  !drop.isRead ? "border-brass/40 shadow-sm" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brass/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-brass font-serif font-bold text-sm">
                        {drop.fromName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground text-sm">{drop.fromName}</span>
                      <span className="text-muted-foreground text-xs font-mono ml-2">{timeAgo(drop.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!drop.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brass animate-pulse" title="Unread" />
                    )}
                    {"speechSynthesis" in window && (
                      <button
                        onClick={() => { track("family_drop_played", { label: drop.fromName }); speakText(`Message from ${drop.fromName}: ${drop.message}`); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-brass transition-all"
                        title="Read aloud"
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                    {!drop.isRead && (
                      <button
                        onClick={() => markRead.mutate({ id: drop.id })}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-green-mid transition-all"
                        title="Mark as read"
                      >
                        <CheckCheck size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-foreground text-sm leading-relaxed font-serif italic">"{drop.message}"</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
