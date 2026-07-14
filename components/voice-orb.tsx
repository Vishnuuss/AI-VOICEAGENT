"use client"

import { cn } from "@/lib/utils"
import type { AgentState } from "@/hooks/use-voice-agent"

export function VoiceOrb({ state, level }: { state: AgentState; level: number }) {
  const active = state !== "idle"
  const scale = 1 + Math.min(level, 1) * 0.35

  return (
    <div className="relative flex size-48 items-center justify-center md:size-56" aria-hidden="true">
      {/* expanding rings while speaking/listening */}
      {(state === "speaking" || state === "listening") && (
        <>
          <span
            className="absolute inset-4 rounded-full border border-primary/40"
            style={{ animation: "orb-ring 2.2s ease-out infinite" }}
          />
          <span
            className="absolute inset-4 rounded-full border border-primary/25"
            style={{ animation: "orb-ring 2.2s ease-out infinite 1.1s" }}
          />
        </>
      )}

      {/* outer glow */}
      <div
        className={cn(
          "absolute inset-6 rounded-full blur-2xl transition-colors duration-500",
          state === "speaking" && "bg-primary/35",
          state === "listening" && "bg-primary/20",
          state === "thinking" && "bg-chart-3/30",
          state === "connecting" && "bg-muted-foreground/20",
          state === "idle" && "bg-muted/40",
        )}
        style={{
          transform: `scale(${scale})`,
          transition: "transform 80ms linear",
        }}
      />

      {/* core orb */}
      <div
        className={cn(
          "relative flex size-32 items-center justify-center rounded-full border transition-colors duration-500 md:size-36",
          state === "speaking" && "border-primary/60 bg-primary/15",
          state === "listening" && "border-primary/40 bg-card",
          state === "thinking" && "border-chart-3/50 bg-card",
          (state === "idle" || state === "connecting") && "border-border bg-card",
        )}
        style={{
          transform: `scale(${active ? scale : 1})`,
          transition: "transform 80ms linear, border-color 500ms, background-color 500ms",
        }}
      >
        {/* inner pulse for thinking */}
        {state === "thinking" ? (
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-chart-3" style={{ animation: "orb-pulse 1s ease-in-out infinite" }} />
            <span
              className="size-2.5 rounded-full bg-chart-3"
              style={{ animation: "orb-pulse 1s ease-in-out infinite 0.2s" }}
            />
            <span
              className="size-2.5 rounded-full bg-chart-3"
              style={{ animation: "orb-pulse 1s ease-in-out infinite 0.4s" }}
            />
          </div>
        ) : (
          <div
            className={cn(
              "rounded-full transition-colors duration-500",
              state === "speaking" ? "bg-primary" : state === "listening" ? "bg-primary/70" : "bg-muted-foreground/40",
            )}
            style={{
              width: `${28 + level * 56}px`,
              height: `${28 + level * 56}px`,
              transition: "width 80ms linear, height 80ms linear, background-color 500ms",
            }}
          />
        )}
      </div>
    </div>
  )
}
