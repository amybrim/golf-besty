import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// ── Helpers ───────────────────────────────────────────────────────────────────

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12a";
  if (i < 12) return `${i}a`;
  if (i === 12) return "12p";
  return `${i - 12}p`;
});

const CATEGORY_COLORS: Record<string, string> = {
  "Communication (Voice Aid)": "#10b981",
  "Family Connection": "#ec4899",
  "Wally Chat": "#3b82f6",
  "Golf — Showdown": "#8b5cf6",
  "Golf — Trivia": "#f97316",
  "Golf — My Game": "#14b8a6",
  "Morning Briefing": "#f59e0b",
  "Memory Keeper": "#6366f1",
  "Other": "#94a3b8",
};

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Chart Components ──────────────────────────────────────────────────────────

function DailyTrendChart({
  data,
  voiceAid,
}: {
  data: { day: string; total: number }[];
  voiceAid: { day: string; total: number }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const voiceMap = new Map(voiceAid.map((d) => [d.day, d.total]));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No activity yet — data will appear here as Jamie uses the app.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-28 w-full">
        {data.map((d) => {
          const totalPct = Math.round((d.total / maxVal) * 100);
          const vaPct = Math.round(((voiceMap.get(d.day) ?? 0) / maxVal) * 100);
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div className="w-full flex flex-col justify-end" style={{ height: "96px" }}>
                {/* Total bar */}
                <div
                  className="w-full rounded-t-sm bg-slate-200 dark:bg-slate-700 relative overflow-hidden"
                  style={{ height: `${Math.max(totalPct, 2)}%` }}
                >
                  {/* Voice Aid overlay */}
                  {vaPct > 0 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-sm"
                      style={{ height: `${Math.round((vaPct / totalPct) * 100)}%` }}
                    />
                  )}
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                <div className="font-medium">{formatDate(d.day)}</div>
                <div>{d.total} total · {voiceMap.get(d.day) ?? 0} voice aid</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* X-axis labels — show every ~5th */}
      <div className="flex items-center gap-1 w-full">
        {data.map((d, i) => (
          <div key={d.day} className="flex-1 text-center">
            {(i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) && (
              <span className="text-[9px] text-muted-foreground">{formatDate(d.day)}</span>
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
          Total interactions
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          Voice Aid
        </div>
      </div>
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; total: number }[] }) {
  const hourMap = new Map(data.map((d) => [d.hour, d.total]));
  const maxVal = Math.max(...Array.from(hourMap.values()), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[2px] h-20 w-full">
        {HOUR_LABELS.map((label, i) => {
          const val = hourMap.get(i) ?? 0;
          const heightPct = Math.round((val / maxVal) * 100);
          const isActive = val > 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div className="w-full flex items-end" style={{ height: "72px" }}>
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${isActive ? "bg-blue-500" : "bg-muted"}`}
                  style={{ height: `${Math.max(heightPct, isActive ? 4 : 2)}%` }}
                />
              </div>
              {isActive && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {label}: {val}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
      </div>
    </div>
  );
}

function CategoryDonut({ data }: { data: { category: string; total: number }[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = Math.round((d.total / total) * 100);
        const color = CATEGORY_COLORS[d.category] ?? "#94a3b8";
        return (
          <div key={d.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-foreground truncate">{d.category}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-muted-foreground text-xs font-mono">{d.total}</span>
                <span className="text-muted-foreground text-xs w-8 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Patient Report (printable) ────────────────────────────────────────────────

type DashboardData = {
  features: { event: string; label: string; total: number }[];
  topPhrases: { label: string; total: number }[];
  hourly: { hour: number; total: number }[];
  daily: { day: string; total: number }[];
  dailyVoiceAid: { day: string; total: number }[];
  categories: { category: string; total: number }[];
};

function PatientReport({
  data,
  onClose,
}: {
  data: DashboardData;
  onClose: () => void;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const totalEvents = data.features.reduce((s, f) => s + f.total, 0);
  const voiceAidTotal = data.features
    .filter((f) => f.label.startsWith("Voice Aid"))
    .reduce((s, f) => s + f.total, 0);
  const chatTotal = data.features.find((f) => f.event === "chat_message_sent")?.total ?? 0;
  const activeDays = data.daily.filter((d) => d.total > 0).length;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="max-w-3xl mx-auto px-8 py-10 print:py-6">
        {/* Print controls — hidden when printing */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Button variant="outline" onClick={onClose}>← Back to Dashboard</Button>
          <Button onClick={() => window.print()}>Print / Save as PDF</Button>
        </div>

        {/* Report header */}
        <div className="border-b pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Patient Engagement Report</h1>
              <p className="text-muted-foreground mt-1">Wally — AI-Assisted Communication & Engagement Tool</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Generated: {today}</div>
              <div className="mt-1">
                <Badge variant="outline">Confidential</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Patient context */}
        <div className="mb-8 rounded-lg border bg-muted/30 p-5">
          <h2 className="font-semibold text-foreground mb-3">About This Tool</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Wally is a personalized AI companion application designed for patients with communication
            challenges. It wraps evidence-based AAC (Augmentative and Alternative Communication) tools
            — including a Voice Aid board, quick-phrase bank, and text-to-speech output — inside a
            familiar, interest-driven interface (golf). The goal is to reduce the social and emotional
            friction of using assistive communication tools by embedding them in something the patient
            genuinely loves.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            This report documents observed usage patterns, providing objective data on patient
            engagement, communication tool adoption, and feature preference over time.
          </p>
        </div>

        {/* Key metrics */}
        <h2 className="font-semibold text-foreground mb-4">Usage Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Interactions", value: totalEvents.toLocaleString(), color: "text-foreground" },
            { label: "Voice Aid Uses", value: voiceAidTotal.toLocaleString(), color: "text-emerald-600" },
            { label: "Chat Messages", value: chatTotal.toLocaleString(), color: "text-blue-600" },
            { label: "Active Days", value: activeDays.toString(), color: "text-purple-600" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border bg-card p-4 text-center">
              <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Feature usage */}
        <h2 className="font-semibold text-foreground mb-4">Feature Engagement (Ranked)</h2>
        <div className="rounded-lg border bg-card p-5 mb-8">
          {data.features.filter((f) => f.event !== "page_view").length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No feature interactions recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {data.features
                .filter((f) => f.event !== "page_view")
                .map((f, i) => {
                  const max = data.features.filter((f) => f.event !== "page_view")[0]?.total ?? 1;
                  const pct = Math.round((f.total / max) * 100);
                  return (
                    <div key={f.event} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-5 text-right text-xs">{i + 1}.</span>
                          <span className="font-medium text-foreground">{f.label}</span>
                        </div>
                        <span className="font-mono text-muted-foreground text-xs">{f.total.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <h2 className="font-semibold text-foreground mb-4">Usage by Category</h2>
        <div className="rounded-lg border bg-card p-5 mb-8">
          <CategoryDonut data={data.categories} />
        </div>

        {/* Top Voice Aid phrases */}
        {data.topPhrases.length > 0 && (
          <>
            <h2 className="font-semibold text-foreground mb-4">Most-Used Voice Aid Phrases</h2>
            <div className="rounded-lg border bg-card p-5 mb-8">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {data.topPhrases.slice(0, 20).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm border-b border-muted/50 pb-1">
                    <span className="text-foreground">{p.label}</span>
                    <Badge variant="secondary" className="font-mono text-xs">{p.total}×</Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Clinical observations */}
        <h2 className="font-semibold text-foreground mb-4">Observations & Notes</h2>
        <div className="rounded-lg border bg-card p-5 mb-8 min-h-[120px]">
          <p className="text-sm text-muted-foreground italic">
            [Space for clinician or caregiver notes — print and complete by hand, or add before printing.]
          </p>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-xs text-muted-foreground">
          <p>This report was generated by Wally, a personalized AI companion application. Usage data is collected
          with patient awareness and stored securely. No personally identifiable health information is included.
          Data is used solely to improve the patient's experience and inform care decisions.</p>
          <p className="mt-2">Report generated: {today} · Wally by Amy Brim</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const [showReport, setShowReport] = useState(false);
  const { data, isLoading, error } = trpc.analytics.dashboard.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const totalEvents = data?.features.reduce((sum, f) => sum + f.total, 0) ?? 0;
  const voiceAidTotal = data?.features
    .filter((f) => f.label.startsWith("Voice Aid"))
    .reduce((sum, f) => sum + f.total, 0) ?? 0;
  const chatTotal = data?.features.find((f) => f.event === "chat_message_sent")?.total ?? 0;
  const activeDays = data?.daily.filter((d: { day: string; total: number }) => d.total > 0).length ?? 0;

  if (showReport && data) {
    return <PatientReport data={data} onClose={() => setShowReport(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Wally — Usage Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              How Jamie is using the app · Updated every minute
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">Private</Badge>
            {data && (
              <Button size="sm" onClick={() => setShowReport(true)}>
                Patient Report →
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Tracking transparency note */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <span className="font-semibold">Transparency note visible to Jamie:</span>{" "}
          "Amy added this so I can see what's helping you most and build you more of it." — No personal data is sold or shared.
        </div>

        {/* Summary cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
                <div className="text-3xl font-bold text-purple-600">{activeDays}</div>
                <div className="text-xs text-muted-foreground mt-1">Active days tracked</div>
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Could not load analytics data. Check back in a moment.
          </div>
        )}

        {/* Daily trend chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daily Activity — Last 30 Days</CardTitle>
            <p className="text-xs text-muted-foreground">
              Grey = all interactions · Green = Voice Aid uses
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 rounded" />
            ) : (
              <DailyTrendChart data={data?.daily ?? []} voiceAid={data?.dailyVoiceAid ?? []} />
            )}
          </CardContent>
        </Card>

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
                    No events yet. Data appears as Jamie uses the app.
                  </p>
                )
                : data?.features
                    .filter((f) => f.event !== "page_view")
                    .map((f) => {
                      const max = data.features.filter((f) => f.event !== "page_view")[0]?.total ?? 1;
                      const pct = Math.round((f.total / max) * 100);
                      return (
                        <div key={f.event} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground font-medium truncate max-w-[70%]">{f.label}</span>
                            <span className="text-muted-foreground font-mono text-xs">{f.total.toLocaleString()}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Usage by Category</CardTitle>
              <p className="text-xs text-muted-foreground">Communication vs Golf vs Social</p>
            </CardHeader>
            <CardContent>
              {isLoading
                ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 rounded mb-2" />)
                : <CategoryDonut data={data?.categories ?? []} />}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
                      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
                      <span className="text-sm text-foreground truncate">{p.label}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">{p.total}×</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Hourly activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activity by Hour of Day</CardTitle>
              <p className="text-xs text-muted-foreground">
                When Jamie is most active — useful for timing check-ins
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 rounded" />
              ) : (
                <HourlyChart data={data?.hourly ?? []} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient Report CTA */}
        {data && totalEvents > 0 && (
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
            <CardContent className="pt-5 pb-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-foreground">Ready to share with an organization?</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Generate a clean, printable Patient Report — formatted for hospitals, rehab programs, and assistive tech organizations.
                </div>
              </div>
              <Button onClick={() => setShowReport(true)} className="shrink-0">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
