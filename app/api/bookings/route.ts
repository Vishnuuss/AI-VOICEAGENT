import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function GET() {
  const rows = await db.select().from(bookings).orderBy(asc(bookings.scheduledAt)).limit(200)
  return Response.json(rows)
}
