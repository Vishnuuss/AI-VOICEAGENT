"use client"

import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock, Gauge, Mic, PhoneCall, Star } from "lucide-react"

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
  turnCount: number
  summary: string | null
}

const SENTIMENT_STYLE: Record<string, string> = {
  positive: "bg-chart-2/15 text-chart-2",
  neutral: "bg-chart-3/15 text-chart-3",
  negative: "bg-destructive/15 text-destructive",
}

function formatDuration(s: number | null) {
  if (!s) return "—"
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

export function CallHistory() {
  const { data: calls, isLoading } = useSWR<CallRow[]>("/api/calls", fetcher)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Call History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every call with full transcript, AI summary, and quality score.
          </p>
        </div>
        <Button asChild className="gap-2 self-start rounded-full">
          <Link href="/call">
            <Mic className="size-4" />
            New Call
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : !calls || calls.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-12">
          <PhoneCall className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No calls recorded yet</p>
          <Button asChild size="sm" variant="outline" className="gap-2 bg-transparent">
            <Link href="/call">
              <Mic className="size-3.5" />
              Start your first call
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {calls.map((c) => (
            <li key={c.id}>
              <Link
                href={`/calls/${c.id}`}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <PhoneCall className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.personaName || "Voice Agent"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.startedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {" · "}
                      {c.language === "telugu" ? "Telugu" : "Hinglish"}
                      {" · "}
                      {c.turnCount} turns
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
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px]">
                      <Star className="size-3 text-chart-3" />
                      {c.overallScore}/100
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDuration(c.durationSeconds)}
                  </span>
                  {c.avgLatencyMs != null && (
                    <span className="hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:flex">
                      <Gauge className="size-3" />
                      {(c.avgLatencyMs / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
                {c.summary && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{c.summary}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
