import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core"

export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default("general"),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  language: text("language").notNull().default("hinglish"),
  voice: text("voice").notNull().default("abhilash"),
  greeting: text("greeting"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  personaId: integer("persona_id"),
  personaName: text("persona_name"),
  language: text("language").notNull().default("hinglish"),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  summary: text("summary"),
  sentiment: text("sentiment"),
  overallScore: integer("overall_score"),
  scoreBreakdown: jsonb("score_breakdown"),
  avgLatencyMs: integer("avg_latency_ms"),
  turnCount: integer("turn_count").notNull().default(0),
})

export const transcriptTurns = pgTable("transcript_turns", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").notNull(),
  speaker: text("speaker").notNull(),
  content: text("content").notNull(),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  callId: integer("call_id"),
  title: text("title").notNull(),
  contactName: text("contact_name"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
