import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { asc } from "drizzle-orm"

export async function GET() {
  const rows = await db.select().from(bookings).orderBy(asc(bookings.scheduledAt)).limit(200)
  return Response.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const scheduledAt = new Date(String(body.scheduledAt || ""))
  if (!body.title || Number.isNaN(scheduledAt.getTime())) {
    return Response.json({ error: "A title and valid date are required" }, { status: 400 })
  }
  const [row] = await db.insert(bookings).values({
    title: String(body.title).slice(0, 120),
    contactName: body.contactName ? String(body.contactName).slice(0, 100) : null,
    scheduledAt,
    notes: body.notes ? String(body.notes).slice(0, 500) : null,
    status: "confirmed",
  }).returning()
  return Response.json(row, { status: 201 })
}
