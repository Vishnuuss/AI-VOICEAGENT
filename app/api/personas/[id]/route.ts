import { db } from "@/lib/db"
import { personas } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const personaId = Number(id)
  if (!Number.isFinite(personaId)) return Response.json({ error: "Invalid id" }, { status: 400 })

  const body = await req.json()
  const update: Record<string, unknown> = {}
  if (body.name) update.name = String(body.name)
  if (body.role) update.role = String(body.role)
  if (body.description !== undefined) update.description = body.description ? String(body.description) : null
  if (body.systemPrompt) update.systemPrompt = String(body.systemPrompt)
  if (body.language) update.language = body.language === "telugu" ? "telugu" : "hinglish"
  if (body.voice) update.voice = String(body.voice)
  if (body.greeting !== undefined) update.greeting = body.greeting ? String(body.greeting) : null

  const [row] = await db.update(personas).set(update).where(eq(personas.id, personaId)).returning()
  return Response.json(row)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const personaId = Number(id)
  if (!Number.isFinite(personaId)) return Response.json({ error: "Invalid id" }, { status: 400 })

  await db.delete(personas).where(eq(personas.id, personaId))
  return Response.json({ success: true })
}
