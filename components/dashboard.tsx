"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Gauge,
  Mic,
  PhoneCall,
  Smile,
  Star,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface CallRow {
  id: number
  personaName: string | null
  language: string
  status: string
  startedAt: string
  durationSeconds: number | null
  sentiment: string | null
  overallScore: number | null
  avgLatencyMs: number | null
}

interface Stats {
  totalCalls: number
  completedCalls: number
  totalDuration: number
  avgScore: number
  avgLatency: number
  totalTurns: number
  totalBookings: number
  sentiments: Array<{ sentiment: string; count: number }>
  daily: Array<{ day: string; count: number; avgScore: number }>
  recentCalls: CallRow[]
}

function formatDuration(s: number) {
  if (!s) return "0m"
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${s % 60}s`
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

const SENTIMENT_STYLE: Record<string, string> = {
  positive: "bg-chart-2/15 text-chart-2",
  neutral: "bg-chart-3/15 text-chart-3",
  negative: "bg-destructive/15 text-destructive",
}

export function Dashboard() {
  const { data, isLoading } = useSWR<Stats>("/api/stats", fetcher, {
    refreshInterval: 30_000,
  })

  const daily =
    data?.daily?.map((d) => ({
      ...d,
      label: new Date(d.day + "T00:00:00").toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
    })) ?? []

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI voice agent activity — calls, scores, latency, and bookings.
          </p>
        </div>
        <Button asChild className="gap-2 self-start rounded-full">
          <Link href="/call">
            <Mic className="size-4" />
            Start a Call
          </Link>
        </Button>
      </header>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Calls"
          value={isLoading ? "—" : String(data?.totalCalls ?? 0)}
          sub={`${data?.completedCalls ?? 0} completed`}
          icon={PhoneCall}
        />
        <StatCard
          label="Avg Quality Score"
          value={isLoading ? "—" : data?.avgScore ? `${data.avgScore}/100` : "N/A"}
          sub="AI-scored after each call"
          icon={Star}
        />
        <StatCard
          label="Avg Latency"
          value={isLoading ? "—" : data?.avgLatency ? `${(data.avgLatency / 1000).toFixed(2)}s` : "N/A"}
          sub="voice-to-voice response"
          icon={Gauge}
        />
        <StatCard
          label="Bookings Made"
          value={isLoading ? "—" : String(data?.totalBookings ?? 0)}
          sub={formatDuration(data?.totalDuration ?? 0) + " talk time"}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* calls chart */}
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
          <h2 className="text-sm font-semibold">Calls — last 14 days</h2>
          <div className="mt-4 h-56">
            {daily.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No calls yet. Start your first call to see activity here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="callFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Calls"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#callFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* sentiment */}
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Smile className="size-4 text-primary" />
            Caller Sentiment
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {["positive", "neutral", "negative"].map((s) => {
              const count = data?.sentiments?.find((x) => x.sentiment === s)?.count ?? 0
              const total = data?.sentiments?.reduce((a, b) => a + b.count, 0) || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={s}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{s}</span>
                    <span className="font-mono">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        s === "positive" && "bg-chart-2",
                        s === "neutral" && "bg-chart-3",
                        s === "negative" && "bg-destructive",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {(!data?.sentiments || data.sentiments.length === 0) && (
              <p className="mt-2 text-xs text-muted-foreground">
                Sentiment is analyzed automatically when calls end.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* recent calls */}
      <div className="rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-semibold">Recent Calls</h2>
          <Link
            href="/calls"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        </header>
        {!data?.recentCalls || data.recentCalls.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10">
            <PhoneCall className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No calls yet</p>
            <Button asChild size="sm" variant="outline" className="gap-2 bg-transparent">
              <Link href="/call">
                <Mic className="size-3.5" />
                Make your first call
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.recentCalls.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/calls/${c.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <PhoneCall className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {c.personaName || "Voice Agent"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.startedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {" · "}
                      {c.language === "telugu" ? "Telugu" : "Hinglish"}
                    </p>
                  </div>
                  {c.sentiment && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                        SENTIMENT_STYLE[c.sentiment] || SENTIMENT_STYLE.neutral,
                      )}
                    >
                      {c.sentiment}
                    </span>
                  )}
                  {c.overallScore != null && (
                    <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <Star className="size-3 text-chart-3" />
                      {c.overallScore}
                    </span>
                  )}
                  <span className="hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:flex">
                    <Clock className="size-3" />
                    {formatDuration(c.durationSeconds ?? 0)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
