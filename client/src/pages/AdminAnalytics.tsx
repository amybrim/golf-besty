import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ── Helpers ──────────────────────────────────────────────────────────────────

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12am";
  if (i < 12) return `${i}am`;
  if (i === 12) return "12pm";
  return `${i - 12}pm`;
});

const FEATURE_COLORS: Record<string, string> = {
  "Voice Aid — Phrase Tap": "bg-emerald-500",
  "Voice Aid — Typed & Spoke": "bg-emerald-400",
  "Voice Aid — Say Again": "bg-emerald-300",
  "Chat — Message Sent": "bg-blue-500",
  "Morning Briefing — Opened": "bg-amber-500",
  "Morning Briefing — Skipped": "bg-amber-300",
  "Showdown — Pick Made": "bg-purple-500",
  "Showdown — Pick Changed": "bg-purple-400",
  "Family Drops — Played": "bg-pink-500",
  "Family Drops — Received": "bg-pink-400",
  "Trivia — Answered": "bg-orange-500",
  "My Game — Round Logged": "bg-teal-500",
  "Memory Keeper — Added": "bg-indigo-500",
  "Page Views": "bg-slate-400",
};

function getBarColor(label: string) {
  return FEATURE_COLORS[label] ?? "bg-slate-400";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureBar({ label, total, max }: { label: string; total: number; max: number }) {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium truncate max-w-[70%]">{label}</span>
        <span className="text-muted-foreground font-mono">{total.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(label)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; total: number }[] }) {
  const hourMap = new Map(data.map((d) => [d.hour, d.total]));
  const maxVal = Math.max(...Array.from(hourMap.values()), 1);

  return (
    <div className="flex items-end gap-[2px] h-24 w-full">
      {HOUR_LABELS.map((label, i) => {
        const val = hourMap.get(i) ?? 0;
        const heightPct = Math.round((val / maxVal) * 100);
        const isActive = val > 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="w-full flex items-end" style={{ height: "80px" }}>
              <div
                className={`w-full rounded-sm transition-all duration-300 ${isActive ? "bg-emerald-500" : "bg-muted"}`}
                style={{ height: `${Math.max(heightPct, isActive ? 4 : 2)}%` }}
              />
            </div>
            {/* Tooltip on hover */}
            {isActive && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {label}: {val}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const { data, isLoading, error } = trpc.analytics.dashboard.useQuery(undefined, {
    refetchInterval: 60_000, // refresh every minute
  });

  const totalEvents = data?.features.reduce((sum, f) => sum + f.total, 0) ?? 0;
  const voiceAidTotal = data?.features
    .filter((f) => f.label.startsWith("Voice Aid"))
    .reduce((sum, f) => sum + f.total, 0) ?? 0;
  const chatTotal = data?.features.find((f) => f.event === "chat_message_sent")?.total ?? 0;
  const showdownTotal = data?.features.find((f) => f.event === "showdown_pick_made")?.total ?? 0;
  const maxFeature = data?.features[0]?.total ?? 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Wally Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              How Jamie is using the app — updated in real time
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Private dashboard
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Tracking transparency note */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <span className="font-semibold">Note visible to Jamie in the app:</span>{" "}
          "Amy added this so I can see what's helping you most and build you more of it." — No
          personal data is sold or shared. This is just Amy watching out for you.
        </div>

        {/* Summary cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-bold text-foreground">{totalEvents.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Total interactions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-bold text-emerald-600">{voiceAidTotal.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Voice Aid uses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-bold text-blue-600">{chatTotal.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Wally chat messages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-bold text-purple-600">{showdownTotal.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Showdown picks made</div>
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Could not load analytics data. Check back in a moment.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Feature usage ranked */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Features — Most to Least Used</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading
                ? [...Array(8)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)
                : data?.features.length === 0
                ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No events tracked yet. Jamie will generate data as he uses the app.
                  </p>
                )
                : data?.features
                    .filter((f) => f.event !== "page_view")
                    .map((f) => (
                      <FeatureBar key={f.event} label={f.label} total={f.total} max={maxFeature} />
                    ))}
            </CardContent>
          </Card>

          {/* Top Voice Aid phrases */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Voice Aid — Most Used Phrases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading
                ? [...Array(8)].map((_, i) => <Skeleton key={i} className="h-6 rounded" />)
                : data?.topPhrases.length === 0
                ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No phrase taps recorded yet.
                  </p>
                )
                : data?.topPhrases.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                        {i + 1}.
                      </span>
                      <span className="text-sm text-foreground truncate">{p.label}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                      {p.total}×
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Hourly activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity by Hour of Day (UTC)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Shows when Jamie is most active — useful for timing morning briefings and check-ins
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 rounded" />
            ) : (
              <>
                <HourlyChart data={data?.hourly ?? []} />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
                  <span>12am</span>
                  <span>6am</span>
                  <span>12pm</span>
                  <span>6pm</span>
                  <span>11pm</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Page views breakdown */}
        {data?.features.find((f) => f.event === "page_view") && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Page Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {data.features.find((f) => f.event === "page_view")?.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All pages combined since tracking began
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
