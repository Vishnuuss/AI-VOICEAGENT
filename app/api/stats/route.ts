import { db } from "@/lib/db"
import { bookings, calls } from "@/lib/db/schema"
import { desc, sql } from "drizzle-orm"

export async function GET() {
  const [totals] = await db
    .select({
      totalCalls: sql<number>`count(*)::int`,
      completedCalls: sql<number>`count(*) filter (where ${calls.status} = 'completed')::int`,
      totalDuration: sql<number>`coalesce(sum(${calls.durationSeconds}), 0)::int`,
      avgScore: sql<number>`coalesce(round(avg(${calls.overallScore}) filter (where ${calls.overallScore} is not null)), 0)::int`,
      avgLatency: sql<number>`coalesce(round(avg(${calls.avgLatencyMs}) filter (where ${calls.avgLatencyMs} is not null)), 0)::int`,
      totalTurns: sql<number>`coalesce(sum(${calls.turnCount}), 0)::int`,
    })
    .from(calls)

  const [bookingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(bookings)

  const sentiments = await db
    .select({
      sentiment: calls.sentiment,
      count: sql<number>`count(*)::int`,
    })
    .from(calls)
    .where(sql`${calls.sentiment} is not null`)
    .groupBy(calls.sentiment)

  const daily = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${calls.startedAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
      avgScore: sql<number>`coalesce(round(avg(${calls.overallScore}) filter (where ${calls.overallScore} is not null)), 0)::int`,
    })
    .from(calls)
    .where(sql`${calls.startedAt} > now() - interval '14 days'`)
    .groupBy(sql`date_trunc('day', ${calls.startedAt})`)
    .orderBy(sql`date_trunc('day', ${calls.startedAt})`)

  const recentCalls = await db.select().from(calls).orderBy(desc(calls.startedAt)).limit(6)

  return Response.json({
    ...totals,
    totalBookings: bookingCount.count,
    sentiments,
    daily,
    recentCalls,
  })
}
