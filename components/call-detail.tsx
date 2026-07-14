"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Clock,
  Gauge,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Turn {
  id: number
  speaker: string
  content: string
  latencyMs: number | null
  createdAt: string
}

interface CallDetailData {
  id: number
  personaName: string | null
  language: string
  status: string
  startedAt: string
  durationSeconds: number | null
  summary: string | null
  sentiment: string | null
  overallScore: number | null
  scoreBreakdown: {
    communication?: number
    helpfulness?: number
    resolution?: number
    engagement?: number
    key_points?: string[]
  } | null
  avgLatencyMs: number | null
  turnCount: number
  turns: Turn[]
  error?: string
}

const SENTIMENT_STYLE: Record<string, string> = {
  positive: "bg-chart-2/15 text-chart-2",
  neutral: "bg-chart-3/15 text-chart-3",
  negative: "bg-destructive/15 text-destructive",
}

const BREAKDOWN_LABELS: Array<[key: string, label: string]> = [
  ["communication", "Communication"],
  ["helpfulness", "Helpfulness"],
  ["resolution", "Resolution"],
  ["engagement", "Engagement"],
]

function formatDuration(s: number | null) {
  if (!s) return "—"
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

export function CallDetail({ id }: { id: string }) {
  const { data: call, isLoading, mutate } = useSWR<CallDetailData>(`/api/calls/${id}`, fetcher, {
    refreshInterval: (latest) =>
      latest && latest.status === "completed" && latest.overallScore == null ? 4000 : 0,
  })
  const [analyzing, setAnalyzing] = useState(false)

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      await fetch(`/api/calls/${id}/analyze`, { method: "POST" })
      await mutate()
    } finally {
      setAnalyzing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    )
  }

  if (!call || call.error) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 p-12">
        <p className="text-sm text-muted-foreground">Call not found.</p>
        <Button asChild variant="outline" className="gap-2 bg-transparent">
          <Link href="/calls">
            <ArrowLeft className="size-4" />
            Back to Call History
          </Link>
        </Button>
      </div>
    )
  }

  const breakdown = call.scoreBreakdown

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/calls"
          className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Call History
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <PhoneCall className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {call.personaName || "Voice Agent"} — Call #{call.id}
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date(call.startedAt).toLocaleString("en-IN", {
                dateStyle: "full",
                timeStyle: "short",
              })}
              {" · "}
              {call.language === "telugu" ? "Telugu" : "Hinglish"}
            </p>
          </div>
          {call.sentiment && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                SENTIMENT_STYLE[call.sentiment] || SENTIMENT_STYLE.neutral,
              )}
            >
              {call.sentiment}
            </span>
          )}
        </div>
      </header>

      {/* metric strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> Duration
          </p>
          <p className="mt-1 font-mono text-lg font-semibold">{formatDuration(call.durationSeconds)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" /> Turns
          </p>
          <p className="mt-1 font-mono text-lg font-semibold">{call.turnCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="size-3.5" /> Avg Latency
          </p>
          <p className="mt-1 font-mono text-lg font-semibold">
            {call.avgLatencyMs != null ? `${(call.avgLatencyMs / 1000).toFixed(2)}s` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="size-3.5" /> Quality Score
          </p>
          <p className="mt-1 font-mono text-lg font-semibold">
            {call.overallScore != null ? `${call.overallScore}/100` : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* transcript */}
        <div className="rounded-xl border border-border bg-card lg:col-span-3">
          <header className="border-b border-border p-4">
            <h2 className="text-sm font-semibold">Transcript</h2>
          </header>
          <div className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto p-4">
            {call.turns.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No transcript was recorded for this call.
              </p>
            ) : (
              call.turns.map((t) => (
                <div key={t.id} className={cn("flex", t.speaker === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                      t.speaker === "user"
                        ? "bg-primary/15 text-foreground"
                        : "border border-border bg-background",
                    )}
                  >
                    <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t.speaker === "user" ? "Caller" : "Agent"}
                      {t.latencyMs != null && (
                        <span className="flex items-center gap-0.5 font-mono normal-case">
                          <Gauge className="size-2.5" />
                          {(t.latencyMs / 1000).toFixed(2)}s
                        </span>
                      )}
                    </p>
                    {t.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* analysis */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <header className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-primary" />
                AI Analysis
              </h2>
              {call.turns.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={runAnalysis}
                  disabled={analyzing}
                >
                  <RefreshCw className={cn("size-3", analyzing && "animate-spin")} />
                  {call.overallScore != null ? "Re-analyze" : "Analyze"}
                </Button>
              )}
            </header>
            {call.summary ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{call.summary}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {analyzing
                  ? "Analyzing the transcript..."
                  : call.turns.length === 0
                    ? "Analysis needs a recorded transcript."
                    : "Analysis runs automatically after a call ends. You can also trigger it manually."}
              </p>
            )}
          </div>

          {breakdown && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Score Breakdown</h2>
              <div className="mt-3 flex flex-col gap-3">
                {BREAKDOWN_LABELS.map(([key, label]) => {
                  const v = Number(breakdown[key as keyof typeof breakdown] ?? 0)
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono">{v}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            v >= 70 ? "bg-chart-2" : v >= 40 ? "bg-chart-3" : "bg-destructive",
                          )}
                          style={{ width: `${Math.min(100, v)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {breakdown.key_points && breakdown.key_points.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Key moments</p>
                  <ul className="flex flex-col gap-1.5">
                    {breakdown.key_points.map((k, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
