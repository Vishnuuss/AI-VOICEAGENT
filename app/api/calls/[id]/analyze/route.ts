import { db } from "@/lib/db"
import { calls, transcriptTurns } from "@/lib/db/schema"
import { asc, eq } from "drizzle-orm"

export const maxDuration = 60

// Post-call analysis: summary, sentiment, scoring — via Groq (free tier)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const callId = Number(id)
  if (!Number.isFinite(callId)) return Response.json({ error: "Invalid id" }, { status: 400 })

  const turns = await db
    .select()
    .from(transcriptTurns)
    .where(eq(transcriptTurns.callId, callId))
    .orderBy(asc(transcriptTurns.createdAt), asc(transcriptTurns.id))

  if (turns.length === 0) {
    return Response.json({ error: "No transcript to analyze" }, { status: 400 })
  }

  const transcript = turns
    .map((t) => `${t.speaker === "user" ? "USER" : "AGENT"}: ${t.content}`)
    .join("\n")

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `You are a call quality analyst. Analyze the voice call transcript (may be in Hinglish or Telugu) and return STRICT JSON with exactly these keys:
{
  "summary": "2-4 sentence summary of the call in English",
  "sentiment": "positive" | "neutral" | "negative",
  "overall_score": <integer 0-100, quality of the AGENT's performance>,
  "breakdown": {
    "communication": <0-100, clarity and naturalness of agent replies>,
    "helpfulness": <0-100, did the agent actually help>,
    "resolution": <0-100, was the user's goal achieved>,
    "engagement": <0-100, how engaged was the conversation>
  },
  "key_points": ["3-5 short bullet strings of key moments"]
}`,
          },
          { role: "user", content: `TRANSCRIPT:\n${transcript.slice(0, 12000)}` },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[analyze] Groq error:", err)
      return Response.json({ error: "Analysis failed" }, { status: 502 })
    }

    const data = await res.json()
    const analysis = JSON.parse(data.choices[0].message.content)

    const overallScore = Math.max(0, Math.min(100, Math.round(Number(analysis.overall_score) || 0)))

    const [updated] = await db
      .update(calls)
      .set({
        summary: String(analysis.summary || ""),
        sentiment: ["positive", "neutral", "negative"].includes(analysis.sentiment)
          ? analysis.sentiment
          : "neutral",
        overallScore,
        scoreBreakdown: {
          ...analysis.breakdown,
          key_points: analysis.key_points || [],
        },
      })
      .where(eq(calls.id, callId))
      .returning()

    return Response.json(updated)
  } catch (e) {
    console.error("[analyze] error:", e)
    return Response.json({ error: "Analysis failed" }, { status: 500 })
  }
}
