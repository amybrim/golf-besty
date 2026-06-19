import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useGuestId } from "@/hooks/useGuestId";
import { useAnalytics } from "@/hooks/useAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Plus, Trash2, MapPin, Zap, User, FileText, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Category = "course" | "moment" | "player" | "note" | "bucket_list";

const CATEGORIES: { value: Category; label: string; icon: React.ElementType; color: string }[] = [
  { value: "course", label: "Course", icon: MapPin, color: "text-green-mid" },
  { value: "moment", label: "Moment", icon: Zap, color: "text-brass" },
  { value: "player", label: "Player", icon: User, color: "text-blue-500" },
  { value: "note", label: "Note", icon: FileText, color: "text-muted-foreground" },
  { value: "bucket_list", label: "Bucket List", icon: Flag, color: "text-red-500" },
];

function CategoryIcon({ category, size = 14 }: { category: Category; size?: number }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  if (!cat) return null;
  const Icon = cat.icon;
  return <Icon size={size} className={cat.color} />;
}

export default function Memory() {
  const guestId = useGuestId();
  const { track } = useAnalytics(guestId ?? undefined);
  const utils = trpc.useUtils();

  useEffect(() => { track("page_view", { page: "/memory" }); }, []);
  const { data: memories, isLoading } = trpc.memory.list.useQuery(
    { guestId },
    { enabled: !!guestId }
  );

  const addMemory = trpc.memory.add.useMutation({
    onSuccess: () => {
      track("memory_added");
      utils.memory.list.invalidate();
      setTitle("");
      setContent("");
      setShowForm(false);
      toast.success("Wally will remember that.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMemory = trpc.memory.delete.useMutation({
    onSuccess: () => {
      utils.memory.list.invalidate();
      toast.success("Memory removed.");
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<Category>("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "all">("all");

  const filtered = memories?.filter((m) => filterCat === "all" || m.category === filterCat) ?? [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={18} className="text-brass" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Wally's Memory</h1>
          </div>
          <p className="text-muted-foreground text-sm">Tell Wally what matters to you. He'll bring it up in conversation.</p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="brass-badge text-sm font-semibold flex items-center gap-1.5"
          size="sm"
        >
          <Plus size={14} />
          Add Memory
        </Button>
      </div>

      {/* Add form */}
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
            {/* Category picker */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                        category === cat.value
                          ? "bg-brass/15 border-brass/40 text-brass"
                          : "border-border text-muted-foreground hover:border-brass/20"
                      }`}
                    >
                      <Icon size={11} className={category === cat.value ? "text-brass" : cat.color} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Title */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === "course" ? "e.g. Pebble Beach" :
                  category === "moment" ? "e.g. Eagle on 18 at Augusta" :
                  category === "player" ? "e.g. Rory McIlroy" :
                  category === "bucket_list" ? "e.g. Play St Andrews" :
                  "e.g. My swing thought"
                }
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brass/50 transition-colors"
              />
            </div>
            {/* Content */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">Details</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Tell Wally more about this..."
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
                disabled={!title.trim() || !content.trim() || addMemory.isPending}
                onClick={() => addMemory.mutate({ category, title: title.trim(), content: content.trim(), guestId })}
              >
                {addMemory.isPending ? "Saving..." : "Save to Wally"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
            filterCat === "all" ? "bg-green-deep text-cream border-green-deep" : "border-border text-muted-foreground hover:border-brass/30"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCat(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                filterCat === cat.value ? "bg-green-deep text-cream border-green-deep" : "border-border text-muted-foreground hover:border-brass/30"
              }`}
            >
              <Icon size={11} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Memory list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Brain size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No memories yet. Tell Wally something worth remembering.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((mem, i) => (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-card border border-border rounded-xl p-4 hover:border-brass/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CategoryIcon category={mem.category as Category} size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">{mem.title}</span>
                      <span className="text-xs font-mono text-muted-foreground/60 capitalize">
                        {CATEGORIES.find((c) => c.value === mem.category)?.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{mem.content}</p>
                  </div>
                  <button
                    onClick={() => deleteMemory.mutate({ id: mem.id, guestId })}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                    title="Remove memory"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
